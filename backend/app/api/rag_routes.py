"""RAG (retrieval-augmented generation) API routes."""

from fastapi import APIRouter, Query

from app.services import rag_service

router = APIRouter(prefix="/rag", tags=["RAG"])


@router.post("/index")
def index_knowledge_base():
    """
    (Re)index every .txt policy document in app/knowledge_base into the
    vector store. Call this once on first run, and again whenever policy
    documents are added or edited.
    """
    return rag_service.index_knowledge_base()


@router.post("/query")
def query_policies(query: str = Query(..., min_length=1), top_k: int = Query(3, ge=1, le=10)):
    """Retrieve the top-k most relevant policy chunks for a free-text query."""
    return {"query": query, "results": rag_service.query_policies(query, top_k=top_k)}
