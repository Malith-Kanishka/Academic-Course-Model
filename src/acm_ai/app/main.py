"""
FastAPI entrypoint for the Agentic AI subsystem.

Internal microservice - called only by ASP.NET Core, never directly by
Flutter/React. The eventual full endpoint per the spec is
POST /api/internal/evaluate-session, running all 4 agents end-to-end; that
lands once Members 2-4's agents exist. For now this exposes Member 1's two
Coordinator operations standalone so the agent is testable/runnable today.
"""
from contextlib import asynccontextmanager
import logging
import os
from typing import Any, Dict, List, Set

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer
from langchain_groq import ChatGroq
from pydantic import BaseModel

from app.agents.coordinator_agent import SessionCoordinatorAgent
from app.agents.knowledge_auditor_agent import audit_student_claim
from app.agents.socratic_adversary_agent import SocraticAdversary
from app.agents.safety_evaluator_agent import SafetyEvaluatorAgent, SessionFinalTranscriptDTO
from app.graph.state import WorkflowState
from app.schemas.audit_schemas import FactAuditRequest, FactAuditResultDTO
from app.schemas.session_schemas import NextTurnDirectiveDTO, SessionAgendaDTO, SessionInitRequest
from app.routers.rag import router as rag_router

# Setup logger for Uvicorn terminal output
logger = logging.getLogger("uvicorn.error")

# Import RAG helper if present
try:
    from app.rag.retriever import get_rag_context
except ImportError:
    def get_rag_context(query: str) -> str:
        return ""


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler to pre-load and verify Groq LLM before startup completes."""
    logger.info("Initializing Groq LLM...")
    groq_api_key = os.getenv("GROQ_API_KEY")
    
    if not groq_api_key:
        logger.warning("GROQ_API_KEY environment variable is not set!")
    else:
        try:
            # Pre-instantiate and warm up Groq model
            model_name = os.getenv("GROQ_MODEL_NAME", "llama-3.3-70b-versatile")
            groq_llm = ChatGroq(groq_api_key=groq_api_key, model_name=model_name)
            
            # Attach to socratic_agent if supported
            if hasattr(socratic_agent, "llm"):
                socratic_agent.llm = groq_llm

            logger.info(f"Groq LLM ({model_name}) loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load Groq LLM: {e}")

    try:
        logger.info("Initializing SentenceTransformer embedding model...")
        SentenceTransformer("all-MiniLM-L6-v2")
        logger.info("Embedding model loaded successfully.")
    except Exception as e:
        logger.error(f"Failed to load embedding model: {e}")

    yield
    logger.info("Shutting down ACM AI Microservice...")


app = FastAPI(title="ACM AI Microservice", version="1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rag_router)

# Initialize the AI agents
_coordinator = SessionCoordinatorAgent()
socratic_agent = SocraticAdversary()
evaluator_agent = SafetyEvaluatorAgent()


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/")
async def root():
    return {"status": "online", "message": "ACM AI Inference Engine is running successfully!"}


@app.post("/api/internal/coordinator/plan-session", response_model=SessionAgendaDTO)
def plan_session(request: SessionInitRequest) -> SessionAgendaDTO:
    try:
        return _coordinator.create_session_agenda(request)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=str(exc))


@app.post("/api/internal/coordinator/next-turn", response_model=NextTurnDirectiveDTO)
def next_turn(state: WorkflowState) -> NextTurnDirectiveDTO:
    try:
        return _coordinator.decide_next_turn(state)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=str(exc))


# --- Request Models ---

class AuditRequest(BaseModel):
    completed_topics: List[str]
    target_topic: str
    rules_db: List[Dict[str, Any]]


class AStarFilterRequest(BaseModel):
    current_node: str
    potential_neighbors: List[str]
    completed_topics: List[str]
    rules_db: List[Dict[str, Any]]


class DialogueRequest(BaseModel):
    session_id: str
    student_text: str
    topic_name: str = "Unknown Topic"
    turn_count: int = 0
    history: List[str] = []



class AIResponse(BaseModel):
    ai_text: str


# --- Knowledge Inference Engine ---

class KnowledgeBaseInferenceEngine:
    def __init__(self):
        self.rules: List[Dict[str, Any]] = []
        self.known_facts: Set[str] = set()

    def add_rule(self, premises: List[str], conclusion: str):
        self.rules.append({"premises": premises, "conclusion": conclusion})

    def add_fact(self, fact: str):
        self.known_facts.add(fact)

    def forward_chain(self) -> Set[str]:
        """Executes forward-chaining using Modus Ponens and Horn Clauses."""
        inferred = set(self.known_facts)
        newly_inferred = True

        while newly_inferred:
            newly_inferred = False
            for rule in self.rules:
                premises = rule["premises"]
                conclusion = rule["conclusion"]

                if all(p in inferred for p in premises) and conclusion not in inferred:
                    inferred.add(conclusion)
                    newly_inferred = True

        return inferred


# --- Endpoints ---

@app.post("/api/ai/audit-topic")
async def audit_topic_endpoint(request: AuditRequest):
    try:
        engine = KnowledgeBaseInferenceEngine()

        for fact in request.completed_topics:
            engine.add_fact(fact)

        for rule in request.rules_db:
            engine.add_rule(rule.get("premises", []), rule.get("conclusion", ""))

        derived_facts = engine.forward_chain()
        is_valid = request.target_topic in derived_facts

        return {
            "target_topic": request.target_topic,
            "is_unlocked": is_valid,
            "derived_knowledge": list(derived_facts),
            "message": f"Topic '{request.target_topic}' is {'unlocked and verified via Forward Chaining' if is_valid else 'locked due to missing prerequisites'}."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/audit", response_model=FactAuditResultDTO)
async def audit_endpoint(request: FactAuditRequest):
    return audit_student_claim(request)


@app.post("/api/ai/process", response_model=AIResponse)
async def process_dialogue(request: DialogueRequest):
    try:
        context = get_rag_context(request.student_text)

        if hasattr(socratic_agent, "generate_response_with_rag"):
            response_text = socratic_agent.generate_response_with_rag(
                student_text=request.student_text,
                context=context
            )
        else:
            response_text = socratic_agent.generate_response(
                student_text=request.student_text,
                topic_name=request.topic_name,
                turn_count=request.turn_count,
                history=request.history
            )


        return AIResponse(ai_text=response_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/internal/evaluate-session")
def evaluate_session_endpoint(payload: SessionFinalTranscriptDTO):
    try:
        # Send to SafetyEvaluatorAgent which will synchronously POST back to C#
        result = evaluator_agent.evaluate_session(payload.model_dump(), send_to_backend=True)
        return result
    except Exception as exc:
        raise HTTPException(status_code=422, detail=str(exc))