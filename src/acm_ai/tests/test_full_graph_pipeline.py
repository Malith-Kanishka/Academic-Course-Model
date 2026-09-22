"""
End-to-end multi-agent evaluation - per the spec, this exercises the compiled
LangGraph pipeline rather than calling agent methods directly. Today the graph
only has Member 1's two nodes wired in (plan_session -> route_next_turn); as
Members 2-4 add their nodes to graph/workflow.py, this file grows to exercise
the full 4-agent loop it describes in its own docstring.

Tool calls are mocked (same pattern as test_coordinator_agent.py) so this
doesn't depend on a DB connection - it's testing graph wiring and state
propagation between nodes, not the DB layer (that's test_member1_tools_integration.py).
"""
from __future__ import annotations

from uuid import uuid4

import pytest

from app.graph.workflow import build_coordinator_graph
from app.schemas.session_schemas import PersonaType, PrerequisiteDTO, WeaknessDTO

TOPIC_ID = uuid4()
STUDENT_ID = uuid4()


@pytest.fixture(autouse=True)
def mock_tools(monkeypatch):
    monkeypatch.setattr(
        "app.agents.coordinator_agent.get_student_historical_weaknesses",
        lambda student_id, limit=10: [WeaknessDTO(topic_name="Recursion", mastery_score=35)],
    )
    monkeypatch.setattr(
        "app.agents.coordinator_agent.get_module_prerequisites",
        lambda topic_id: [PrerequisiteDTO(topic_id=uuid4(), title="Loops", order_index=0)],
    )
    monkeypatch.setattr(
        "app.agents.coordinator_agent.get_topic_title",
        lambda topic_id: "Recursion",
    )


def test_graph_runs_plan_then_route_and_produces_both_outputs():
    graph = build_coordinator_graph()

    final_state = graph.invoke({"student_id": STUDENT_ID, "topic_id": TOPIC_ID})

    assert "agenda" in final_state
    assert "next_turn_directive" in final_state
    assert final_state["agenda"].student_id == STUDENT_ID
    assert final_state["current_phase_index"] == 0


def test_graph_route_next_turn_uses_the_agenda_plan_session_produced():
    graph = build_coordinator_graph()

    final_state = graph.invoke({"student_id": STUDENT_ID, "topic_id": TOPIC_ID})

    # route_next_turn ran AFTER plan_session and read state["agenda"] /
    # state["current_phase_index"] that plan_session_node wrote - proves the
    # two nodes are actually wired together, not just independently correct.
    directive = final_state["next_turn_directive"]
    assert directive.current_phase == final_state["agenda"].phases[0].name


def test_graph_next_turn_reflects_live_signals_when_present():
    graph = build_coordinator_graph()

    # A struggling student, as if Members 2/3's nodes had already run this
    # turn and populated these signals (they don't exist yet, so we set them
    # directly in the initial state to simulate that future wiring).
    final_state = graph.invoke(
        {
            "student_id": STUDENT_ID,
            "topic_id": TOPIC_ID,
            "latest_accuracy_score": 0.15,
            "latest_hesitation_ms": 3900,
            "latest_misconceptions": ["mixed up base case and recursive case"],
        }
    )

    assert final_state["next_turn_directive"].next_persona == PersonaType.NOVICE


def test_graph_raises_on_incomplete_input():
    graph = build_coordinator_graph()

    with pytest.raises(Exception):
        graph.invoke({"student_id": STUDENT_ID})  # missing required topic_id
