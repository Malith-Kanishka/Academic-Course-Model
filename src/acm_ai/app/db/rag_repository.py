"""Persistence helpers for RAG chat sessions and messages."""
from __future__ import annotations

from uuid import UUID, uuid4

import psycopg
from psycopg.rows import dict_row

from app.config import settings


def _get_connection() -> psycopg.Connection:
	if not settings.DATABASE_URL:
		raise RuntimeError("DATABASE_URL is not configured.")
	return psycopg.connect(settings.DATABASE_URL, row_factory=dict_row)


def _ensure_schema(conn: psycopg.Connection) -> None:
	conn.execute(
		"""
		CREATE TABLE IF NOT EXISTS rag_chat_sessions (
			id UUID PRIMARY KEY,
			title TEXT NOT NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
		"""
	)
	conn.execute(
		"""
		CREATE TABLE IF NOT EXISTS rag_chat_messages (
			id UUID PRIMARY KEY,
			session_id UUID NOT NULL REFERENCES rag_chat_sessions(id) ON DELETE CASCADE,
			role TEXT NOT NULL,
			content TEXT NOT NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
		"""
	)
	conn.execute(
		"CREATE INDEX IF NOT EXISTS ix_rag_chat_messages_session_created "
		"ON rag_chat_messages (session_id, created_at, id)"
	)
	conn.execute(
		"""
		CREATE TABLE IF NOT EXISTS rag_chat_documents (
			id UUID PRIMARY KEY,
			session_id UUID NOT NULL REFERENCES rag_chat_sessions(id) ON DELETE CASCADE,
			filename TEXT NOT NULL,
			extracted_text TEXT NOT NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
		"""
	)
	conn.execute(
		"CREATE INDEX IF NOT EXISTS ix_rag_chat_documents_session "
		"ON rag_chat_documents (session_id, created_at, id)"
	)


def list_sessions() -> list[dict]:
	with _get_connection() as conn:
		_ensure_schema(conn)
		return conn.execute(
			"SELECT id, title, created_at, updated_at FROM rag_chat_sessions "
			"ORDER BY updated_at DESC"
		).fetchall()


def get_session(session_id: UUID, include_document_text: bool = True) -> dict | None:
	with _get_connection() as conn:
		_ensure_schema(conn)
		session = conn.execute(
			"SELECT id, title, created_at, updated_at FROM rag_chat_sessions WHERE id = %s",
			(session_id,),
		).fetchone()
		if session is None:
			return None
		session["messages"] = conn.execute(
			"SELECT role AS sender, content, created_at FROM rag_chat_messages "
			"WHERE session_id = %s ORDER BY created_at, id",
			(session_id,),
		).fetchall()
		document_columns = "id, filename, extracted_text, created_at" if include_document_text else "id, filename, created_at"
		session["documents"] = conn.execute(
			f"SELECT {document_columns} FROM rag_chat_documents "
			"WHERE session_id = %s ORDER BY created_at, id",
			(session_id,),
		).fetchall()
		return session


def create_session(title: str) -> UUID:
	session_id = uuid4()
	with _get_connection() as conn:
		_ensure_schema(conn)
		conn.execute(
			"INSERT INTO rag_chat_sessions (id, title) VALUES (%s, %s)",
			(session_id, title),
		)
	return session_id


def add_message(session_id: UUID, role: str, content: str) -> None:
	with _get_connection() as conn:
		_ensure_schema(conn)
		conn.execute(
			"INSERT INTO rag_chat_messages (id, session_id, role, content) "
			"VALUES (%s, %s, %s, %s)",
			(uuid4(), session_id, role, content),
		)
		conn.execute(
			"UPDATE rag_chat_sessions SET updated_at = NOW() WHERE id = %s",
			(session_id,),
		)


def attach_document(session_id: UUID, filename: str, extracted_text: str) -> UUID:
	document_id = uuid4()
	with _get_connection() as conn:
		_ensure_schema(conn)
		conn.execute(
			"INSERT INTO rag_chat_documents (id, session_id, filename, extracted_text) "
			"VALUES (%s, %s, %s, %s)",
			(document_id, session_id, filename, extracted_text),
		)
		conn.execute(
			"UPDATE rag_chat_sessions SET updated_at = NOW() WHERE id = %s",
			(session_id,),
		)
	return document_id


def delete_document(session_id: UUID, document_id: UUID) -> bool:
	with _get_connection() as conn:
		_ensure_schema(conn)
		result = conn.execute(
			"DELETE FROM rag_chat_documents WHERE session_id = %s AND id = %s",
			(session_id, document_id),
		)
		if result.rowcount > 0:
			conn.execute(
				"UPDATE rag_chat_sessions SET updated_at = NOW() WHERE id = %s",
				(session_id,),
			)
		return result.rowcount > 0


def delete_session(session_id: UUID) -> bool:
	with _get_connection() as conn:
		_ensure_schema(conn)
		result = conn.execute(
			"DELETE FROM rag_chat_sessions WHERE id = %s", (session_id,)
		)
		return result.rowcount > 0
