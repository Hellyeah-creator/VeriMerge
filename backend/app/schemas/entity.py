from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from app.schemas.record import RecordResponse
from app.schemas.conflict import ConflictResponse

class TrustedFieldResponse(BaseModel):
    id: int
    field_name: str
    value: Optional[str] = None
    confidence: float
    resolution_state: str # AUTO, REVIEW, BLOCK
    source_names: List[str] = []
    reasoning: Optional[str] = None
    decided_by: str
    decided_at: datetime
    is_latest: bool

    class Config:
        from_attributes = True

class EntityResponse(BaseModel):
    id: int
    canonical_name: str
    entity_type: str
    match_confidence: float
    matching_features: List[str] = []
    status: str
    record_count: int = 0
    conflict_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class EntityDetailResponse(BaseModel):
    id: int
    canonical_name: str
    entity_type: str
    match_confidence: float
    matching_features: List[str] = []
    status: str
    created_at: datetime
    updated_at: datetime
    records: List[RecordResponse] = []
    conflicts: List[ConflictResponse] = []
    trusted_fields: List[TrustedFieldResponse] = []

    class Config:
        from_attributes = True
