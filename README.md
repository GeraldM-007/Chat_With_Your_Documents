# Chat_With_Your_Documents

This project is part of learning Retrieval Augmented Generation (RAG). It allows a user to upload a PDF (only) and ask questions about it. It is powered by RAG (Retrieval-Augmented Generation) with ChromaDB vector database and Groq LLM API.

## Project Structure

```
app/
├── main.py          # API server
├── ingestion.py     # PDF processing & chunking
├── vectorstore.py   # Vector database integration
├── rag.py           # LLM answer generation
└── data/            # ChromaDB storage (created on first use)

frontend/
├── index.html
├── style.css
└── script.js
```

## Setup

### Prerequisites

- Python 3.9+
- venv
- `pip` package manager/`uv` package manager

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Set Groq API Key

Get your API key from [Groq Console](https://console.groq.com), then create a `.env` file and paste your API key there:

```bash
GROQ_API_KEY=your_api_key_here
```

## Run

To run the project locally, clone the repository using:
```
https://github.com/GeraldM-007/Chat_With_Your_Documents.git
```
Then:

### Backend

```bash
cd app
python main.py
```

Backend runs at `http://127.0.0.1:6070`

<img width="1873" height="1000" alt="image" src="https://github.com/user-attachments/assets/c33dc2f7-0a37-437a-bc17-e84f8b2f8c8d" />

### Frontend

In a new terminal:

```bash
cd frontend
python -m http.server 8000
```

Frontend available at `http://localhost:8000`

<img width="1237" height="1076" alt="image" src="https://github.com/user-attachments/assets/12f88c94-1f59-4a18-bd50-891eb0cf3779" />

## Usage

1. Open `http://localhost:8000` in your browser
2. Upload a PDF document
3. Ask questions about the document
4. Get answers with sources

<img width="1177" height="731" alt="image" src="https://github.com/user-attachments/assets/765c302b-da67-4401-b32d-a95ce28301cb" />
<img width="975" height="790" alt="image" src="https://github.com/user-attachments/assets/76045c9d-ee01-4c5a-855c-e78926ba9781" />

## API Endpoints

- `GET /` — Health check
- `POST /upload` — Upload PDF (returns filename and chunk count)
- `POST /query` — Ask a question (returns answer and sources)

## Tech Stack

- **Backend:** FastAPI, Uvicorn
- **Vector DB:** ChromaDB with SentenceTransformers
- **LLM:** Groq API (openai/gpt-oss-120b)
- **PDF Extraction:** PyPDF
- **Frontend:** HTML, CSS, Vanilla JavaScript

## License

MIT
