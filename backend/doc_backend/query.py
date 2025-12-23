import time
import re
from typing import List, Dict, Any
from fastapi import APIRouter
from pydantic import BaseModel
from langchain_qdrant import QdrantVectorStore
from langchain_core.documents import Document
import cohere
from google import genai
from google.genai import types

from embeddings import embedding_model, qdrant_client
from config import COHERE_API_KEY, GEMINI_API_KEY

router = APIRouter()

class QueryRequest(BaseModel):
    question: str
    collection: str

# Initialize Cohere for Reranking
co = cohere.Client(COHERE_API_KEY)

# Initialize Gemini for LLM Generation
gemini_client = genai.Client(api_key=GEMINI_API_KEY)

# Configure Gemini model
GEMINI_MODEL = 'gemini-2.5-flash-lite'

# Enhanced System prompt for Gemini with table awareness
SYSTEM_PROMPT = """You are an intelligent document assistant. Your task is to answer questions based ONLY on the provided context from the documents.

Rules:
1. Answer the question directly and concisely
2. Use information ONLY from the provided context
3. If the context contains tables (marked with | symbols), preserve the table structure in your answer when relevant
4. When referencing data from tables, present it clearly - you can use bullet points or reformatted text for readability
5. If the context doesn't contain enough information to answer the question, say "I cannot find sufficient information in the provided documents to answer this question."
6. Reference page numbers when discussing specific information
7. Be precise and factual
8. Provide a clear, well-structured answer
9. If the retrieved context is not relevant, acknowledge this clearly
10. For tabular data queries, extract and present the specific data points requested

IMPORTANT: When you see markdown tables (with | symbols), treat them as structured data and extract information carefully.

Do not make up information. Only use what is explicitly stated in the context."""

# Table detection keywords in multiple languages
TABLE_KEYWORDS = [
    "table", "टेबल", "तालिका",
    "data", "डेटा", "आंकड़े",
    "list", "सूची", "लिस्ट",
    "comparison", "तुलना",
    "compare", "तुलना करें",
    "statistics", "आंकड़े",
    "numbers", "संख्या",
    "values", "मान",
    "chart", "चार्ट",
    "figure", "आंकड़ा",
    "row", "पंक्ति",
    "column", "स्तंभ"
]

def is_table_query(query: str) -> bool:
    """Detect if query is asking about tabular data"""
    query_lower = query.lower()
    return any(keyword in query_lower for keyword in TABLE_KEYWORDS)

def boost_table_docs(docs: List[Document], is_table_query: bool) -> List[Document]:
    """
    Reorder documents to prioritize table-containing chunks for table queries
    """
    if not is_table_query:
        return docs
    
    table_docs = []
    text_docs = []
    
    for doc in docs:
        metadata = doc.metadata or {}
        has_table = metadata.get("has_table", False)
        
        if has_table:
            table_docs.append(doc)
        else:
            text_docs.append(doc)
    
    # Prioritize table documents but keep some text for context
    return table_docs + text_docs

def rerank_with_cohere(query: str, docs: List[Document], top_k: int = 3, is_table_query: bool = False):
    """
    Rerank documents using Cohere's rerank API with dynamic threshold
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
            top_n=min(top_k * 2, len(documents)),  # Get more candidates
            model="rerank-multilingual-v3.0"
        )
        
        print("\n📊 Cohere Reranking Scores:")
        reranked_docs = []
        
        # Dynamic threshold based on query type
        relevance_threshold = 0.25 if is_table_query else 0.3
        
        for idx, result in enumerate(results.results, 1):
            original_doc = docs[result.index]
            metadata = original_doc.metadata or {}
            has_table = metadata.get("has_table", False)
            
            table_indicator = "📊" if has_table else "📄"
            print(f"  {idx}. {table_indicator} Score: {result.relevance_score:.4f} - Page {metadata.get('page', 'Unknown')}")
            
            # For table queries, be more lenient with table-containing docs
            if is_table_query and has_table:
                adjusted_threshold = relevance_threshold * 0.8  # Lower threshold for tables
            else:
                adjusted_threshold = relevance_threshold
            
            if result.relevance_score > adjusted_threshold:
                reranked_docs.append(original_doc)
        
        # Ensure we return at least some results if we have any decent matches
        if not reranked_docs and results.results:
            # Take top result even if below threshold
            print(f"⚠️ No docs above threshold, taking top result anyway")
            top_result = results.results[0]
            reranked_docs.append(docs[top_result.index])
        
        if not reranked_docs:
            print("⚠️ No relevant documents found")
            return []
        
        # Limit to top_k
        return reranked_docs[:top_k]
        
    except Exception as e:
        print(f"❌ Cohere reranking failed: {str(e)}")
        print("   Falling back to original document order")
        return docs[:top_k]

def format_context_with_tables(docs: List[Document]) -> str:
    """
    Format context highlighting when tables are present
    """
    context_blocks = []
    
    for idx, doc in enumerate(docs, 1):
        metadata = doc.metadata or {}
        page = metadata.get("page", "Unknown")
        has_table = metadata.get("has_table", False)
        chunk_type = metadata.get("chunk_type", "unknown")
        
        header = f"[Document {idx} - Page {page}"
        if has_table:
            header += " - CONTAINS TABLE DATA"
        header += "]"
        
        content = doc.page_content
        
        # Add visual separator for tables
        if has_table and chunk_type == "table_only":
            content = f"TABLE START\n{content}\nTABLE END"
        
        context_block = f"{header}\n{content}\n"
        context_blocks.append(context_block)
    
    return "\n\n".join(context_blocks)

def generate_answer_with_gemini(question: str, context: str, is_table_query: bool) -> str:
    """
    Generate answer using Google Gemini with table-aware prompting
    """
    try:
        # Add extra guidance for table queries
        if is_table_query:
            table_guidance = "\n\nNOTE: This query is asking about tabular/structured data. Pay special attention to any tables in the context (marked with | symbols or TABLE START/END markers). Extract and present the relevant data clearly."
        else:
            table_guidance = ""
        
        full_prompt = f"""{SYSTEM_PROMPT}{table_guidance}

Question: {question}

Context from documents:
{context}

Provide a clear and accurate answer based on the context above."""

        print(f"\n✨ Generating answer with {GEMINI_MODEL}...")
        if is_table_query:
            print("   🔍 Table-aware mode activated")
        
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
        return f"I encountered an error while generating the answer: {str(e)}"

VECTOR_STORE_CACHE = {}

def get_vector_store(collection: str):
    """Get or create vector store for collection"""
    if collection not in VECTOR_STORE_CACHE:
        VECTOR_STORE_CACHE[collection] = QdrantVectorStore(
            collection_name=collection,
            embedding=embedding_model,
            client=qdrant_client
        )
    return VECTOR_STORE_CACHE[collection]

@router.post("/query")
async def query_doc(body: QueryRequest):
    """
    Enhanced query endpoint with table-aware retrieval and generation
    """
    
    vector_store = get_vector_store(body.collection)

    # Detect if this is a table-related query
    table_query = is_table_query(body.question)
    
    # Step 1: Initial retrieval with embeddings
    print(f"\n🔍 Query: {body.question}")
    if table_query:
        print("   📊 Detected as table-related query")
    
    start_retrieval = time.time()
    
    # Retrieve more candidates for table queries
    k_value = 15 if table_query else 10
    initial_docs = vector_store.similarity_search(body.question, k=k_value)
    
    end_retrieval = time.time()
    retrieval_time = round(end_retrieval - start_retrieval, 4)

    print(f"⏱️  Initial Retrieval: {retrieval_time}s")
    print(f"📄 Retrieved {len(initial_docs)} candidates")

    # Step 1.5: Boost table documents if table query
    if table_query:
        initial_docs = boost_table_docs(initial_docs, table_query)
        table_count = sum(1 for d in initial_docs if d.metadata.get("has_table", False))
        print(f"   📊 {table_count} documents contain tables")

    # Step 2: Rerank with Cohere
    start_rerank = time.time()
    top_k = 4 if table_query else 3  # Get more context for table queries
    reranked_docs = rerank_with_cohere(body.question, initial_docs, top_k=top_k, is_table_query=table_query)
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
            "rerank_time": rerank_time,
            "query_type": "table" if table_query else "text"
        }
        return {"response": json.dumps(error_response)}

    # Step 3: Process retrieved documents
    print(f"\n=== Top {len(reranked_docs)} Documents ===")
    locations = []
    
    for idx, d in enumerate(reranked_docs, 1):
        meta = d.metadata if d.metadata else {}
        meta_normalized = {k.lower(): v for k, v in meta.items()}
        
        page = meta_normalized.get("page", "Unknown")
        label = meta_normalized.get("page_label", str(page))
        source = meta_normalized.get("source", "Unknown")
        has_table = meta.get("has_table", False)

        table_marker = "📊" if has_table else "📄"
        print(f"\n[Doc {idx}] {table_marker} Page {page}")
        print(f"Preview: {d.page_content[:150]}...")

        locations.append({
            "page": page,
            "pageIndex": page - 1 if isinstance(page, int) else 0,
            "label": label,
            "snippet": d.page_content[:200] + "..." if len(d.page_content) > 200 else d.page_content,
            "full_text": d.page_content,
            "has_table": has_table,
            "chunk_type": meta.get("chunk_type", "unknown"),
            "char_start": meta.get("char_start"),
            "char_end": meta.get("char_end"),
            "highlightText": d.page_content
        })

    # Build context with table awareness
    context = format_context_with_tables(reranked_docs)

    # Step 4: Generate answer with Gemini
    start_generation = time.time()
    
    try:
        answer = generate_answer_with_gemini(body.question, context, table_query)
        
        end_generation = time.time()
        generation_time = round(end_generation - start_generation, 4)
        
        print(f"⏱️  Gemini Generation: {generation_time}s")
        print(f"\n✅ Answer: {answer[:200]}...")

        # Create enhanced summary
        table_count = sum(1 for loc in locations if loc.get("has_table", False))
        pages = list(set([loc['page'] for loc in locations]))
        
        if table_count > 0:
            summary = f"Found information on page(s): {', '.join(map(str, sorted(pages)))} ({table_count} sections with tables)"
        else:
            summary = f"Found information on page(s): {', '.join(map(str, sorted(pages)))}"

        response_data = {
            "answer": answer,
            "locations": locations,
            "summary": summary,
            "retrieval_time": retrieval_time,
            "rerank_time": rerank_time,
            "generation_time": generation_time,
            "total_time": round(retrieval_time + rerank_time + generation_time, 4),
            "model_used": GEMINI_MODEL,
            "query_type": "table" if table_query else "text",
            "documents_analyzed": len(reranked_docs),
            "tables_found": table_count
        }

        import json
        return {"response": json.dumps(response_data)}

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        import json
        
        error_response = {
            "answer": "I encountered an error while processing your question. Please try again.",
            "locations": locations,
            "summary": "Error occurred during processing",
            "error": str(e)
        }
        return {"response": json.dumps(error_response)}