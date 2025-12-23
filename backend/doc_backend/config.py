# config.py - Hybrid Configuration (Cohere + Gemini)

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

OLLAMA_BASE_URL = "http://localhost:11434"
OLLAMA_EMBEDDING_MODEL = "nomic-embed-text:latest"

