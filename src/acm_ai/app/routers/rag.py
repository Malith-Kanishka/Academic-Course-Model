from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

from app.agents.rag_agent import generate_rag_response

router = APIRouter(prefix="/api/ai/rag", tags=["rag"])

from typing import List, Optional

class ChatRequest(BaseModel):
    query: str
    history: List = []
    session_id: Optional[str] = ""

@router.get("/sessions")
async def get_sessions():
    return []

@router.options("/chat")
async def options_chat():
    return {}

@router.post("/chat")
async def chat(request: ChatRequest):
    # Ensure a session_id is returned so the frontend tracks it
    resp_session = request.session_id if request.session_id else "demo-session-id"
    
    # Call the RAG agent/LLM
    ai_answer = generate_rag_response(
        query=request.query, 
        history=request.history, 
        session_id=resp_session
    )
    
    return {
        "response": ai_answer,
        "session_id": resp_session
    }
