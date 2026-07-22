#Extracts text from a file and splits it into overlaping chunks

import io #lets us treat raw bytes in memory as a file object
from pypdf import PdfReader #to read the uploaded pdf

def extract_text(filename: str, file_bytes: bytes):
    if filename.lower().endswith(".pdf"):
        #io.BytesIO wraps the bytes wraps the bytes into a file like object so PdfReader can work with it
        reader = PdfReader(io.BytesIO(file_bytes))
        #some pdf readers have no extractable text, "" stops that from crashing the program
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    
    #decode bytes as utf-8
    return file_bytes.decode("utf-8", errors = "ignore")

#we can't embed a whole document as one giant vector. Split it into smaller pieces and embed each one separately
def chunk_text(text: str, chunk_size: int = 300, overlap: int = 50):
    words = text.split()
    chunks = []
    start = 0
    
    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        if chunk.strip():
            chunks.append(chunk)
        
        start += chunk_size - overlap
        
    return chunks
