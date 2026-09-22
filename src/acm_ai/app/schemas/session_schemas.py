"""
Session planning & live-turn-routing schemas.

Owned by Member 1 (Session Coordinator & Strategy Agent) per the project spec's
Input/Output Contract: "Takes SessionInitRequest; outputs a structured
SessionAgendaDTO and real-time NextTurnDirectiveDTO."

These are shared, untagged files in the spec - other members' schemas
(FactAuditResultDTO, SpokenDialogueDTO, FinalEvaluationSummaryDTO, etc.) belong
in audit_schemas.py / dialogue_schemas.py / evaluation_schemas.py, not here.
"""
from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field


# --- Tool return types (member1_tools.py) ---

class WeaknessDTO(BaseModel):
    """One historically weak topic for a student, derived from past mastery_reports."""
    topic_name: str
    mastery_score: int = Field(..., ge=0, le=100)
    flagged_misconceptions: list[str] = Field(default_factory=list)
    session_id: UUID | None = None
    reported_at: datetime | None = None


class PrerequisiteDTO(BaseModel):
    """A topic that should be understood before the requested topic, derived from
    Topic.OrderIndex within the same Module (no explicit prerequisite graph exists
    yet - this is the reasonable interpretation given the current schema)."""
    topic_id: UUID
    title: str
    order_index: int


# --- Session planning (SessionInitRequest -> SessionAgendaDTO) ---

class SessionInitRequest(BaseModel):
    student_id: UUID  # matches Users.Id (now uuid on both sides - see member1_tools.py)
    topic_id: UUID
    module_id: UUID | None = None


class SessionPhaseName(str, Enum):
    CORE_DEFINITIONS = "Core Definitions"
    ANALOGY_TESTING = "Analogy Testing"
    EDGE_CASE_GRILLING = "Edge-Case Grilling"


class SessionPhase(BaseModel):
    order: int
    name: SessionPhaseName
    subtopics: list[str]
    focus_weaknesses: list[str] = Field(default_factory=list)
    rationale: str = ""


class SessionAgendaDTO(BaseModel):
    session_topic_id: UUID
    student_id: UUID
    phases: list[SessionPhase]
    required_subtopics: list[str]
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# --- Live persona routing (NextTurnDirectiveDTO) ---

class PersonaType(str, Enum):
    """The two personas Member 3's Socratic Adversary agent synthesizes."""
    NOVICE = "Novice"
    SKEPTIC = "Skeptic"


class NextTurnDirectiveDTO(BaseModel):
    next_persona: PersonaType
    target_difficulty: int = Field(..., ge=1, le=5)
    reason: str
    current_phase: SessionPhaseName
    should_end_session: bool = False
