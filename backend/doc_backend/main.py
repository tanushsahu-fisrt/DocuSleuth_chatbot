# Main FastAPI App

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


from uploadv1 import router as upload_router
from query import router as query_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router, prefix="/api")
app.include_router(query_router, prefix="/api")


@app.get("/")
def root():
    return {"message": "PDF Chatbot Backend Running 🚀"}

if __name__ == "__main__":
    uvicorn.run("main:app",host= "127.0.0.1", port=8000, reload = True)
    