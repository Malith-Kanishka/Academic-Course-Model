from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Set
from app.schemas.audit_schemas import FactAuditRequest, FactAuditResultDTO
from app.agents.knowledge_auditor_agent import audit_student_claim


app = FastAPI(title="ACM AI Inference Engine (Member 2)")

class AuditRequest(BaseModel):
    completed_topics: List[str]
    target_topic: str
    rules_db: List[Dict[str, Any]]

class AStarFilterRequest(BaseModel):
    current_node: str
    potential_neighbors: List[str]
    completed_topics: List[str]
    rules_db: List[Dict[str, Any]]

class KnowledgeBaseInferenceEngine:
    def __init__(self):
        self.rules: List[Dict[str, Any]] = []
        self.known_facts: Set[str] = set()

    def add_rule(self, premises: List[str], conclusion: str):
        self.rules.append({"premises": premises, "conclusion": conclusion})

    def add_fact(self, fact: str):
        self.known_facts.add(fact)

    def forward_chain(self) -> Set[str]:
        """Executes forward-chaining using Modus Ponens and Horn Clauses."""
        inferred = set(self.known_facts)
        newly_inferred = True

        while newly_inferred:
            newly_inferred = False
            for rule in self.rules:
                premises = rule["premises"]
                conclusion = rule["conclusion"]
                
                if all(p in inferred for p in premises) and conclusion not in inferred:
                    inferred.add(conclusion)
                    newly_inferred = True

        return inferred

@app.get("/")
async def root():
    return {"status": "online", "message": "ACM AI Inference Engine is running successfully!"}

@app.post("/api/ai/audit")
async def audit_topic_endpoint(request: AuditRequest):
    try:
        engine = KnowledgeBaseInferenceEngine()
        
        for fact in request.completed_topics:
            engine.add_fact(fact)
            
        for rule in request.rules_db:
            engine.add_rule(rule.get("premises", []), rule.get("conclusion", ""))
            
        derived_facts = engine.forward_chain()
        is_valid = request.target_topic in derived_facts
        
        return {
            "target_topic": request.target_topic,
            "is_unlocked": is_valid,
            "derived_knowledge": list(derived_facts),
            "message": f"Topic '{request.target_topic}' is {'unlocked and verified via Forward Chaining' if is_valid else 'locked due to missing prerequisites'}."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/filter-neighbors")
async def filter_neighbors_endpoint(request: AStarFilterRequest):
    valid_neighbors = filter_astar_neighbors(
        current_node=request.current_node,
        potential_neighbors=request.potential_neighbors,
        completed_topics=request.completed_topics,
        rules_db=request.rules_db
    )
    return {
        "current_node": request.current_node,
        "valid_neighbors": valid_neighbors,
        "count": len(valid_neighbors)
    }

@app.post("/api/ai/audit", response_model=FactAuditResultDTO)
async def audit_endpoint(request: FactAuditRequest):
    return audit_student_claim(request)