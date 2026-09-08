from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.entity import CanonicalEntity
from app.models.conflict import FieldConflict, ConflictingValue
from app.models.evidence import FieldEvidence
from app.schemas.copilot import CopilotQueryRequest, CopilotResponse
from app.services.ai_copilot import AICopilotService

router = APIRouter(prefix="/copilot", tags=["Copilot"])

@router.post("/investigate", response_model=CopilotResponse)
async def investigate_conflict(payload: CopilotQueryRequest, db: Session = Depends(get_db)):
    conflict = db.query(FieldConflict).filter(FieldConflict.id == payload.conflict_id).first()
    if not conflict:
        raise HTTPException(status_code=404, detail="Conflict not found")

    entity = db.query(CanonicalEntity).filter(CanonicalEntity.id == conflict.entity_id).first()
    entity_name = entity.canonical_name if entity else "Unknown Entity"

    cvs = db.query(ConflictingValue).filter(ConflictingValue.conflict_id == conflict.id).all()
    contested_values = [
        {"source_name": c.source_name, "value": c.value, "authority": c.authority_score}
        for c in cvs
    ]

    evs = db.query(FieldEvidence).filter(FieldEvidence.conflict_id == conflict.id).all()
    evidence_items = [
        {
            "source_title": e.source_title,
            "value": e.value,
            "authority": e.authority,
            "relevance": e.relevance,
            "confidence": e.confidence,
            "snippet": e.raw_snippet
        }
        for e in evs
    ]

    result = await AICopilotService.investigate_conflict(
        field_name=conflict.field_name,
        entity_name=entity_name,
        contested_values=contested_values,
        evidence_items=evidence_items,
        user_prompt=payload.user_prompt or "Why did you choose this value?"
    )

    return CopilotResponse(
        conflict_id=conflict.id,
        field_name=conflict.field_name,
        conflict_summary=result.get("conflict_summary", ""),
        sources_compared=result.get("sources_compared", []),
        evidence_considered=result.get("evidence_considered", []),
        recommended_value=result.get("recommended_value"),
        confidence=result.get("confidence", conflict.confidence),
        reasoning=result.get("reasoning", conflict.reasoning or ""),
        next_action=result.get("next_action", ""),
        is_ai_generated=result.get("is_ai_generated", True),
        provider_used=result.get("provider_used", "VeriMerge-ZeroTrust-Reasoner")
    )
