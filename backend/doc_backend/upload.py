import os
import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, BackgroundTasks
from langchain_community.document_loaders import PyPDFLoader
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct

from embeddings import embedding_model, qdrant_client
from utils.splitter import get_text_splitter

router = APIRouter()
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

def create_embeddings_from_pdf(filepath: Path, collection_name: str):
    print(f"[INFO] Loading PDF: {filepath}")

    loader = PyPDFLoader(str(filepath))
    pages = loader.load()

    splitter = get_text_splitter()
    chunks = []

    for p in pages:
        page_num = p.metadata.get("page", 0)
        page_label = p.metadata.get("page_label", "")

        split = splitter.split_text(p.page_content)
        for chunk_text in split:
            chunks.append({
                "text": chunk_text,
                "metadata": {
                    "page": page_num,
                    "page_label": page_label,
                    "source": filepath.name
                }
            })

    print(f"[INFO] Chunks created: {len(chunks)}")

    # Create fresh Qdrant collection
    qdrant_client.recreate_collection(
        collection_name=collection_name,
        vectors_config={"size": 768, "distance": "Cosine"}
    )

    # FIX: Store metadata separately in payload
    points = []
    for idx, ch in enumerate(chunks):
        embedding = embedding_model.embed_query(ch["text"])

        points.append(
            PointStruct(
                id=idx,
                vector=embedding,
                payload={
                    "page_content": ch["text"],  # Changed from "text"
                    "metadata": ch["metadata"]   # Store metadata as nested object
                }
            )
        )

        if len(points) == 20:
            qdrant_client.upsert(collection_name=collection_name, points=points)
            points = []

    if points:
        qdrant_client.upsert(collection_name=collection_name, points=points)

    print("[INFO] Embeddings stored successfully!")

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    filepath = UPLOAD_DIR / file.filename

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    unique_collection = f"doc_{uuid.uuid4().hex}"

    # Run embeddings in background
    background_tasks.add_task(create_embeddings_from_pdf, filepath, unique_collection)

    return {
        "status": "success",
        "message": "File uploaded. Embedding process started.",
        "collection": unique_collection,
        "filename": file.filename
    }
