from uuid import UUID

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel
from typing import List, Optional

from app.agents.rag_agent import generate_rag_response
from app.db import rag_repository
from app.services.pdf_processor import extract_text_from_pdf

router = APIRouter(prefix="/api/ai/rag", tags=["rag"])


class ChatRequest(BaseModel):
    query: str
    history: List = []
    session_id: Optional[str] = ""
    document_context: Optional[str] = None
    document_filename: Optional[str] = None


@router.get("/sessions")
def get_sessions():
    try:
        return rag_repository.list_sessions()
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Unable to load chat sessions: {exc}")


@router.get("/sessions/{session_id}")
def get_session(session_id: UUID):
    try:
        session = rag_repository.get_session(session_id, include_document_text=False)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Unable to load chat session: {exc}")
    if session is None:
        raise HTTPException(status_code=404, detail="Chat session not found.")
    return session


@router.delete("/sessions/{session_id}")
def remove_session(session_id: UUID):
    try:
        deleted = rag_repository.delete_session(session_id)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Unable to delete chat session: {exc}")
    if not deleted:
        raise HTTPException(status_code=404, detail="Chat session not found.")
    return {"status": "deleted", "session_id": str(session_id)}


@router.delete("/sessions/{session_id}/documents/{document_id}")
def remove_document(session_id: UUID, document_id: UUID):
    try:
        deleted = rag_repository.delete_document(session_id, document_id)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Unable to remove document: {exc}")
    if not deleted:
        raise HTTPException(status_code=404, detail="Document not found in this session.")
    return {"status": "deleted", "document_id": str(document_id)}


@router.options("/chat")
async def options_chat():
    return {}


@router.post("/chat")
def chat(request: ChatRequest):
    try:
        if request.session_id:
            try:
                session_id = UUID(request.session_id)
            except ValueError:
                raise HTTPException(status_code=422, detail="session_id must be a valid UUID.")
            session = rag_repository.get_session(session_id)
            if session is None:
                raise HTTPException(status_code=404, detail="Chat session not found.")
            history = session["messages"]
            documents = session.get("documents", [])
        else:
            title = " ".join(request.query.split()[:8]) or "New chat"
            session_id = rag_repository.create_session(title)
            history = []
            documents = []

        rag_repository.add_message(session_id, "user", request.query)
        agent_query = request.query
        context_sections = [
            f"[Document: {document['filename']}]\n{document['extracted_text']}"
            for document in documents
            if document.get("extracted_text")
        ]
        if request.document_context and not any(
            request.document_context in document.get("extracted_text", "")
            for document in documents
        ):
            filename = request.document_filename or "attached document"
            context_sections.append(f"[Document: {filename}]\n{request.document_context}")
        if context_sections:
            agent_query = (
                "Relevant uploaded document text follows. Use it as source context:\n\n"
                + "\n\n".join(context_sections)
                + "\n\n"
                f"User question: {request.query}"
            )
        ai_answer = generate_rag_response(
            query=agent_query,
            history=history or request.history,
            session_id=str(session_id),
        )
        rag_repository.add_message(session_id, "assistant", ai_answer)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Unable to process chat: {exc}")

    return {
        "response": ai_answer,
        "session_id": str(session_id),
    }


@router.post("/process-document")
async def process_document(
    file: UploadFile = File(...),
    session_id: Optional[UUID] = Form(None),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    try:
        content = await file.read()

        try:
            text = extract_text_from_pdf(content)
        except Exception as exc:
            raise HTTPException(status_code=422, detail=f"Unable to extract PDF text: {exc}")

        if not text:
            raise HTTPException(
                status_code=422,
                detail="No extractable text found in the PDF. Scanned PDFs require OCR.",
            )

        if session_id is not None:
            if rag_repository.get_session(session_id) is None:
                raise HTTPException(status_code=404, detail="Chat session not found.")
        else:
            title = file.filename.rsplit(".", 1)[0].strip() or "Uploaded document"
            session_id = rag_repository.create_session(title[:120])
        document_id = rag_repository.attach_document(session_id, file.filename, text)

        return {
            "status": "success",
            "filename": file.filename,
            "text": text,
            "extracted_text": text,
            "session_id": str(session_id),
            "document_id": str(document_id),
            "message": f"Successfully processed {file.filename}"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")