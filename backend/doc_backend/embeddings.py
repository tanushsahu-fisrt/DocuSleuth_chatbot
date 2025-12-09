#Shared embedding model + qdrant client
 
from langchain_ollama import OllamaEmbeddings
from qdrant_client import QdrantClient

# Embedding Model
embedding_model = OllamaEmbeddings(
    model="nomic-embed-text:latest",
    base_url="http://localhost:11434",
    keep_alive=True
)

# Qdrant Client
qdrant_client = QdrantClient(url="http://localhost:6333")
