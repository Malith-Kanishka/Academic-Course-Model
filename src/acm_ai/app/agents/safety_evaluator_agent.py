import sys
import os
import json
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
    Enforces deterministic validation rules and the mandatory Human-in-the-Loop pause state.
    """
    def evaluate_session(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        data = SessionFinalTranscriptDTO(**payload)
        
        # 1. Execute tool: Deterministic grade calculation
        grade_result = compute_deterministic_grade(
            correct_count=data.correct_answers,
            total_questions=data.total_questions,
            fallacy_count=len(data.flagged_misconceptions)
        )
        score = grade_result["calculated_score"]
        
        # 2. Deterministic Guardrail Check: Score < 65% OR misconceptions exist -> Require HITL Pause
        requires_hitl = score < 65 or len(data.flagged_misconceptions) > 0
        state = "PAUSED_FOR_PROFESSOR_APPROVAL" if requires_hitl else "APPROVED_ACTIVE"
        
        # 3. Execute tool: Draft remedial plan
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
        
        return output.model_dump()

if __name__ == "__main__":
    # Isolated Agent Test Run
    agent = SafetyEvaluatorAgent()
    sample_input = {
        "session_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "student_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        "topic_name": "ASP.NET Middleware Architecture",
        "correct_answers": 5,
        "total_questions": 10,
        "flagged_misconceptions": ["Confused Dependency Injection lifetimes (Transient vs Singleton)"]
    }
    result = agent.evaluate_session(sample_input)
    print("Safety Evaluator Agent Test Output:\n", json.dumps(result, indent=2))