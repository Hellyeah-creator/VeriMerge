from typing import List, Dict, Any
from pydantic import BaseModel

class DashboardStatsResponse(BaseModel):
    total_records: int
    unique_entities: int
    total_conflicts: int
    auto_resolved: int
    needs_review: int
    blocked: int
    
    # Chart series
    conflicts_by_source: List[Dict[str, Any]]
    conflicts_by_field: List[Dict[str, Any]]
    confidence_distribution: List[Dict[str, Any]]
    reconciliation_status: List[Dict[str, Any]]
    recent_activity: List[Dict[str, Any]]
