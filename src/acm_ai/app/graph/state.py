"""
Shared LangGraph workflow state.

One state object flows through all 4 agent nodes for a single live session.
Each field below is commented with which member's agent reads/writes it, so
whoever builds nodes 2-4 knows exactly what to plug in. Only the Member 1
(Coordinator) fields are populated by real logic today - the rest are typed
placeholders for the other agents' nodes.
"""
from __future__ import annotations

from typing import Literal, TypedDict
from uuid import UUID

from app.schemas.session_schemas import NextTurnDirectiveDTO, SessionAgendaDTO


class WorkflowState(TypedDict, total=False):
    # --- Session identity (set once, at session start) ---
    session_id: UUID
    student_id: UUID
    topic_id: UUID
    module_id: UUID | None

    # --- [MEMBER 1] Coordinator: session plan + live turn routing ---
    agenda: SessionAgendaDTO
    current_phase_index: int
    next_turn_directive: NextTurnDirectiveDTO

    # --- [MEMBER 2] Knowledge Auditor: latest fact-check result for this turn ---
    # Populate with FactAuditResultDTO fields once knowledge_auditor_agent.py exists.
    latest_accuracy_score: float | None  # 0.0-1.0, from FactAuditResultDTO
    latest_misconceptions: list[str]

    # --- [MEMBER 3] Socratic Adversary: live struggle signals ---
    # Populate once socratic_adversary_agent.py / member3_tools.py exist.
    latest_hesitation_ms: int | None
    turn_count: int

    # --- [MEMBER 4] Safety Evaluator: final grading + HITL pause ---
    # Populate once safety_evaluator_agent.py exists.
    workflow_status: Literal[
        "ANALYZING", "PAUSED_FOR_PROFESSOR_APPROVAL", "APPROVED_ACTIVE", "EVALUATION_FAILED"
    ]
