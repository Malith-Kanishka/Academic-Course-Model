from typing import List, Dict, Any
from app.tools.member2_tools import audit_syllabus_prerequisites, filter_astar_neighbors

def create_knowledge_auditor_agent(llm=None):
    """
    Knowledge Auditor wrapper handling curriculum validation 
    and pathfinding constraint checks.
    """
    return {
        "tools": [audit_syllabus_prerequisites, filter_astar_neighbors],
        "status": "active"
    }