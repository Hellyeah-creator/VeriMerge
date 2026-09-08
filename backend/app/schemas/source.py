from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel

class SourceResponse(BaseModel):
    id: int
    name: str
    source_type: str
    filename: Optional[str] = None
    total_records: int
    total_columns: int
    columns: List[str] = []
    uploaded_at: datetime
    status: str
    error_message: Optional[str] = None

    class Config:
        from_attributes = True

class SourcePreview(BaseModel):
    source_id: int
    name: str
    source_type: str
    total_records: int
    columns: List[str]
    sample_rows: List[Dict[str, Any]]
    detected_mappings: Dict[str, str] # original column -> canonical field
