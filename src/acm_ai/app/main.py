from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Set
from app.schemas.audit_schemas import FactAuditRequest, FactAuditResultDTO
from app.agents.knowledge_auditor_agent import audit_student_claim
from app.agents.socratic_adversary_agent import SocraticAdversary

app = FastAPI(title="ACM AI Microservice", version="1.0")

# Initialize your AI Agent
socratic_agent = SocraticAdversary()

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

# Define the JSON structure we expect from the C# API
class DialogueRequest(BaseModel):
    session_id: str
    student_text: str

# Define the JSON structure we will send back to the C# API
class AIResponse(BaseModel):
    ai_text: str

@app.post("/api/ai/process", response_model=AIResponse)
async def process_dialogue(request: DialogueRequest):
    try:
        # Pass the text to your LangChain agent
        response_text = socratic_agent.generate_response(request.student_text)
        
        return AIResponse(ai_text=response_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# A simple health check endpoint so we know the server is running
@app.get("/health")
async def health_check():
    return {"status": "AI Service is online and ready!"}
