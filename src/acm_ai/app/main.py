from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Set

app = FastAPI(title="ACM AI Inference Engine (Member 2)")

class AuditRequest(BaseModel):
    completed_topics: List[str]
    target_topic: str
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