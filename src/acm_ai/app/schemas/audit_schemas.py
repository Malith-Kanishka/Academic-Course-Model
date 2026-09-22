from pydantic import BaseModel, Field
from typing import List, Optional

class ChunkDTO(BaseModel):
    chunk_id: str
    content: str
    source_file: str

class DefinitionDTO(BaseModel):
    concept_name: str
    definition: str
    source: str

class FactAuditRequest(BaseModel):
    student_claim: str
    target_topic: str
    completed_topics: List[str] = Field(default_factory=list)
    rules_db: List[dict] = Field(default_factory=list)

class FactAuditResultDTO(BaseModel):
    target_topic: str
    is_unlocked: bool
    accuracy_score: float = Field(..., ge=0.0, le=1.0)
    derived_knowledge: List[str] = Field(default_factory=list)
    verified_citations: List[str] = Field(default_factory=list)
    identified_misconceptions: List[str] = Field(default_factory=list)
    message: str = ""