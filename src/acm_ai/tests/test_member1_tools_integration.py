"""
Integration tests for Member 1's tools against the REAL Postgres/Supabase database.

Unlike test_coordinator_agent.py (which mocks these tools), these tests hit the
actual DB - they exist because the mocked unit tests can't catch schema drift
(wrong column name, wrong type, wrong table) and we've already hit two real
schema bugs that only surfaced by running against live data.

Each test creates its own throwaway fixture data (random UUIDs / a dedicated
temp module) and deletes it in teardown - never touches real seeded users,
the CS101-SEED demo module, or teammates' data. Skipped automatically if
DATABASE_URL isn't configured (e.g. a teammate's machine, or CI without DB access).
"""
from __future__ import annotations

import uuid

import psycopg
import pytest
from psycopg.rows import dict_row

from app.config import settings
from app.tools import member1_tools

pytestmark = [
    pytest.mark.integration,
    pytest.mark.skipif(not settings.DATABASE_URL, reason="DATABASE_URL not configured (see .env.example)"),
]


def _conn():
    return psycopg.connect(settings.DATABASE_URL, row_factory=dict_row)


# --- GetStudentHistoricalWeaknesses ---

@pytest.fixture
def fake_student_id():
    student_id = uuid.uuid4()
    yield student_id
    with _conn() as conn:
        conn.execute("DELETE FROM mastery_reports WHERE student_id = %s", (str(student_id),))
        conn.commit()


def test_get_student_historical_weaknesses_returns_empty_for_unknown_student(fake_student_id):
    result = member1_tools.get_student_historical_weaknesses(fake_student_id)
    assert result == []


def test_get_student_historical_weaknesses_real_join_and_ordering(fake_student_id):
    with _conn() as conn:
        conn.execute(
            """INSERT INTO mastery_reports (student_id, session_id, topic_name, mastery_score, flagged_misconceptions)
               VALUES (%s, gen_random_uuid(), %s, %s, %s)""",
            (str(fake_student_id), "Topic A (strong)", 80, []),
        )
        conn.execute(
            """INSERT INTO mastery_reports (student_id, session_id, topic_name, mastery_score, flagged_misconceptions)
               VALUES (%s, gen_random_uuid(), %s, %s, %s)""",
            (str(fake_student_id), "Topic B (weak)", 30, ["mixed up X and Y"]),
        )
        conn.commit()

    result = member1_tools.get_student_historical_weaknesses(fake_student_id)

    assert len(result) == 2
    # Weakest (lowest score) must come first - the Coordinator relies on this order.
    assert result[0].topic_name == "Topic B (weak)"
    assert result[0].mastery_score == 30
    assert result[0].flagged_misconceptions == ["mixed up X and Y"]
    assert result[1].topic_name == "Topic A (strong)"


def test_get_student_historical_weaknesses_respects_limit(fake_student_id):
    with _conn() as conn:
        for i in range(5):
            conn.execute(
                """INSERT INTO mastery_reports (student_id, session_id, topic_name, mastery_score)
                   VALUES (%s, gen_random_uuid(), %s, %s)""",
                (str(fake_student_id), f"Topic {i}", 50),
            )
        conn.commit()

    result = member1_tools.get_student_historical_weaknesses(fake_student_id, limit=2)
    assert len(result) == 2


def test_get_student_historical_weaknesses_does_not_leak_other_students_data(fake_student_id):
    other_student_id = uuid.uuid4()
    with _conn() as conn:
        conn.execute(
            """INSERT INTO mastery_reports (student_id, session_id, topic_name, mastery_score)
               VALUES (%s, gen_random_uuid(), %s, %s)""",
            (str(other_student_id), "Someone Else's Weakness", 10),
        )
        conn.commit()
    try:
        result = member1_tools.get_student_historical_weaknesses(fake_student_id)
        assert result == []
    finally:
        with _conn() as conn:
            conn.execute("DELETE FROM mastery_reports WHERE student_id = %s", (str(other_student_id),))
            conn.commit()


# --- GetModulePrerequisites / get_topic_title ---

@pytest.fixture
def temp_module_with_topics():
    """A throwaway module with 3 ordered topics, so prerequisite-chain logic is
    tested against real FK-joined data instead of the shared CS101-SEED demo data."""
    module_id = uuid.uuid4()
    topic_ids = [uuid.uuid4() for _ in range(3)]

    with _conn() as conn:
        conn.execute(
            """INSERT INTO "Modules" ("Id", "Title", "Code", "Description", "CreatedAt")
               VALUES (%s, %s, %s, %s, now())""",
            (str(module_id), "Integration Test Module", "TEST-999", "temp"),
        )
        for i, topic_id in enumerate(topic_ids):
            conn.execute(
                """INSERT INTO "Topics" ("Id", "ModuleId", "Title", "ContentDescription", "OrderIndex", "CreatedAt")
                   VALUES (%s, %s, %s, %s, %s, now())""",
                (str(topic_id), str(module_id), f"Topic {i}", "temp", i),
            )
        conn.commit()

    yield module_id, topic_ids

    with _conn() as conn:
        conn.execute('DELETE FROM "Topics" WHERE "ModuleId" = %s', (str(module_id),))
        conn.execute('DELETE FROM "Modules" WHERE "Id" = %s', (str(module_id),))
        conn.commit()


def test_get_module_prerequisites_returns_earlier_ordered_topics(temp_module_with_topics):
    _module_id, topic_ids = temp_module_with_topics

    # Topic 2 (OrderIndex=2) should list Topic 0 and Topic 1 as prerequisites, in order.
    result = member1_tools.get_module_prerequisites(topic_ids[2])

    assert [p.title for p in result] == ["Topic 0", "Topic 1"]
    assert [p.order_index for p in result] == [0, 1]
    assert result[0].topic_id == topic_ids[0]


def test_get_module_prerequisites_returns_empty_for_first_topic(temp_module_with_topics):
    _module_id, topic_ids = temp_module_with_topics

    result = member1_tools.get_module_prerequisites(topic_ids[0])

    assert result == []


def test_get_module_prerequisites_returns_empty_for_nonexistent_topic():
    result = member1_tools.get_module_prerequisites(uuid.uuid4())
    assert result == []


def test_get_topic_title_returns_real_title(temp_module_with_topics):
    _module_id, topic_ids = temp_module_with_topics

    title = member1_tools.get_topic_title(topic_ids[1])

    assert title == "Topic 1"


def test_get_topic_title_returns_none_for_nonexistent_topic():
    assert member1_tools.get_topic_title(uuid.uuid4()) is None
