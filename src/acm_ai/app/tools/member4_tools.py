from typing import List, Dict, Any

def compute_deterministic_grade(correct_count: int, total_questions: int, fallacy_count: int) -> Dict[str, Any]:
    """
    Allow-listed Tool: Computes exact numerical grade based on correct answers and fallacy penalties.
    """
    if total_questions <= 0:
        score = 0
    else:
        base_score = (correct_count / total_questions) * 100
        deduction = fallacy_count * 10
        score = max(0, int(base_score - deduction))
    
    return {
        "calculated_score": score,
        "passed_threshold": score >= 65
    }

def create_draft_remedial_plan(student_id: str, misconceptions: List[str]) -> Dict[str, Any]:
    """
    Allow-listed Tool: Generates structured action items for mandatory student remedial review.
    """
    action_items = [f"Review & re-study concept: {m}" for m in misconceptions]
    if not action_items:
        action_items = ["General course material review"]
        
    return {
        "student_id": student_id,
        "action_items": action_items,
        "recommended_duration_days": 7
    }