import sys
import os
import json
import urllib.request
import urllib.error
from typing import List, Dict, Any
from pydantic import BaseModel

# Ensure Python can locate the 'app' module regardless of working directory
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.tools.member4_tools import compute_deterministic_grade, create_draft_remedial_plan

# Input Schema Contract
class SessionFinalTranscriptDTO(BaseModel):
    session_id: str
    student_id: str
    topic_name: str
    correct_answers: int = 5
    total_questions: int = 10
    flagged_misconceptions: List[str] = []

# Output Schema Contract
class EvaluationSummaryDTO(BaseModel):
    session_id: str
    student_id: str
    final_score: int
    workflow_state: str  # "APPROVED_ACTIVE" or "PAUSED_FOR_PROFESSOR_APPROVAL"
    remedial_action_items: List[str]
    requires_human_approval: bool

class SafetyEvaluatorAgent:
    """
    Member 4 (Rashmika) - Agentic AI Subsystem Component.
    Enforces deterministic validation rules, 7-day remedial plan drafting,
    and the mandatory Human-in-the-Loop (HITL) pause state.
    """
    def evaluate_session(self, payload: Dict[str, Any], send_to_backend: bool = True) -> Dict[str, Any]:
        data = SessionFinalTranscriptDTO(**payload)
        
        # 1. Execute tool: Mathematical grade calculation formula
        grade_result = compute_deterministic_grade(
            correct_count=data.correct_answers,
            total_questions=data.total_questions,
            fallacy_count=len(data.flagged_misconceptions)
        )
        score = grade_result["calculated_score"]
        
        # 2. Deterministic Guardrail Check: Score < 65% OR misconceptions exist -> Require HITL Pause
        requires_hitl = score < 65 or len(data.flagged_misconceptions) > 0
        state = "PAUSED_FOR_PROFESSOR_APPROVAL" if requires_hitl else "APPROVED_ACTIVE"
        
        # 3. Execute tool: Draft 7-day remedial study plan
        remedial_data = create_draft_remedial_plan(
            student_id=data.student_id,
            misconceptions=data.flagged_misconceptions
        )
        
        output = EvaluationSummaryDTO(
            session_id=data.session_id,
            student_id=data.student_id,
            final_score=score,
            workflow_state=state,
            remedial_action_items=remedial_data["action_items"],
            requires_human_approval=requires_hitl
        )
        
        result_dict = output.model_dump()

        # 4. HTTP Bridge: Post evaluation results to ASP.NET Core Web API (Standard Library)
        if send_to_backend:
            try:
                backend_url = "http://localhost:5000/api/approval/evaluate"
                backend_payload = {
                    "sessionId": data.session_id,
                    "studentId": data.student_id,
                    "topicName": data.topic_name,
                    "finalScore": score,
                    "flaggedMisconceptions": data.flagged_misconceptions,
                    "sessionTranscript": [
                        f"Student evaluated on topic '{data.topic_name}'. "
                        f"Flagged issues: {', '.join(data.flagged_misconceptions) or 'none'}"
                    ]
                }
                json_bytes = json.dumps(backend_payload).encode("utf-8")
                req = urllib.request.Request(
                    backend_url,
                    data=json_bytes,
                    headers={"Content-Type": "application/json"},
                    method="POST"
                )
                with urllib.request.urlopen(req, timeout=5) as response:
                    print(f"[HTTP Sync] Backend status code: {response.getcode()}")
            except Exception as e:
                print(f"[HTTP Sync Warning] Backend API unreachable: {e}")

        return result_dict

if __name__ == "__main__":
    # Isolated Agent Test Run with Live API Bridge
    agent = SafetyEvaluatorAgent()
    sample_input = {
        "session_id": "8e12f451-9988-4a11-b1d2-009988aabbaa",
        "student_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        "topic_name": "ASP.NET Core Middleware",
        "correct_answers": 4,
        "total_questions": 10,
        "flagged_misconceptions": ["Misunderstood Middleware Execution Order"]
    }
    
    # Enable HTTP Sync to send evaluation to C# Backend
    result = agent.evaluate_session(sample_input, send_to_backend=True)
    print("\nSafety Evaluator Agent Local Result:\n", json.dumps(result, indent=2))