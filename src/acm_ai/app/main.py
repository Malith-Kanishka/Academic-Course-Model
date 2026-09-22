"""
FastAPI entrypoint for the Agentic AI subsystem.

Internal microservice - called only by ASP.NET Core, never directly by
Flutter/React. The eventual full endpoint per the spec is
POST /api/internal/evaluate-session, running all 4 agents end-to-end; that
lands once Members 2-4's agents exist. For now this exposes Member 1's two
Coordinator operations standalone so the agent is testable/runnable today.
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Set

from app.agents.coordinator_agent import SessionCoordinatorAgent
from app.agents.knowledge_auditor_agent import audit_student_claim
from app.agents.socratic_adversary_agent import SocraticAdversary
from app.graph.state import WorkflowState
from app.schemas.audit_schemas import FactAuditRequest, FactAuditResultDTO
from app.schemas.session_schemas import NextTurnDirectiveDTO, SessionAgendaDTO, SessionInitRequest

app = FastAPI(title="ACM AI Microservice", version="1.0")

# Initialize the AI agents
_coordinator = SessionCoordinatorAgent()
socratic_agent = SocraticAdversary()


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


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


class AuditRequest(BaseModel):
    completed_topics: List[str]
    target_topic: str
    rules_db: List[Dict[str, Any]]

class AStarFilterRequest(BaseModel):
    current_node: str
    potential_neighbors: List[str]
    completed_topics: List[str]
    rules_db: List[Dict[str, Any]]

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

@app.get("/")
async def root():
    return {"status": "online", "message": "ACM AI Inference Engine is running successfully!"}

@app.post("/api/ai/audit")
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

# Define the JSON structure we expect from the C# API
class DialogueRequest(BaseModel):
    session_id: str
    student_text: str

# Define the JSON structure we will send back to the C# API
class AIResponse(BaseModel):
    ai_text: str

@app.post("/api/ai/process", response_model=AIResponse)
async def process_dialogue(request: DialogueRequest):
    try:
        # Pass the text to your LangChain agent
        response_text = socratic_agent.generate_response(request.student_text)

        return AIResponse(ai_text=response_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
