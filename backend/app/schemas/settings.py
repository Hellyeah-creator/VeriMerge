from typing import Dict
from pydantic import BaseModel

class SettingsResponse(BaseModel):
    auto_resolve_threshold: float
    human_review_threshold: float
    entity_match_threshold: float
    source_authorities: Dict[str, float]

class SettingsUpdateRequest(BaseModel):
    auto_resolve_threshold: float
    human_review_threshold: float
    entity_match_threshold: float
    source_authorities: Dict[str, float]
