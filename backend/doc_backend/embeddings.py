from langchain_ollama import OllamaEmbeddings
from qdrant_client import QdrantClient

from config import (
    OLLAMA_BASE_URL, 
    OLLAMA_EMBEDDING_MODEL,
)

# Embedding Model
embedding_model = OllamaEmbeddings(
    model=OLLAMA_EMBEDDING_MODEL,
    base_url=OLLAMA_BASE_URL,
    keep_alive=False  # Unload when not in use to save memory
)

# Qdrant Client
qdrant_client = QdrantClient(
    url="https://303814d3-21e6-4d4c-a028-ffa1e799fb89.us-east4-0.gcp.cloud.qdrant.io:6333", 
    api_key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.jWO2wFXVxdEzvSqhcyWvRq6XSnvB9U-ZkyRT3JUG6mk",
    timeout=60,           
    prefer_grpc=False        
)
