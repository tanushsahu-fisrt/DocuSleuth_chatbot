import os
import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, BackgroundTasks
from langchain_community.document_loaders import PyPDFLoader
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct

import pymupdf as fitz

from easyocr import Reader
ocr_reader = Reader(["en","hi"],gpu=True)

from embeddings import embedding_model, qdrant_client
from utils.splitter import get_text_splitter

router = APIRouter()
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Extract Images From PDF Page
def extract_images_from_page(pdf_doc, page_index):
    page = pdf_doc[page_index]
    images = []
    
    for img in page.get_images(full=True):
        xref = img[0]
        base_image = pdf_doc.extract_image(xref)
        image_bytes = base_image.get("image")
        if image_bytes:
            images.append(image_bytes)

    return images

# OCR on All Images in the Page
def ocr_images(image_bytes_list):
    full_text = ""

    for img_bytes in image_bytes_list:
        ocr_output = ocr_reader.readtext(img_bytes, detail=0)
        if ocr_output:
            full_text += " ".join(ocr_output) + "\n"

    return full_text.strip()

def create_embeddings_from_pdf(filepath: Path, filename: str , collection_name: str):
    print(f"[INFO] Loading PDF: {filepath}")

    # Load text pages
    loader = PyPDFLoader(str(filepath))
    pages = loader.load()

    # Load PyMuPDF for images
    pdf_doc = fitz.open(filepath)
    
    splitter = get_text_splitter()
    chunks = []

    for idx, p in enumerate(pages):
        page_num = p.metadata.get("page", idx)
        
        # 1. Extract normal text
        text_content = p.page_content or ""

        # 2. Extract page images
        images = extract_images_from_page(pdf_doc, idx)

        # 3. OCR from images
        ocr_text = ocr_images(images)

        # 4. Combine everything
        combined_text = text_content
        if ocr_text:
            combined_text += "\n" + ocr_text

        # 5. Split for embeddings
        split_chunks = splitter.split_text(combined_text)

        # Track where each chunk appears in the page
        current_position = 0
        for chunk in split_chunks:
            
            # Find chunk position in full page text
            chunk_start = text_content.find(chunk, current_position)
            chunk_end = chunk_start + len(chunk)

            chunks.append({
                "text": chunk,
                "metadata": {
                    "page": page_num + 1,  # 1-based indexing,
                    "source": filepath.name,
                    "ocr_used": bool(ocr_text),
                    "char_start": chunk_start,  # ← Position in page
                    "char_end": chunk_end,      # ← Position in page
                    "full_page_text": text_content[:500]  # ← Preview of full page text 
                }
            })
            
            current_position = chunk_end
    print(f"[INFO] Total chunks prepared: {len(chunks)}")


    # Create Qdrant Collection
    qdrant_client.recreate_collection(
        collection_name=collection_name,
        vectors_config={"size": 768, "distance": "Cosine"}
    )

    # Insert into Qdrant
    points = []

    for i, chunk in enumerate(chunks):
        emb = embedding_model.embed_query(chunk["text"])

        points.append(
            PointStruct(
                id=i,
                vector=emb,
                payload={
                    "page_content": chunk["text"],
                    "metadata": chunk["metadata"]
                }
            )
        )

        # Batch upload every 20 points
        if len(points) == 20:
            qdrant_client.upsert(collection_name, points=points)
            points = []

    if points:
        qdrant_client.upsert(collection_name, points=points)

    print("[INFO] OCR + Text Embeddings stored successfully!")

def cleanup_file(filepath : Path):
    if filepath.exists():
        os.remove(filepath)
        print(f"[INFO] Cleaned Up File")

@router.post("/upload")
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    filepath = UPLOAD_DIR / file.filename

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    unique_collection = f"doc_{uuid.uuid4().hex}"

    # Run embeddings in background
    background_tasks.add_task(create_embeddings_from_pdf, filepath, file.filename , unique_collection)
    
    #remove file from server
    background_tasks.add_task(cleanup_file , filepath)
    
    return {
        "status": "success",
        "message": "File uploaded. Embedding process started.",
        "collection": unique_collection,
        "filename": file.filename
    }
