from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class EvidenceResponse(BaseModel):
    id: int
    conflict_id: Optional[int] = None
    entity_id: int
    field_name: str
    source_title: str
    url_reference: Optional[str] = None
    retrieved_at: datetime
    value: str
    authority: float
    relevance: str
    confidence: float
    raw_snippet: Optional[str] = None

    class Config:
        from_attributes = True

class WebVerifyRequest(BaseModel):
    entity_id: int
    field_name: str
    contested_values: list[str] = []
