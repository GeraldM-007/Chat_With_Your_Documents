#The manager. Receives HTTP requests and delegates the work to ingestion.py and vectorstore.py
import uvicorn
from pydantic import BaseModel
from fastapi import FastAPI, UploadFile, File
from ingestion import extract_text, chunk_text
from vectorstore import add_chunks, search_chunks
from rag import generate_answer
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title = "Document Intelligence API")

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  #  fine for local dev; restrict to your real origin in prod env
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    question: str 
    top_k: int = 4 

@app.get("/")
def root():
    return {"status": "healthy"}

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    contents = await file.read()
    text = extract_text(file.filename, contents)
    chunks = chunk_text(text)
    n = add_chunks(doc_id=file.filename, chunks=chunks)
    return {"filename": file.filename, "chunks_created": n}

@app.post("/query") 
async def query_documents(request: QueryRequest):
    results = search_chunks(request.question, top_k=request.top_k)
    return generate_answer(request.question, results)

if __name__ == "__main__":
    uvicorn.run("main:app", reload = True, host = "127.0.0.1", port = 6070)
    
