import os
import re
import shutil
import uuid
from pathlib import Path
from typing import List, Dict

from fastapi import APIRouter, UploadFile, File, BackgroundTasks
from qdrant_client.models import PointStruct

import pymupdf as fitz
import pymupdf4llm
from langchain_text_splitters import RecursiveCharacterTextSplitter

from easyocr import Reader
ocr_reader = Reader(["en", "hi"], gpu=True)

from embeddings import embedding_model, qdrant_client

router = APIRouter()
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# --- Configuration ---
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200
MIN_TEXT_FOR_OCR = 50  # If page has less text, try OCR

# --- Helper Functions ---

def extract_images_from_page(pdf_doc, page_index):
    """Extract all images from a specific PDF page"""
    page = pdf_doc[page_index]
    images = []
    for img in page.get_images(full=True):
        xref = img[0]
        base_image = pdf_doc.extract_image(xref)
        image_bytes = base_image.get("image")
        if image_bytes:
            images.append(image_bytes)
    return images

def ocr_images(image_bytes_list):
    """Perform OCR on list of image bytes"""
    full_text = ""
    for img_bytes in image_bytes_list:
        try:
            ocr_output = ocr_reader.readtext(img_bytes, detail=0)
            if ocr_output:
                full_text += " ".join(ocr_output) + "\n"
        except Exception as e:
            print(f"[WARNING] OCR failed for an image: {e}")
    return full_text.strip()

def detect_tables_in_text(text: str) -> bool:
    """Check if text contains markdown tables"""
    # Look for markdown table patterns
    lines = text.split('\n')
    table_row_count = sum(1 for line in lines if '|' in line and line.strip().startswith('|'))
    return table_row_count >= 2  # At least header + one data row

def extract_tables_from_text(text: str) -> List[str]:
    """Extract complete markdown tables from text"""
    tables = []
    lines = text.split('\n')
    current_table = []
    in_table = False
    
    for line in lines:
        if '|' in line and line.strip().startswith('|'):
            in_table = True
            current_table.append(line)
        elif in_table:
            if line.strip() == '' or not line.strip().startswith('|'):
                # Table ended
                if len(current_table) >= 2:  # Valid table
                    tables.append('\n'.join(current_table))
                current_table = []
                in_table = False
    
    # Handle case where table is at the end
    if current_table and len(current_table) >= 2:
        tables.append('\n'.join(current_table))
    
    return tables

def smart_chunk_text(text: str, page_num: int, filename: str) -> List[Dict]:
    """
    Smart chunking that preserves tables intact and splits regular text
    """
    chunks = []
    
    # First, extract any tables
    tables = extract_tables_from_text(text)
    
    # Remove tables from text temporarily to chunk the rest
    text_without_tables = text
    for table in tables:
        text_without_tables = text_without_tables.replace(table, f"\n[TABLE_PLACEHOLDER_{len(chunks)}]\n")
    
    # Chunk the non-table text
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " ", ""]
    )
    text_chunks = splitter.split_text(text_without_tables)
    
    # Process each text chunk
    for chunk in text_chunks:
        # Check if this chunk contains table placeholders
        table_placeholders = re.findall(r'\[TABLE_PLACEHOLDER_(\d+)\]', chunk)
        
        if table_placeholders:
            # Replace placeholders with actual tables
            for placeholder_idx in table_placeholders:
                idx = int(placeholder_idx)
                if idx < len(tables):
                    chunk = chunk.replace(f"[TABLE_PLACEHOLDER_{idx}]", tables[idx])
        
        if chunk.strip():
            chunks.append({
                "text": chunk,
                "metadata": {
                    "page": page_num,
                    "source": filename,
                    "has_table": detect_tables_in_text(chunk),
                    "chunk_type": "mixed" if detect_tables_in_text(chunk) else "text"
                }
            })
    
    # Add standalone tables that weren't included in text chunks
    for i, table in enumerate(tables):
        # Check if this table was already included in a chunk
        table_included = any(table in chunk["text"] for chunk in chunks)
        if not table_included:
            chunks.append({
                "text": table,
                "metadata": {
                    "page": page_num,
                    "source": filename,
                    "has_table": True,
                    "chunk_type": "table_only"
                }
            })
    
    return chunks

# --- Main Processing Function ---

def create_embeddings_from_pdf(filepath: Path, filename: str, collection_name: str):
    """Process PDF and create embeddings with improved table handling"""
    print(f"[INFO] Processing PDF: {filepath}")
    
    try:
        # Extract markdown with page chunks
        md_pages = pymupdf4llm.to_markdown(str(filepath), page_chunks=True)
        
        # Open PDF for OCR if needed
        pdf_doc = fitz.open(filepath)
        
        all_chunks = []
        
        for page_data in md_pages:
            page_text = page_data["text"]
            page_num = page_data["metadata"]["page"]
            
            # Perform OCR if page appears to be scanned/image-only
            ocr_text = ""
            if len(page_text.strip()) < MIN_TEXT_FOR_OCR:
                print(f"[INFO] Page {page_num} has minimal text, attempting OCR...")
                images = extract_images_from_page(pdf_doc, page_num - 1)
                ocr_text = ocr_images(images)
                if ocr_text:
                    page_text = page_text + "\n\n" + ocr_text
            
            # Smart chunking that preserves tables
            page_chunks = smart_chunk_text(page_text, page_num, filename)
            
            # Add OCR flag to metadata
            for chunk in page_chunks:
                chunk["metadata"]["ocr_used"] = bool(ocr_text)
            
            all_chunks.extend(page_chunks)
        
        pdf_doc.close()
        
        print(f"[INFO] Total chunks prepared: {len(all_chunks)}")
        
        if not all_chunks:
            print("[ERROR] No chunks created from PDF")
            return
        
        # Verify embedding model dimensions
        sample_embedding = embedding_model.embed_query("test")
        vector_size = len(sample_embedding)
        print(f"[INFO] Detected embedding dimension: {vector_size}")
        
        # Create Qdrant collection
        qdrant_client.recreate_collection(
            collection_name=collection_name,
            vectors_config={"size": vector_size, "distance": "Cosine"}
        )
        
        # Batch insert into Qdrant
        points = []
        batch_size = 50
        
        for i, chunk_data in enumerate(all_chunks):
            try:
                emb = embedding_model.embed_query(chunk_data["text"])
                
                points.append(
                    PointStruct(
                        id=i,
                        vector=emb,
                        payload={
                            "page_content": chunk_data["text"],
                            "metadata": chunk_data["metadata"]
                        }
                    )
                )
                
                # Batch upload
                if len(points) >= batch_size:
                    qdrant_client.upsert(collection_name, points=points)
                    print(f"[INFO] Uploaded batch of {len(points)} points")
                    points = []
                    
            except Exception as e:
                print(f"[ERROR] Failed to embed chunk {i}: {e}")
                continue
        
        # Upload remaining points
        if points:
            qdrant_client.upsert(collection_name, points=points)
            print(f"[INFO] Uploaded final batch of {len(points)} points")
        
        print(f"[SUCCESS] Collection '{collection_name}' created with {len(all_chunks)} chunks")
        
    except Exception as e:
        print(f"[ERROR] Failed to process PDF: {e}")
        raise

def cleanup_file(filepath: Path):
    """Remove temporary file"""
    try:
        if filepath.exists():
            os.remove(filepath)
            print(f"[INFO] Removed temporary file: {filepath}")
    except Exception as e:
        print(f"[WARNING] Failed to cleanup file {filepath}: {e}")

# --- API Endpoint ---

@router.post("/upload")
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """Upload PDF and process in background"""
    
    # Save file with unique name
    filepath = UPLOAD_DIR / f"{uuid.uuid4().hex}_{file.filename}"
    
    try:
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to save file: {str(e)}"
        }
    
    unique_collection = f"doc_{uuid.uuid4().hex}"
    
    # Start background processing
    background_tasks.add_task(
        create_embeddings_from_pdf, 
        filepath, 
        file.filename, 
        unique_collection
    )
    
    # Cleanup after processing
    background_tasks.add_task(cleanup_file, filepath)
    
    return {
        "status": "success",
        "message": "File uploaded successfully. Processing started in background.",
        "collection": unique_collection,
        "filename": file.filename
    }