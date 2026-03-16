A Document Search Chatbot that allows users to upload documents and ask questions based on the document content.
The chatbot intelligently searches through the document and returns answers along with highlighted text showing exactly where the answer was found.

This project demonstrates document retrieval, semantic search, and question answering over uploaded documents.

--How It Works

--Document Upload
--The user uploads a document.
--Text Processing
--The document is parsed and divided into smaller chunks.
--Embedding Generation
--Each chunk is converted into vector embeddings.
--Vector Storage
--The embeddings are stored in a vector database.
--User Query
--The user asks a question related to the document.
--Similarity Search
--The system retrieves the most relevant chunks.
--Answer Generation
--The chatbot generates an answer based on the retrieved context.
--Highlighting

The exact text used to generate the answer is highlighted for transparency.

Tech Stack

Frontend
--React.js

Backend
--Python
--FastAPI
--AI & NLP
--LLMs
--Embeddings
--Semantic Search
--Retrieval Augmented Generation (RAG)
--Data Processing
--PDF parsing
--Chunking
--Vector Database
--FAISS

