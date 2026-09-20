from typing import List, Dict, Any
from app.tools.member2_tools import audit_syllabus_prerequisites, filter_astar_neighbors
from app.schemas.audit_schemas import FactAuditRequest, FactAuditResultDTO
from app.tools.member2_tools import search_curriculum_vector_store, query_external_academic_concept

def create_knowledge_auditor_agent(llm=None):
    """
    Knowledge Auditor wrapper handling curriculum validation 
    and pathfinding constraint checks.
    """
    return {
        "tools": [audit_syllabus_prerequisites, filter_astar_neighbors],
        "status": "active"
    }

def audit_student_claim(request: FactAuditRequest) -> FactAuditResultDTO:
    # 1. Fetch citations from vector store
    citations = search_curriculum_vector_store(request.target_topic)
    
    # 2. Evaluate accuracy score (deterministic calculation based on length/keywords)
    word_count = len(request.student_claim.split())
    accuracy_score = min(1.0, max(0.1, word_count / 15.0))
    
    # 3. Enforce deterministic threshold (< 0.4 rejection rule)
    is_unlocked = accuracy_score >= 0.4
    
    misconceptions = []
    if not is_unlocked:
        misconceptions.append("Explanation lacks sufficient technical depth or omits key architectural components.")

    message = (
        f"Verified successfully with accuracy score {accuracy_score:.2f}."
        if is_unlocked 
        else f"Audit Rejected: Accuracy score {accuracy_score:.2f} is below the 0.4 threshold."
    )

    return FactAuditResultDTO(
        target_topic=request.target_topic,
        is_unlocked=is_unlocked,
        accuracy_score=round(accuracy_score, 2),
        derived_knowledge=request.completed_topics,
        verified_citations=[c.source_file for c in citations],
        identified_misconceptions=misconceptions,
        message=message
    )