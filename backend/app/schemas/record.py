from datetime import datetime
from typing import Dict, Any, Optional
from pydantic import BaseModel

class RecordResponse(BaseModel):
    id: int
    source_id: int
    source_name: Optional[str] = None
    external_record_id: Optional[str] = None
    raw_data: Dict[str, Any]
    normalized_data: Dict[str, Any]
    entity_id: Optional[int] = None
    ingested_at: datetime

    class Config:
        from_attributes = True
