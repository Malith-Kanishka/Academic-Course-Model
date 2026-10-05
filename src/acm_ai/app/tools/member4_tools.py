import re
from typing import List, Dict, Any

_CORRUPTED_RECOMMENDATION = re.compile(
    r"(?:topic){2,}|(?:module){2,}|standard:\s*topic\s*\d+\s*topic",
    re.IGNORECASE,
)
_CLEAN_RECOMMENDATION = "Review core concepts and revisit key dialogue steps."


def _clean_recommendation(text: str) -> str:
    normalized = " ".join(text.split())
    return _CLEAN_RECOMMENDATION if _CORRUPTED_RECOMMENDATION.search(normalized) else normalized

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

def create_draft_remedial_plan(
    student_id: str,
    misconceptions: List[str],
    student_submission: str = "",
    expected_standard: str = "",
    topic_name: str = "the assessed topic",
) -> Dict[str, Any]:
    """
    Allow-listed Tool: Generates structured action items for mandatory student remedial review.
    """
    response_excerpt = " ".join(student_submission.split())[:240]
    standard_excerpt = " ".join(expected_standard.split())[:240]
    action_items = []
    for misconception in misconceptions:
        clean_misconception = _clean_recommendation(misconception)
        if clean_misconception == _CLEAN_RECOMMENDATION:
            action_items.append(clean_misconception)
            continue
        action = f"Review and re-study the concept: {clean_misconception}"
        if response_excerpt:
            action += f". Revisit your response for {topic_name}: {response_excerpt}"
        if standard_excerpt:
            action += f". Use this mastery standard: {standard_excerpt}"
        action_items.append(_clean_recommendation(action))
    if not action_items:
        action = f"Review {topic_name} course material"
        if response_excerpt:
            action += f" and revisit your response: {response_excerpt}"
        if standard_excerpt:
            action += f". Use this mastery standard: {standard_excerpt}"
        action_items = [_clean_recommendation(action)]
        
    return {
        "student_id": student_id,
        "action_items": action_items,
        "recommended_duration_days": 7
    }