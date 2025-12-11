import time
from fastapi import APIRouter
from pydantic import BaseModel
from langchain_qdrant import QdrantVectorStore
from langchain_ollama import ChatOllama
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

from embeddings import embedding_model, qdrant_client

router = APIRouter()

class QueryRequest(BaseModel):
    question: str
    collection: str

llm = ChatOllama(
    model="llama3.1:8b-instruct-q4_K_M",
    temperature=0.1
)

# Create a structured prompt template
prompt_template = ChatPromptTemplate.from_messages([
    ("system", """You are an intelligent document assistant. Your task is to answer questions based ONLY on the provided context from the documents.

Rules:
1. Answer the question directly and concisely
2. Use information ONLY from the provided context
3. If the context doesn't contain enough information to answer the question, say "I cannot find sufficient information in the provided documents to answer this question."
4. Reference page numbers when discussing specific information
5. Be precise and factual
6. Provide a clear, well-structured answer"""),
    ("user", """Question: {question}

Context from documents:
{context}

Provide a clear and accurate answer based on the context above.""")
])

@router.post("/query")
async def query_doc(body: QueryRequest):

    vector_store = QdrantVectorStore(
        collection_name=body.collection,
        embedding=embedding_model,
        client=qdrant_client
    )

    # Retrieval phase
    start_retrieval = time.time()
    docs = vector_store.similarity_search(body.question, k=3)
    end_retrieval = time.time()
    retrieval_time = round(end_retrieval - start_retrieval, 4)

    print(f"\n⏱️  Retrieval took: {retrieval_time} seconds")

    # Process retrieved documents
    print("\n\n=== Retrieved Chunks ===")
    locations = []
    context_blocks = []
    
    for idx, d in enumerate(docs, 1):
        print(f"\n--- Document {idx} ---")
        print("RAW METADATA:", d.metadata)
        
        meta = d.metadata if d.metadata else {}
        meta_normalized = {k.lower(): v for k, v in meta.items()}
        
        page = meta_normalized.get("page", "Unknown")
        label = meta_normalized.get("page_label", str(page))
        source = meta_normalized.get("source", "Unknown")

        print(f"PAGE: {page}, LABEL: {label}")
        print("Content preview:", d.page_content[:300])
        print("--------------------------------------------------------")

        # Build locations list for UI
        locations.append({
            "page": page,
            "label": label,
            "snippet": d.page_content[:150] + "..." if len(d.page_content) > 150 else d.page_content
        })

        # Build context for LLM
        context_block = (
            f"[Document {idx} - Page {page}]\n"
            f"{d.page_content}\n"
        )
        context_blocks.append(context_block)

    context = "\n\n".join(context_blocks)

    # Generation phase
    print("\n🤖 Generating answer with LLM...")
    start_generation = time.time()
    
    try:
        # Create the chain
        chain = prompt_template | llm | StrOutputParser()
        
        # Invoke the chain
        answer = chain.invoke({
            "question": body.question,
            "context": context
        })
        
        end_generation = time.time()
        generation_time = round(end_generation - start_generation, 4)
        
        print(f"⏱️  Generation took: {generation_time} seconds")
        print(f"\n✅ Answer: {answer[:200]}...")

        # Create summary from first 2 sources
        summary = f"Found information across {len(locations)} document sections"
        if locations:
            pages = list(set([loc['page'] for loc in locations]))
            summary = f"Information found on page(s): {', '.join(map(str, sorted(pages)))}"

        # Return response in the format expected by frontend
        response_data = {
            "answer": answer,
            "locations": locations,
            "summary": summary,
            "retrieval_time": retrieval_time,
            "generation_time": generation_time
        }

        # Frontend expects response as a JSON string inside "response" key
        import json
        return {
            "response": json.dumps(response_data)
        }

    except Exception as e:
        print(f"❌ Error during generation: {str(e)}")
        import json
        error_response = {
            "answer": f"I encountered an error while processing your question. Please try again.",
            "locations": locations,
            "summary": "Error occurred during processing"
        }
        return {
            "response": json.dumps(error_response)
        }