from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class AuditLogResponse(BaseModel):
    id: int
    event_id: str
    entity_id: Optional[int] = None
    field: Optional[str] = None
    action: str
    actor: str
    timestamp: datetime
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    reason: Optional[str] = None
    evidence_ids: List[str] = []

    class Config:
        from_attributes = True
