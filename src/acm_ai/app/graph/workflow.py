"""
LangGraph builder connecting the 4 agent nodes.

Today this wires only Member 1's two Coordinator nodes (plan_session,
route_next_turn), since the other 3 agents don't exist yet. The intended
full pipeline (per the spec's 6-stage execution pipeline) is:

    plan_session (Coordinator, once)
        -> route_next_turn (Coordinator, per turn)
        -> [MEMBER 2] audit_claim        (sets latest_accuracy_score, latest_misconceptions)
        -> [MEMBER 3] generate_response  (sets latest_hesitation_ms; speaks as the routed persona)
        -> loop back to route_next_turn until should_end_session
        -> [MEMBER 4] evaluate_session   (sets workflow_status, may PAUSE for professor approval)

Each future member adds their node with `graph.add_node(...)` and rewires the
edges below - this file is intentionally small so merges stay conflict-free.
"""
from __future__ import annotations

from langgraph.graph import END, StateGraph

from app.agents.coordinator_agent import SessionCoordinatorAgent
from app.graph.state import WorkflowState
from app.schemas.session_schemas import SessionInitRequest

_coordinator = SessionCoordinatorAgent()


def plan_session_node(state: WorkflowState) -> dict:
    request = SessionInitRequest(
        student_id=state["student_id"],
        topic_id=state["topic_id"],
        module_id=state.get("module_id"),
    )
    agenda = _coordinator.create_session_agenda(request)
    return {"agenda": agenda, "current_phase_index": 0}


def route_next_turn_node(state: WorkflowState) -> dict:
    directive = _coordinator.decide_next_turn(state)
    return {"next_turn_directive": directive}


def build_coordinator_graph():
    """Builds the Member-1-only graph: plan_session -> route_next_turn -> END.

    Other members extend this by importing `graph` here (or copying this
    builder) and inserting their nodes between route_next_turn and END, with
    a conditional loop back to route_next_turn per turn.
    """
    graph = StateGraph(WorkflowState)
    graph.add_node("plan_session", plan_session_node)
    graph.add_node("route_next_turn", route_next_turn_node)

    graph.set_entry_point("plan_session")
    graph.add_edge("plan_session", "route_next_turn")
    graph.add_edge("route_next_turn", END)

    return graph.compile()
