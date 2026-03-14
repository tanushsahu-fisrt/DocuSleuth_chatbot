# config.py - Hybrid Configuration (Cohere + Gemini)

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# ========================================
# API Keys
# ========================================

# Cohere API (for Reranking)
# Get free key from: https://dashboard.cohere.com/api-keys
COHERE_API_KEY = os.getenv("COHERE_API_KEY", "")

# Google Gemini API (for LLM Generation)
# Get free key from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# ========================================
# Cohere Reranking Settings
# ========================================
COHERE_RERANK_MODEL = "rerank-english-v3.0"  # Best English model
COHERE_TOP_N = 3  # Number of documents after reranking
COHERE_MIN_RELEVANCE_SCORE = 0.3  # Threshold (0-1)

# ========================================
# Gemini LLM Settings
# ========================================
GEMINI_MODEL = "gemini-2.0-flash"  # Latest free model
# Alternative: "gemini-1.5-flash" - More stable

GEMINI_TEMPERATURE = 0.1  # Lower = more factual
GEMINI_MAX_OUTPUT_TOKENS = 2048
GEMINI_TOP_P = 0.95
GEMINI_TOP_K = 40

# ========================================
# Retrieval Settings
# ========================================
INITIAL_RETRIEVAL_K = 10  # Candidates before reranking
FINAL_DOCS_K = 3  # Documents for answer generation

# ========================================
# Local Models (Embeddings only)
# ========================================
OLLAMA_BASE_URL = "http://localhost:11434"
OLLAMA_EMBEDDING_MODEL = "nomic-embed-text:latest"

# ========================================
# Qdrant Settings
# ========================================
QDRANT_URL = "http://localhost:6333"
QDRANT_VECTOR_SIZE = 768
QDRANT_DISTANCE_METRIC = "Cosine"

# ========================================
# Text Splitting Settings
# ========================================
CHUNK_SIZE = 1000  # Larger chunks for better context
CHUNK_OVERLAP = 200  # Good overlap for continuity

# ========================================
# Upload Settings
# ========================================
UPLOAD_DIR = "uploads"
BATCH_SIZE = 20

# ========================================
# Memory Optimization
# ========================================
# Since we're using Gemini instead of local Mistral,
# we save ~4-5GB RAM!
ENABLE_MEMORY_OPTIMIZATION = True
OLLAMA_KEEP_ALIVE = False  # Unload embeddings when not in use

# Free tier limits (for reference)
API_LIMITS = {
    "cohere_rerank": {
        "calls_per_month": 1000,
        "calls_per_day": 33,
        "notes": "Perfect for development"
    },
    "gemini": {
        "requests_per_minute": 15,
        "requests_per_day": 1500,
        "notes": "Very generous, more than enough"
    }
}

def get_api_limits_info():
    """Print API usage limits"""
    print("\n📊 API Free Tier Limits:")
    print("\nCohere Reranking:")
    print(f"  • {API_LIMITS['cohere_rerank']['calls_per_month']} calls/month")
    print(f"  • ~{API_LIMITS['cohere_rerank']['calls_per_day']} calls/day")
    
    print("\nGoogle Gemini:")
    print(f"  • {API_LIMITS['gemini']['requests_per_minute']} requests/minute")
    print(f"  • {API_LIMITS['gemini']['requests_per_day']} requests/day")
    
    print("\n💡 This is perfect for development and personal use!")