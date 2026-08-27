// Change this if your FastAPI backend runs somewhere other than the default
// uvicorn.run(...) config in main.py.
const API_BASE_URL = "http://127.0.0.1:6070";

// Matches QueryRequest.top_k's default in main.py. Change here if you want
// the frontend to ask for a different number of chunks.
const TOP_K = 4;

const backendStatus = document.getElementById("backend-status");
const backendStatusText = document.getElementById("backend-status-text");
const apiBaseLabel = document.getElementById("api-base-label");

const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("file-input");
const dropzoneText = document.getElementById("dropzone-text");
const uploadBtn = document.getElementById("upload-btn");
const uploadStatus = document.getElementById("upload-status");
const currentDoc = document.getElementById("current-doc");

const chatLog = document.getElementById("chat-log");
const questionForm = document.getElementById("question-form");
const questionInput = document.getElementById("question-input");
const askBtn = document.getElementById("ask-btn");
const queryStatus = document.getElementById("query-status");

let selectedFile = null;

apiBaseLabel.textContent = API_BASE_URL;

// ----------------------------------------------------------------
// Backend health check (GET /)
// ----------------------------------------------------------------

async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/`);
    if (!res.ok) throw new Error("not ok");
    setBackendStatus("online", "Backend connected");
  } catch {
    setBackendStatus("offline", "Backend unreachable");
  }
}

function setBackendStatus(state, label) {
  backendStatus.classList.remove("is-online", "is-offline");
  backendStatus.classList.add(`is-${state}`);
  backendStatusText.textContent = label;
}

checkBackendHealth();

// ----------------------------------------------------------------
// File selection — click (via label) and drag/drop
// ----------------------------------------------------------------

fileInput.addEventListener("change", () => {
  if (fileInput.files.length > 0) {
    setSelectedFile(fileInput.files[0]);
  }
});

["dragenter", "dragover"].forEach((evt) => {
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.add("is-dragover");
  });
});

["dragleave", "drop"].forEach((evt) => {
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.remove("is-dragover");
  });
});

dropzone.addEventListener("drop", (e) => {
  const file = e.dataTransfer.files[0];
  if (file) {
    fileInput.files = e.dataTransfer.files;
    setSelectedFile(file);
  }
});

function setSelectedFile(file) {
  selectedFile = file;
  dropzoneText.textContent = `${file.name} selected`;
  dropzone.classList.add("has-file");
  uploadBtn.disabled = false;
  setStatus(uploadStatus, "", null);
}

// ----------------------------------------------------------------
// Upload — POST /upload (multipart/form-data)
// ----------------------------------------------------------------

uploadBtn.addEventListener("click", async () => {
  if (!selectedFile) return;

  uploadBtn.disabled = true;
  setStatus(uploadStatus, `Reading and indexing ${selectedFile.name}…`, "loading");

  // Field name must be "file" — it has to match the UploadFile parameter
  // name in main.py's upload_document(file: UploadFile = File(...)).
  const formData = new FormData();
  formData.append("file", selectedFile);

  try {
    const res = await fetch(`${API_BASE_URL}/upload`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error(await extractErrorMessage(res));
    }

    const data = await res.json();
    setStatus(
      uploadStatus,
      `Indexed ${data.filename} — ${data.chunks_created} chunks ready to query.`,
      "success"
    );
    currentDoc.textContent = `Currently loaded: ${data.filename}`;
    setBackendStatus("online", "Backend connected");
  } catch (err) {
    setStatus(uploadStatus, describeError(err, "Couldn't process the document"), "error");
  } finally {
    uploadBtn.disabled = false;
  }
});

// ----------------------------------------------------------------
// Ask a question — POST /query (application/json)
// ----------------------------------------------------------------

questionForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const question = questionInput.value.trim();
  if (!question) return;

  clearEmptyState();
  appendMessage("question", question);
  questionInput.value = "";
  askBtn.disabled = true;
  setStatus(queryStatus, "Searching the document for an answer…", "loading");

  try {
    const res = await fetch(`${API_BASE_URL}/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, top_k: TOP_K }),
    });

    if (!res.ok) {
      throw new Error(await extractErrorMessage(res));
    }

    const data = await res.json();
    appendMessage("answer", data.answer, data.sources);
    setStatus(queryStatus, "", null);
    setBackendStatus("online", "Backend connected");
  } catch (err) {
    setStatus(queryStatus, describeError(err, "Couldn't get an answer"), "error");
  } finally {
    askBtn.disabled = false;
  }
});

// ----------------------------------------------------------------
// Rendering helpers
// ----------------------------------------------------------------

function clearEmptyState() {
  const empty = chatLog.querySelector(".empty-state");
  if (empty) empty.remove();
}

function appendMessage(kind, text, sources) {
  const wrapper = document.createElement("div");
  wrapper.className = `message message-${kind}`;

  const label = document.createElement("span");
  label.className = "message-label";
  label.textContent = kind === "question" ? "You" : "Answer";
  wrapper.appendChild(label);

  const p = document.createElement("p");
  p.textContent = text; // textContent, never innerHTML — text may be arbitrary LLM output
  wrapper.appendChild(p);

  if (kind === "answer" && Array.isArray(sources) && sources.length > 0) {
    const sourcesEl = document.createElement("div");
    sourcesEl.className = "sources";

    const sourcesLabel = document.createElement("span");
    sourcesLabel.className = "sources-label";
    sourcesLabel.textContent = "Sources";
    sourcesEl.appendChild(sourcesLabel);

    sources.forEach((s) => {
      const chip = document.createElement("span");
      chip.className = "source-chip";
      chip.textContent = `${s.source} · chunk ${s.chunk_index}`;
      sourcesEl.appendChild(chip);
    });

    wrapper.appendChild(sourcesEl);
  }

  chatLog.appendChild(wrapper);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function setStatus(el, message, type) {
  el.textContent = message;
  el.className = "status" + (type ? ` status-${type}` : "");
}

// ----------------------------------------------------------------
// Error handling
// ----------------------------------------------------------------

// FastAPI error bodies look like either {"detail": "some string"} for
// raised HTTPExceptions, or {"detail": [{"msg": "...", "loc": [...]}]}
// for pydantic validation errors (e.g. a missing "question" field).
async function extractErrorMessage(res) {
  try {
    const data = await res.json();
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail)) {
      return data.detail.map((d) => d.msg || JSON.stringify(d)).join("; ");
    }
  } catch {
    // Response wasn't JSON — fall through to the generic message below.
  }
  return `Server responded with status ${res.status}`;
}

function describeError(err, prefix) {
  // A fetch() call rejects with a generic TypeError when the request never
  // reached the server at all — backend down, wrong URL, or blocked by CORS.
  if (err instanceof TypeError) {
    return `Couldn't reach the server at ${API_BASE_URL}. Make sure the FastAPI backend is running and CORS is enabled.`;
  }
  return `${prefix}: ${err.message}`;
}
