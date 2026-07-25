#Extracts text from a file and splits it into overlaping chunks

import io #lets us treat raw bytes in memory as a file object
from pypdf import PdfReader #to read the uploaded pdf

def extract_text(filename: str, file_bytes: bytes):
    if filename.lower().endswith(".pdf"):
        #io.BytesIO wraps the bytes wraps the bytes into a file like object so PdfReader can work with it
        reader = PdfReader(io.BytesIO(file_bytes))
        #extract text from everypage
        #some pdf readers have no extractable text, "" stops that from crashing the program
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    
    #decode bytes as utf-8
    return file_bytes.decode("utf-8", errors = "ignore")

#we can't embed a whole document as one giant vector. Split it into smaller pieces and embedd each one separately
def chunk_text(text: str, chunk_size: int = 300, overlap: int = 50):
    words = text.split() #split the text into individual words
    chunks = []
    start = 0
    
    while start < len(words): #continue until all words have been processed
        end = start + chunk_size 
        chunk = " ".join(words[start:end]) #join the words back into a string
        if chunk.strip(): #remove whitespace from the beginning and ending of the string, check whether something remains
            chunks.append(chunk) #if something remains, append it to the chunks list as a chunk
        
        #move 300 - 50 words forward and start from there
        start += chunk_size - overlap
        
    return chunks
