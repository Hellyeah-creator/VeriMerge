from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from app.schemas.evidence import EvidenceResponse

class ConflictingValueResponse(BaseModel):
    id: int
    source_name: str
    value: Optional[str] = None
    authority_score: float
    is_selected: bool
    timestamp: datetime

    class Config:
        from_attributes = True

class ConflictResponse(BaseModel):
    id: int
    entity_id: int
    entity_name: Optional[str] = None
    field_name: str
    status: str # conflict, auto_resolved, human_reviewed, blocked
    resolution_type: str # AUTO, MANUAL, UNRESOLVED, BLOCKED
    recommended_value: Optional[str] = None
    final_value: Optional[str] = None
    confidence: float
    reasoning: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    values: List[ConflictingValueResponse] = []
    evidence_items: List[EvidenceResponse] = []

    class Config:
        from_attributes = True

class ConflictResolveRequest(BaseModel):
    selected_value: str
    action: str # APPROVE, REJECT, CHOOSE, REQUEST_EVIDENCE
    reason: Optional[str] = None
    reviewer: str = "human_operator@verimerge.ai"
