from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_chat_creates_session_and_persists_both_messages(monkeypatch):
    session_id = uuid4()
    created = []
    saved = []
    agent_calls = []

    monkeypatch.setattr("app.routers.rag.rag_repository.create_session", lambda title: created.append(title) or session_id)
    monkeypatch.setattr("app.routers.rag.rag_repository.add_message", lambda sid, role, content: saved.append((sid, role, content)))
    monkeypatch.setattr("app.routers.rag.generate_rag_response", lambda **kwargs: agent_calls.append(kwargs) or "answer")

    response = client.post(
        "/api/ai/rag/chat",
        json={
            "query": "Explain course approval workflow",
            "document_context": "Approval policy text",
            "document_filename": "policy.pdf",
        },
    )

    assert response.status_code == 200
    assert response.json() == {"response": "answer", "session_id": str(session_id)}
    assert created == ["Explain course approval workflow"]
    assert saved == [
        (session_id, "user", "Explain course approval workflow"),
        (session_id, "assistant", "answer"),
    ]
    assert "policy.pdf" in agent_calls[0]["query"]
    assert "Approval policy text" in agent_calls[0]["query"]


def test_session_endpoints_return_history_and_delete(monkeypatch):
    session_id = uuid4()
    session = {
        "id": session_id,
        "title": "Existing chat",
        "messages": [{"sender": "user", "content": "Hello"}],
    }
    monkeypatch.setattr("app.routers.rag.rag_repository.list_sessions", lambda: [session])
    monkeypatch.setattr("app.routers.rag.rag_repository.get_session", lambda sid, **_kwargs: session if sid == session_id else None)
    monkeypatch.setattr("app.routers.rag.rag_repository.delete_session", lambda sid: sid == session_id)

    assert client.get("/api/ai/rag/sessions").json()[0]["title"] == "Existing chat"
    history = client.get(f"/api/ai/rag/sessions/{session_id}")
    assert history.status_code == 200
    assert history.json()["messages"] == [{"sender": "user", "content": "Hello"}]
    assert client.delete(f"/api/ai/rag/sessions/{session_id}").status_code == 200


def test_session_history_returns_404_for_unknown_session(monkeypatch):
    monkeypatch.setattr("app.routers.rag.rag_repository.get_session", lambda _sid, **_kwargs: None)

    response = client.get(f"/api/ai/rag/sessions/{uuid4()}")

    assert response.status_code == 404


def test_document_upload_extracts_and_attaches_to_session(monkeypatch):
    session_id = uuid4()
    document_id = uuid4()
    created = []
    attached = []
    monkeypatch.setattr("app.routers.rag.extract_text_from_pdf", lambda _content: "Extracted policy text")
    monkeypatch.setattr("app.routers.rag.rag_repository.create_session", lambda title: created.append(title) or session_id)
    monkeypatch.setattr(
        "app.routers.rag.rag_repository.attach_document",
        lambda sid, filename, text: attached.append((sid, filename, text)) or document_id,
    )

    response = client.post(
        "/api/ai/rag/process-document",
        files={"file": ("policy.pdf", b"pdf bytes", "application/pdf")},
    )

    assert response.status_code == 200
    assert response.json()["session_id"] == str(session_id)
    assert response.json()["document_id"] == str(document_id)
    assert created == ["policy"]
    assert attached == [(session_id, "policy.pdf", "Extracted policy text")]


def test_saved_document_context_is_included_on_every_chat_turn(monkeypatch):
    session_id = uuid4()
    session = {
        "id": session_id,
        "messages": [],
        "documents": [{"filename": "policy.pdf", "extracted_text": "Persistent approval rules"}],
    }
    calls = []
    monkeypatch.setattr("app.routers.rag.rag_repository.get_session", lambda _sid: session)
    monkeypatch.setattr("app.routers.rag.rag_repository.add_message", lambda *_args: None)
    monkeypatch.setattr("app.routers.rag.generate_rag_response", lambda **kwargs: calls.append(kwargs) or "answer")

    for question in ("What is the first rule?", "And what happens next?"):
        response = client.post(
            "/api/ai/rag/chat",
            json={"query": question, "session_id": str(session_id)},
        )
        assert response.status_code == 200

    assert len(calls) == 2
    assert all("Persistent approval rules" in call["query"] for call in calls)


def test_document_can_be_removed_from_session(monkeypatch):
    session_id = uuid4()
    document_id = uuid4()
    monkeypatch.setattr(
        "app.routers.rag.rag_repository.delete_document",
        lambda sid, did: sid == session_id and did == document_id,
    )

    response = client.delete(
        f"/api/ai/rag/sessions/{session_id}/documents/{document_id}"
    )

    assert response.status_code == 200
    assert response.json()["document_id"] == str(document_id)