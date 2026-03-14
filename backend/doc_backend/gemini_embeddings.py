import os
import google.generativeai as genai

genai.configure(api_key="AIzaSyCPJYb4sIE1_s073V3IQh1DpzTLKe61oU4")

GEMINI_EMBED_MODEL = "models/text-embedding-004"
GEMINI_VECTOR_DIM = 768  # fixed

def gemini_embed(text: str) -> list[float]:
    result = genai.embed_content(
        model=GEMINI_EMBED_MODEL,
        content=text,
        task_type="retrieval_document"
    )
    return result["embedding"]
