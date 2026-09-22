"""
FastAPI entrypoint for the Agentic AI subsystem.

Internal microservice - called only by ASP.NET Core, never directly by
Flutter/React. The eventual full endpoint per the spec is
POST /api/internal/evaluate-session, running all 4 agents end-to-end; that
lands once Members 2-4's agents exist. For now this exposes Member 1's two
Coordinator operations standalone so the agent is testable/runnable today.
"""
from fastapi import FastAPI, HTTPException

from app.agents.coordinator_agent import SessionCoordinatorAgent
from app.graph.state import WorkflowState
from app.schemas.session_schemas import NextTurnDirectiveDTO, SessionAgendaDTO, SessionInitRequest

app = FastAPI(title="ACM Agentic AI Subsystem")
_coordinator = SessionCoordinatorAgent()


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
