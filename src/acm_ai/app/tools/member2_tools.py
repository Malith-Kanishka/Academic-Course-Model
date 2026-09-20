from typing import List, Dict, Set, Any
from langchain.tools import tool
from typing import List, Optional
from app.schemas.audit_schemas import ChunkDTO, DefinitionDTO

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
                
                # Check if all premises (Horn clause body) are satisfied
                if all(p in inferred for p in premises) and conclusion not in inferred:
                    inferred.add(conclusion)
                    newly_inferred = True

        return inferred

@tool
def audit_syllabus_prerequisites(completed_topics: List[str], target_topic: str, rules_db: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Audits whether a target topic can be taken given completed topics and rules 
    using a Knowledge Base forward-chaining inference loop.
    """
    engine = KnowledgeBaseInferenceEngine()
    
    for fact in completed_topics:
        engine.add_fact(fact)
        
    for rule in rules_db:
        engine.add_rule(rule.get("premises", []), rule.get("conclusion", ""))
        
    derived_facts = engine.forward_chain()
    is_valid = target_topic in derived_facts
    
    return {
        "target_topic": target_topic,
        "is_unlocked": is_valid,
        "derived_knowledge": list(derived_facts),
        "message": f"Topic '{target_topic}' is {'unlocked and verified' : 'locked due to missing prerequisites'}."
    }

@tool
def filter_astar_neighbors(current_node: str, potential_neighbors: List[str], completed_topics: List[str], rules_db: List[Dict[str, Any]]) -> List[str]:
    """
    Consults the Knowledge Base inside the A* neighbor-generation loop 
    to filter out unverified or locked prerequisite nodes.
    """
    engine = KnowledgeBaseInferenceEngine()
    for fact in completed_topics:
        engine.add_fact(fact)
    for rule in rules_db:
        engine.add_rule(rule.get("premises", []), rule.get("conclusion", ""))
        
    derived_facts = engine.forward_chain()
    
    # Only keep neighbors whose prerequisites are fully satisfied
    valid_neighbors = [n for n in potential_neighbors if n in derived_facts]
    return valid_neighbors

def search_curriculum_vector_store(query: str, topic_id: Optional[str] = None) -> List[ChunkDTO]:
    """
    Searches the uploaded course syllabus and lecture slides vector store.
    """
    # Simulated vector chunk retrieval matching the syllabus corpus
    return [
        ChunkDTO(
            chunk_id="chunk_001",
            content=f"Curriculum context reference for concept: {query}",
            source_file="Syllabus_Master.pdf"
        )
    ]

def query_external_academic_concept(concept_name: str) -> DefinitionDTO:
    """
    Queries an external academic knowledge base for concept definitions.
    """
    return DefinitionDTO(
        concept_name=concept_name,
        definition=f"Standard academic definition and principles governing {concept_name}.",
        source="External Academic KB"
    )