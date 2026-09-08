from typing import List, Optional
from pydantic import BaseModel

class CopilotQueryRequest(BaseModel):
    conflict_id: int
    user_prompt: Optional[str] = "Why did you choose this value?"

class CopilotResponse(BaseModel):
    conflict_id: int
    field_name: str
    conflict_summary: str
    sources_compared: List[str]
    evidence_considered: List[dict]
    recommended_value: Optional[str]
    confidence: float
    reasoning: str
    next_action: str
    is_ai_generated: bool = True
    provider_used: str = "VeriMerge-Reasoner"
