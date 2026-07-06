"""
Retrieval-Augmented Generation (RAG) service.

Loads the pharmacy's policy .txt files, chunks them, embeds them, and stores
them in a persistent ChromaDB collection. At query time, retrieves the most
relevant chunks for a given transcript/query so the AI analysis service can
ground its classification in the pharmacy's actual policies.

Embedding strategy:
- If OPENAI_API_KEY is set, uses OpenAI embeddings (better quality).
- Otherwise, falls back to ChromaDB's bundled local embedding model
  (all-MiniLM-L6-v2 via onnxruntime), which needs NO API key or internet
  access after its one-time model download. This is what makes RAG work
  out of the box in simulation mode.
"""

import logging
import os
from pathlib import Path

import chromadb
from chromadb.utils import embedding_functions

from app.config import get_settings

logger = logging.getLogger("medicall.rag_service")

settings = get_settings()

KNOWLEDGE_BASE_DIR = Path(__file__).resolve().parent.parent / "knowledge_base"

# Simple fixed-size chunking with overlap. Good enough for short policy docs;
# swap for a token-aware splitter (e.g. LangChain's) if documents grow large.
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50


def _get_embedding_function():
    if settings.llm_enabled:
        return embedding_functions.OpenAIEmbeddingFunction(
            api_key=settings.openai_api_key,
            model_name=settings.openai_embedding_model,
        )
    # Local, no-API-key embedding model bundled with chromadb.
    return embedding_functions.DefaultEmbeddingFunction()


def _get_client() -> chromadb.ClientAPI:
    os.makedirs(settings.chroma_persist_dir, exist_ok=True)
    return chromadb.PersistentClient(path=settings.chroma_persist_dir)


def _get_collection():
    client = _get_client()
    return client.get_or_create_collection(
        name=settings.chroma_collection_name,
        embedding_function=_get_embedding_function(),
        metadata={"hnsw:space": "cosine"},
    )


def _chunk_text(text: str, source: str) -> list[dict]:
    words = text.split()
    chunks = []
    start = 0
    chunk_index = 0
    while start < len(words):
        end = start + CHUNK_SIZE
        chunk_words = words[start:end]
        chunk_text = " ".join(chunk_words)
        chunks.append({"id": f"{source}-{chunk_index}", "text": chunk_text, "source": source})
        start += CHUNK_SIZE - CHUNK_OVERLAP
        chunk_index += 1
    return chunks


def index_knowledge_base() -> dict:
    """
    Load every .txt file in app/knowledge_base, chunk it, and (re)index it
    into the Chroma collection. Safe to call multiple times; re-adding an
    existing chunk id simply upserts it.
    """
    collection = _get_collection()

    if not KNOWLEDGE_BASE_DIR.exists():
        raise FileNotFoundError(f"Knowledge base directory not found: {KNOWLEDGE_BASE_DIR}")

    all_chunks: list[dict] = []
    files_indexed = []
    for file_path in sorted(KNOWLEDGE_BASE_DIR.glob("*.txt")):
        text = file_path.read_text(encoding="utf-8")
        file_chunks = _chunk_text(text, source=file_path.stem)
        all_chunks.extend(file_chunks)
        files_indexed.append(file_path.name)

    if not all_chunks:
        logger.warning("No .txt files found in %s - nothing indexed.", KNOWLEDGE_BASE_DIR)
        return {"files_indexed": [], "chunks_indexed": 0}

    collection.upsert(
        ids=[c["id"] for c in all_chunks],
        documents=[c["text"] for c in all_chunks],
        metadatas=[{"source": c["source"]} for c in all_chunks],
    )

    logger.info("Indexed %d chunks from %d files into RAG collection.", len(all_chunks), len(files_indexed))
    return {"files_indexed": files_indexed, "chunks_indexed": len(all_chunks)}


def is_index_empty() -> bool:
    """Whether the Chroma collection has never been indexed (e.g. fresh/ephemeral disk)."""
    return _get_collection().count() == 0


def query_policies(query_text: str, top_k: int = 3) -> list[dict]:
    """
    Retrieve the top_k most relevant policy chunks for a given query
    (typically the customer's transcript). Returns an empty list if the
    collection hasn't been indexed yet, rather than raising.
    """
    collection = _get_collection()

    if collection.count() == 0:
        logger.warning("RAG collection is empty - call POST /api/rag/index first.")
        return []

    results = collection.query(query_texts=[query_text], n_results=min(top_k, collection.count()))

    documents = results.get("documents", [[]])[0]
    metadatas = results.get("metadatas", [[]])[0]
    distances = results.get("distances", [[]])[0] if results.get("distances") else [None] * len(documents)

    return [
        {"text": doc, "source": meta.get("source", "unknown"), "distance": dist}
        for doc, meta, dist in zip(documents, metadatas, distances)
    ]


def get_policy_context_text(query_text: str, top_k: int = 3) -> str:
    """Convenience helper: retrieve chunks and join them into one context string."""
    chunks = query_policies(query_text, top_k=top_k)
    if not chunks:
        return ""
    return "\n\n".join(f"[{c['source']}]\n{c['text']}" for c in chunks)
