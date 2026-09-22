"""
Tests for the FastAPI layer (app/main.py) - the actual HTTP contract ASP.NET
Core will call. Mocks the DB-backed tools (same pattern as
test_coordinator_agent.py) so these run fast and without a DB connection.
"""
from __future__ import annotations

from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.session_schemas import PrerequisiteDTO, WeaknessDTO

client = TestClient(app)

TOPIC_ID = uuid4()
STUDENT_ID = uuid4()


@pytest.fixture(autouse=True)
def mock_tools(monkeypatch):
    monkeypatch.setattr(
        "app.agents.coordinator_agent.get_student_historical_weaknesses",
        lambda student_id, limit=10: [WeaknessDTO(topic_name="Loops", mastery_score=45)],
    )
    monkeypatch.setattr(
        "app.agents.coordinator_agent.get_module_prerequisites",
        lambda topic_id: [PrerequisiteDTO(topic_id=uuid4(), title="Variables", order_index=0)],
    )
    monkeypatch.setattr(
        "app.agents.coordinator_agent.get_topic_title",
        lambda topic_id: "Functions",
    )


def test_health_endpoint():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_plan_session_returns_valid_agenda():
    response = client.post(
        "/api/internal/coordinator/plan-session",
        json={"student_id": str(STUDENT_ID), "topic_id": str(TOPIC_ID)},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["student_id"] == str(STUDENT_ID)
    assert body["session_topic_id"] == str(TOPIC_ID)
    assert len(body["phases"]) == 3
    assert [p["name"] for p in body["phases"]] == [
        "Core Definitions",
        "Analogy Testing",
        "Edge-Case Grilling",
    ]


def test_plan_session_rejects_malformed_uuid():
    response = client.post(
        "/api/internal/coordinator/plan-session",
        json={"student_id": "not-a-uuid", "topic_id": str(TOPIC_ID)},
    )

    assert response.status_code == 422


def test_plan_session_rejects_missing_field():
    response = client.post(
        "/api/internal/coordinator/plan-session",
        json={"topic_id": str(TOPIC_ID)},
    )

    assert response.status_code == 422


def test_next_turn_routes_to_novice_when_struggling():
    response = client.post(
        "/api/internal/coordinator/next-turn",
        json={
            "student_id": str(STUDENT_ID),
            "topic_id": str(TOPIC_ID),
            "current_phase_index": 0,
            "latest_accuracy_score": 0.1,
            "latest_hesitation_ms": 4000,
            "latest_misconceptions": ["confused two concepts"],
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["next_persona"] == "Novice"
    assert 1 <= body["target_difficulty"] <= 5


def test_next_turn_routes_to_skeptic_when_confident():
    response = client.post(
        "/api/internal/coordinator/next-turn",
        json={
            "student_id": str(STUDENT_ID),
            "topic_id": str(TOPIC_ID),
            "current_phase_index": 0,
            "latest_accuracy_score": 0.9,
            "latest_hesitation_ms": 100,
            "latest_misconceptions": [],
        },
    )

    assert response.status_code == 200
    assert response.json()["next_persona"] == "Skeptic"


def test_next_turn_works_with_minimal_state():
    # Other agents haven't populated any live signals yet - must not crash.
    response = client.post(
        "/api/internal/coordinator/next-turn",
        json={"student_id": str(STUDENT_ID), "topic_id": str(TOPIC_ID), "current_phase_index": 0},
    )

    assert response.status_code == 200
    assert response.json()["next_persona"] in ("Novice", "Skeptic")
