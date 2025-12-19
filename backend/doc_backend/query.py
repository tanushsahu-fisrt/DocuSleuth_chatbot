import time
from fastapi import APIRouter
from pydantic import BaseModel
from langchain_qdrant import QdrantVectorStore
import cohere
from google import genai
from google.genai import types

from embeddings import embedding_model, qdrant_client
from config import COHERE_API_KEY, GEMINI_API_KEY
import ollama

router = APIRouter()

class QueryRequest(BaseModel):
    question: str
    collection: str

# Initialize Cohere for Reranking
co = cohere.Client(COHERE_API_KEY)

# Initialize Gemini for LLM Generation
gemini_client = genai.Client(api_key=GEMINI_API_KEY)

# Configure Gemini model
GEMINI_MODEL ='gemini-2.5-flash-lite'

# System prompt for Gemini
SYSTEM_PROMPT = """You are an intelligent document assistant. Your task is to answer questions based ONLY on the provided context from the documents.

Rules:
1. Answer the question directly and concisely
2. Use information ONLY from the provided context
3. If the context doesn't contain enough information to answer the question, say "I cannot find sufficient information in the provided documents to answer this question."
4. Reference page numbers when discussing specific information
5. Be precise and factual
6. Provide a clear, well-structured answer
7. If the retrieved context is not relevant, acknowledge this clearly

Do not make up information. Only use what is explicitly stated in the context."""

def rerank_with_cohere(query: str, docs, top_k: int = 3):
    """
    Rerank documents using Cohere's rerank API
    """
    if not docs:
        return []
    
    try:
        # Prepare documents for Cohere
        documents = [doc.page_content for doc in docs]
        
        # Call Cohere rerank API
        results = co.rerank(
            query=query,
            documents=documents,
            top_n=top_k,
            # model="rerank-english-v3.0"
            model="rerank-multilingual-v3.0"
        )
        
        print("\n📊 Cohere Reranking Scores:")
        reranked_docs = []
        
        for idx, result in enumerate(results.results, 1):
            original_doc = docs[result.index]
            print(f"  {idx}. Score: {result.relevance_score:.4f} - Page {original_doc.metadata.get('page', 'Unknown')}")
            
            # Filter by relevance threshold
            if result.relevance_score > 0.3:
                reranked_docs.append(original_doc)
        
        if not reranked_docs:
            print("⚠️ No documents passed relevance threshold (0.3)")
            return []
        
        return reranked_docs
        
    except Exception as e:
        print(f"❌ Cohere reranking failed: {str(e)}")
        print("   Falling back to original document order")
        return docs[:top_k]

    
def generate_answer_with_gemini(question: str, context: str) -> str:
    """
    Generate answer using Google gemini-2.5-flash API.
    """
    try:
        # Construct the final prompt combining system instructions and context
        full_prompt = f"""{SYSTEM_PROMPT}

Question: {question}

Context from documents:
{context}

Provide a clear and accurate answer based on the context above."""

        print(f"\n✨ Generating answer with {GEMINI_MODEL} Flash...")
        
        # Using the new Google GenAI SDK syntax
        response = gemini_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=full_prompt,
            config=types.GenerateContentConfig(
                temperature=0.1,
                max_output_tokens=2048,
            ),
        )
        
        return response.text
        
    except Exception as e:
        print(f"❌ Gemini generation failed: {str(e)}")
        return f"I encountered an error with the Gemini API: {str(e)}"

VECTOR_STORE_CACHE = {}

def get_vector_store(collection: str):
    if collection not in VECTOR_STORE_CACHE:
        VECTOR_STORE_CACHE[collection] = QdrantVectorStore(
            collection_name=collection,
            embedding=embedding_model,
            client=qdrant_client
        )
    return VECTOR_STORE_CACHE[collection]

@router.post("/query")
async def query_doc(body: QueryRequest):
    
    vector_store = get_vector_store(body.collection)

    # Step 1: Initial retrieval with embeddings
    print(f"\n🔍 Query: {body.question}")
    start_retrieval = time.time()
    initial_docs = vector_store.similarity_search(body.question, k=10)
    end_retrieval = time.time()
    retrieval_time = round(end_retrieval - start_retrieval, 4)

    print(f"⏱️  Initial Retrieval: {retrieval_time}s")
    print(f"📄 Retrieved {len(initial_docs)} candidates")

    # Step 2: Rerank with Cohere
    start_rerank = time.time()
    reranked_docs = rerank_with_cohere(body.question, initial_docs, top_k=3)
    end_rerank = time.time()
    rerank_time = round(end_rerank - start_rerank, 4)
    
    print(f"⏱️  Cohere Reranking: {rerank_time}s")
    print(f"✅ Selected {len(reranked_docs)} most relevant documents")

    # Check if we have any relevant documents
    if not reranked_docs:
        import json
        error_response = {
            "answer": "I couldn't find any relevant information in the document to answer your question. Please try rephrasing your question or ask about a different topic.",
            "locations": [],
            "summary": "No relevant information found",
            "retrieval_time": retrieval_time,
            "rerank_time": rerank_time
        }
        return {"response": json.dumps(error_response)}

    # Step 3: Process retrieved documents
    print("\n=== Top 3 Documents ===")
    locations = []
    context_blocks = []
    
    for idx, d in enumerate(reranked_docs, 1):
        meta = d.metadata if d.metadata else {}
        meta_normalized = {k.lower(): v for k, v in meta.items()}
        
        page = meta_normalized.get("page", "Unknown")
        label = meta_normalized.get("page_label", str(page))
        source = meta_normalized.get("source", "Unknown")

        print(f"\n[Doc {idx}] Page {page}")
        print(f"Preview: {d.page_content[:150]}...")

        locations.append({
            "page": page,
            "pageIndex": page - 1 if isinstance(page, int) else 0,
            "label": label,
            "snippet": d.page_content[:150] + "..." if len(d.page_content) > 150 else d.page_content,
            "full_text": d.page_content,
            "char_start": meta.get("char_start"),
            "char_end": meta.get("char_end"),
            "highlightText": d.page_content
        })

        # Build context for LLM
        context_block = f"[Document {idx} - Page {page}]\n{d.page_content}\n"
        context_blocks.append(context_block)

    context = "\n\n".join(context_blocks)

    # Step 4: Generate answer with Gemini
    start_generation = time.time()
    
    try:
        answer = generate_answer_with_gemini(body.question, context)
        
        end_generation = time.time()
        generation_time = round(end_generation - start_generation, 4)
        
        print(f"⏱️  Gemini Generation: {generation_time}s")
        print(f"\n✅ Answer: {answer[:200]}...")

        # Create summary
        summary = f"Found information across {len(locations)} document sections"
        if locations:
            pages = list(set([loc['page'] for loc in locations]))
            summary = f"Information found on page(s): {', '.join(map(str, sorted(pages)))}"

        response_data = {
            "answer": answer,
            "locations": locations,
            "summary": summary,
            "retrieval_time": retrieval_time,
            "rerank_time": rerank_time,
            "generation_time": generation_time,
            "model_used": "mistral:7b-instruct-q4_K_M (Local)"
        }

        import json
        return {"response": json.dumps(response_data)}

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import json
        error_response = {
            "answer": "I encountered an error while processing your question. Please try again.",
            "locations": locations,
            "summary": "Error occurred during processing"
        }
        return {"response": json.dumps(error_response)}