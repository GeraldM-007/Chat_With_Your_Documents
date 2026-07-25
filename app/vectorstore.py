#Turn chunks into vectors and save them in ChromaDB database

import chromadb #our database
from chromadb.utils import embedding_functions

#create a persistent chromaDB database
client = chromadb.PersistentClient(path="./data/chroma_db")

#build an embedding function powerd by the provided model(turn words into vectors)
embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(model_name = "all-MiniLM-L6-v2")

#collection is a table in chromadb
collection = client.get_or_create_collection(name="documents", embedding_function=embedding_fn)

#insert a batch of text chunks into the collection
def add_chunks(doc_id: str, chunks: list[str]):
    #build a unique id per chunk
    ids = [f"{doc_id} {i}" for i in range(len(chunks))]
    
    metadatas = [{"source": doc_id, "chunk_index": i} for i in range(len(chunks))]
    
    #insert all the chunks into the chroma database
    collection.add(documents = chunks, metadatas = metadatas, ids = ids)
    return len(chunks)

#telling chromadb how to search the stored vectors
def search_chunks(query: str, top_k: int = 4):
    return collection.query(query_texts = [query], n_results = top_k)


