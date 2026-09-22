"""
Member 1 agent evaluation tests, per the spec's testing table:
  - Structured output schema validation (SessionAgendaDTO)
  - Tool call assertions for GetStudentHistoricalWeaknesses

No GROQ_API_KEY is required to run these - the agent falls back to
deterministic text when no LLM is configured, so routing logic (the part
that actually matters for correctness) is tested without any network call.
"""
from uuid import uuid4

import pytest

from app.agents.coordinator_agent import HOLDING_UP_THRESHOLD, SessionCoordinatorAgent
from app.schemas.session_schemas import (
    PersonaType,
    PrerequisiteDTO,
    SessionAgendaDTO,
    SessionInitRequest,
    SessionPhaseName,
    WeaknessDTO,
)

TOPIC_ID = uuid4()
STUDENT_ID = uuid4()  # matches Users.Id, now uuid on both sides


@pytest.fixture
def agent():
    # No GROQ_API_KEY in the test environment -> agent runs fully deterministic.
    return SessionCoordinatorAgent()


@pytest.fixture
def mock_tools(monkeypatch):
    weaknesses = [
        WeaknessDTO(topic_name="Inheritance", mastery_score=40, flagged_misconceptions=["confuses override with overload"]),
        WeaknessDTO(topic_name="Interfaces", mastery_score=55, flagged_misconceptions=[]),
    ]
    prerequisites = [
        PrerequisiteDTO(topic_id=uuid4(), title="Classes and Objects", order_index=0),
    ]

    calls = {"weaknesses": [], "prerequisites": [], "topic": []}

    def fake_get_weaknesses(student_id, limit=10):
        calls["weaknesses"].append(student_id)
        return weaknesses

    def fake_get_prerequisites(topic_id):
        calls["prerequisites"].append(topic_id)
        return prerequisites

    def fake_get_topic_title(topic_id):
        calls["topic"].append(topic_id)
        return "Polymorphism"

    monkeypatch.setattr(
        "app.agents.coordinator_agent.get_student_historical_weaknesses", fake_get_weaknesses
    )
    monkeypatch.setattr(
        "app.agents.coordinator_agent.get_module_prerequisites", fake_get_prerequisites
    )
    monkeypatch.setattr(
        "app.agents.coordinator_agent.get_topic_title", fake_get_topic_title
    )

    return calls


# --- Structured output schema validation ---

def test_create_session_agenda_returns_valid_schema(agent, mock_tools):
    request = SessionInitRequest(student_id=STUDENT_ID, topic_id=TOPIC_ID)

    agenda = agent.create_session_agenda(request)

    assert isinstance(agenda, SessionAgendaDTO)
    assert agenda.student_id == STUDENT_ID
    assert agenda.session_topic_id == TOPIC_ID
    assert [p.name for p in agenda.phases] == [
        SessionPhaseName.CORE_DEFINITIONS,
        SessionPhaseName.ANALOGY_TESTING,
        SessionPhaseName.EDGE_CASE_GRILLING,
    ]
    assert len(agenda.required_subtopics) > 0


def test_agenda_weights_analogy_phase_toward_known_weaknesses(agent, mock_tools):
    request = SessionInitRequest(student_id=STUDENT_ID, topic_id=TOPIC_ID)

    agenda = agent.create_session_agenda(request)

    analogy_phase = next(p for p in agenda.phases if p.name == SessionPhaseName.ANALOGY_TESTING)
    assert "Inheritance" in analogy_phase.subtopics
    assert "Interfaces" in analogy_phase.subtopics


# --- Tool call assertions ---

def test_create_session_agenda_calls_get_student_historical_weaknesses(agent, mock_tools):
    request = SessionInitRequest(student_id=STUDENT_ID, topic_id=TOPIC_ID)

    agent.create_session_agenda(request)

    assert mock_tools["weaknesses"] == [STUDENT_ID]


def test_create_session_agenda_calls_get_module_prerequisites(agent, mock_tools):
    request = SessionInitRequest(student_id=STUDENT_ID, topic_id=TOPIC_ID)

    agent.create_session_agenda(request)

    assert mock_tools["prerequisites"] == [TOPIC_ID]


# --- Deterministic Check ---

def test_verify_agenda_complete_true_when_all_subtopics_scheduled(agent, mock_tools):
    request = SessionInitRequest(student_id=STUDENT_ID, topic_id=TOPIC_ID)
    agenda = agent.create_session_agenda(request)

    assert agent.verify_agenda_complete(agenda) is True


def test_verify_agenda_complete_false_when_subtopic_missing(agent, mock_tools):
    request = SessionInitRequest(student_id=STUDENT_ID, topic_id=TOPIC_ID)
    agenda = agent.create_session_agenda(request)
    agenda.required_subtopics.append("Something never scheduled")

    assert agent.verify_agenda_complete(agenda) is False


# --- Live persona routing ---

def test_decide_next_turn_routes_to_novice_when_struggling(agent):
    state = {
        "student_id": STUDENT_ID,
        "topic_id": TOPIC_ID,
        "current_phase_index": 0,
        "latest_accuracy_score": 0.2,
        "latest_hesitation_ms": 3500,
        "latest_misconceptions": ["confuses override with overload"],
    }

    directive = agent.decide_next_turn(state)

    assert directive.next_persona == PersonaType.NOVICE
    assert directive.should_end_session is False


def test_decide_next_turn_routes_to_skeptic_when_holding_up_well(agent):
    state = {
        "student_id": STUDENT_ID,
        "topic_id": TOPIC_ID,
        "current_phase_index": 0,
        "latest_accuracy_score": 0.95,
        "latest_hesitation_ms": 200,
        "latest_misconceptions": [],
    }

    directive = agent.decide_next_turn(state)

    assert directive.next_persona == PersonaType.SKEPTIC


def test_decide_next_turn_defaults_to_neutral_score_when_signals_missing(agent):
    # No latest_accuracy_score / latest_hesitation_ms in state yet (other
    # agents not wired in) - should not crash, should use the midpoint.
    state = {"student_id": STUDENT_ID, "topic_id": TOPIC_ID, "current_phase_index": 0}

    directive = agent.decide_next_turn(state)

    assert directive.next_persona in (PersonaType.NOVICE, PersonaType.SKEPTIC)


def test_decide_next_turn_difficulty_within_bounds(agent):
    state = {
        "student_id": STUDENT_ID,
        "topic_id": TOPIC_ID,
        "current_phase_index": 2,
        "latest_accuracy_score": 1.0,
        "latest_hesitation_ms": 0,
        "latest_misconceptions": [],
    }

    directive = agent.decide_next_turn(state)

    assert 1 <= directive.target_difficulty <= 5


def test_holding_up_threshold_is_the_documented_boundary():
    assert HOLDING_UP_THRESHOLD == 0.6
