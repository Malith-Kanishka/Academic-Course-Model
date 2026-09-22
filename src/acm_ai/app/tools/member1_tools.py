"""
Member 1 allow-listed tools for the Session Coordinator & Strategy Agent.

  GetStudentHistoricalWeaknesses(student_id: UUID) -> List[WeaknessDTO]
  GetModulePrerequisites(topic_id: UUID) -> List[PrerequisiteDTO]

Connects directly to the shared Postgres/Supabase database (agreed data-source
choice for this agent - keeps it fast and independent of the ASP.NET backend).

Users.Id is now `uuid` (converted from int - see migration ConvertUsersToUuid),
matching mastery_reports.student_id and remedial_plans.student_id. There is still
no FK constraint from those tables to Users(Id) - that's Member 4's table to wire
up - but the types now match, so a real join/comparison is meaningful here.
"""
from __future__ import annotations

from uuid import UUID

import psycopg
from psycopg.rows import dict_row

from app.config import settings
from app.schemas.session_schemas import PrerequisiteDTO, WeaknessDTO


def _get_connection() -> psycopg.Connection:
    if not settings.DATABASE_URL:
        raise RuntimeError(
            "DATABASE_URL is not configured. Copy src/acm_ai/.env.example to "
            "src/acm_ai/.env and fill it in."
        )
    return psycopg.connect(settings.DATABASE_URL, row_factory=dict_row)


def get_student_historical_weaknesses(student_id: UUID, limit: int = 10) -> list[WeaknessDTO]:
    """Reads past mastery_reports for a student and returns the topics where they
    scored lowest, most recent first. Used by the Coordinator to weight session
    phases toward the student's known weak spots.
    """
    query = """
        SELECT topic_name, mastery_score, flagged_misconceptions, session_id, created_at
        FROM mastery_reports
        WHERE student_id = %s
        ORDER BY mastery_score ASC, created_at DESC
        LIMIT %s
    """
    with _get_connection() as conn:
        rows = conn.execute(query, (str(student_id), limit)).fetchall()

    return [
        WeaknessDTO(
            topic_name=row["topic_name"],
            mastery_score=row["mastery_score"],
            flagged_misconceptions=row["flagged_misconceptions"] or [],
            session_id=row["session_id"],
            reported_at=row["created_at"],
        )
        for row in rows
    ]


def get_topic_title(topic_id: UUID) -> str | None:
    """Internal helper (not one of the two allow-listed tools) - fetches the
    session's own topic title so the Coordinator can label phases sensibly.
    """
    with _get_connection() as conn:
        row = conn.execute(
            'SELECT "Title" FROM "Topics" WHERE "Id" = %s', (str(topic_id),)
        ).fetchone()
    return row["Title"] if row else None


def get_module_prerequisites(topic_id: UUID) -> list[PrerequisiteDTO]:
    """Returns the topics that should be understood before `topic_id`, derived from
    Topic.OrderIndex within the same Module (there is no explicit prerequisite
    graph in the schema yet, so earlier-ordered topics in the same module are
    treated as prerequisites).
    """
    target_query = """
        SELECT "ModuleId", "OrderIndex"
        FROM "Topics"
        WHERE "Id" = %s
    """
    prereq_query = """
        SELECT "Id", "Title", "OrderIndex"
        FROM "Topics"
        WHERE "ModuleId" = %s AND "OrderIndex" < %s
        ORDER BY "OrderIndex" ASC
    """
    with _get_connection() as conn:
        target = conn.execute(target_query, (str(topic_id),)).fetchone()
        if target is None:
            return []

        rows = conn.execute(
            prereq_query, (target["ModuleId"], target["OrderIndex"])
        ).fetchall()

    return [
        PrerequisiteDTO(topic_id=row["Id"], title=row["Title"], order_index=row["OrderIndex"])
        for row in rows
    ]
