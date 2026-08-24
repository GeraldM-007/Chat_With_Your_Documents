#Create a prompt that will be inserted into the LLM, tell the LLM how to answer then present the answer and it's source

import os 
from dotenv import load_dotenv
from groq import Groq

#load environment variables 
load_dotenv()

#create a Groq client that our application will use communicate with Groq's API
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

#Building the prompt that will be sent to the LLM
def build_prompt(question: str, chunks: list[str], metadatas: list[dict]):
    blocks = [] #will hold the formatted version for each chunk
    
    #loop through the chunks and metadatas, combine corresponding elements
    for i, (chunk, meta) in enumerate(zip(chunks, metadatas), start=1):
        # format the combined elements and add them to the blocks list 
        blocks.append(f"[Source {i}: {meta['source']}, chunk {meta['chunk_index']}]\n{chunk}")
        
    #define the context for the LLM
    context = "\n\n".join(blocks)
    
    #Build the prompt
    return (
        "You are helpful assistant. Use the context below to answer the question"
        "in a friendly, clear way. If context does not contain the answer"
        "say so politely or say you do not have enough infromation - do not guess"
        "Reference relevant source using [Source N]"
        f"Context: \n{context} \n\n Question: {question} \n\n Answer: "
    )

#generating the final answer
def generate_answer(question: str, search_results: dict):
    #Extract the contents of the chromaDB dictionary.
    chunks = search_results["documents"][0]
    metadatas = search_results["metadatas"][0]
    
    #safety check. If vector store is empty(nothing uploaded yet), return a helpful message instead of a blank prompt or crushing the program
    if not chunks:
        return {"answer": "No documents have been uploaded yet", "sources": []}
    
    prompt = build_prompt(question, chunks, metadatas)
    response = client.chat.completions.create(
        model = "moonshotai/kimi-k2-instruct",
        max_tokens = 500,
        messages = [{"role": "user", "content": prompt}]
    )

    answer_text = response.choices[0].message.content #take the first generated response and extract the actual message generate by the LLM
    sources = [{"source": meta['source'], "chunk_index": meta['chunk_index']} for meta in metadatas] #The document chunks used to answer the question
    return {"answer": answer_text, "sources": sources} #return the answer + the chunks used to arrive at the answer