import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.entity import CanonicalEntity, TrustedField
from app.models.conflict import FieldConflict, ConflictingValue
from app.models.evidence import FieldEvidence
from app.models.audit import AuditLog
from app.schemas.conflict import ConflictResponse, ConflictingValueResponse, ConflictResolveRequest
from app.schemas.evidence import EvidenceResponse
from app.services.web_verify import WebVerifyService

router = APIRouter(prefix="/review", tags=["Review Queue"])

@router.get("", response_model=List[ConflictResponse])
def get_review_queue(db: Session = Depends(get_db)):
    """
    Returns pending cases that require human review or are blocked:
    status in ['review_required', 'conflict', 'blocked']
    """
    conflicts = db.query(FieldConflict).filter(
        FieldConflict.status.in_(["review_required", "conflict", "blocked"])
    ).order_by(FieldConflict.confidence.desc()).all()

    out = []
    for c in conflicts:
        entity = db.query(CanonicalEntity).filter(CanonicalEntity.id == c.entity_id).first()
        vals = db.query(ConflictingValue).filter(ConflictingValue.conflict_id == c.id).all()
        evs = db.query(FieldEvidence).filter(FieldEvidence.conflict_id == c.id).all()

        out.append(ConflictResponse(
            id=c.id,
            entity_id=c.entity_id,
            entity_name=entity.canonical_name if entity else "Unknown",
            field_name=c.field_name,
            status=c.status,
            resolution_type=c.resolution_type,
            recommended_value=c.recommended_value,
            final_value=c.final_value,
            confidence=c.confidence,
            reasoning=c.reasoning,
            created_at=c.created_at,
            resolved_at=c.resolved_at,
            resolved_by=c.resolved_by,
            values=[ConflictingValueResponse(
                id=v.id,
                source_name=v.source_name,
                value=v.value,
                authority_score=v.authority_score,
                is_selected=v.is_selected,
                timestamp=v.timestamp
            ) for v in vals],
            evidence_items=[EvidenceResponse(
                id=ev.id,
                conflict_id=ev.conflict_id,
                entity_id=ev.entity_id,
                field_name=ev.field_name,
                source_title=ev.source_title,
                url_reference=ev.url_reference,
                retrieved_at=ev.retrieved_at,
                value=ev.value,
                authority=ev.authority,
                relevance=ev.relevance,
                confidence=ev.confidence,
                raw_snippet=ev.raw_snippet
            ) for ev in evs]
        ))
    return out

@router.post("/{conflict_id}/resolve")
def resolve_review_case(
    conflict_id: int,
    payload: ConflictResolveRequest,
    db: Session = Depends(get_db)
):
    conflict = db.query(FieldConflict).filter(FieldConflict.id == conflict_id).first()
    if not conflict:
        raise HTTPException(status_code=404, detail="Conflict not found")

    entity = db.query(CanonicalEntity).filter(CanonicalEntity.id == conflict.entity_id).first()
    prev_recommendation = conflict.recommended_value

    if payload.action == "APPROVE":
        # Approve recommended value
        chosen_val = conflict.recommended_value or payload.selected_value
        conflict.final_value = chosen_val
        conflict.status = "human_reviewed"
        conflict.resolution_type = "MANUAL"
        conflict.resolved_at = datetime.utcnow()
        conflict.resolved_by = payload.reviewer
        
        # Update or create Golden Record
        tf = db.query(TrustedField).filter(
            TrustedField.entity_id == conflict.entity_id,
            TrustedField.field_name == conflict.field_name
        ).first()

        if not tf:
            tf = TrustedField(
                entity_id=conflict.entity_id,
                field_name=conflict.field_name,
                value=chosen_val,
                confidence=max(conflict.confidence, 90.0),
                resolution_state="REVIEW_APPROVED",
                source_names_json=json.dumps(["HUMAN_REVIEWER", "AI_COPILOT"]),
                reasoning=f"Human reviewer approved AI recommendation: '{chosen_val}'. Note: {payload.reason or 'Verified correct by operator'}",
                decided_by=payload.reviewer,
                decided_at=datetime.utcnow()
            )
            db.add(tf)
        else:
            tf.value = chosen_val
            tf.confidence = max(conflict.confidence, 90.0)
            tf.resolution_state = "REVIEW_APPROVED"
            tf.reasoning = f"Approved by {payload.reviewer}: {payload.reason or 'Human approved'}"
            tf.decided_by = payload.reviewer

        # Audit entry
        db.add(AuditLog(
            entity_id=conflict.entity_id,
            field=conflict.field_name,
            action="HUMAN_APPROVAL",
            actor=payload.reviewer,
            old_value=prev_recommendation,
            new_value=chosen_val,
            reason=payload.reason or "Human operator confirmed value correctness.",
            evidence_ids=json.dumps([f"Conflict #{conflict.id}"])
        ))

    elif payload.action in ["CHOOSE", "OVERRIDE"]:
        # Human explicitly chose a specific value
        chosen_val = payload.selected_value
        conflict.final_value = chosen_val
        conflict.status = "human_reviewed"
        conflict.resolution_type = "MANUAL"
        conflict.resolved_at = datetime.utcnow()
        conflict.resolved_by = payload.reviewer

        tf = db.query(TrustedField).filter(
            TrustedField.entity_id == conflict.entity_id,
            TrustedField.field_name == conflict.field_name
        ).first()

        if not tf:
            tf = TrustedField(
                entity_id=conflict.entity_id,
                field_name=conflict.field_name,
                value=chosen_val,
                confidence=95.0,
                resolution_state="MANUAL_CHOICE",
                source_names_json=json.dumps([payload.reviewer]),
                reasoning=f"Operator manually selected value '{chosen_val}'. Rationale: {payload.reason or 'Domain override'}",
                decided_by=payload.reviewer,
                decided_at=datetime.utcnow()
            )
            db.add(tf)
        else:
            tf.value = chosen_val
            tf.confidence = 95.0
            tf.resolution_state = "MANUAL_CHOICE"
            tf.reasoning = f"Manually set by {payload.reviewer}: {payload.reason or 'Domain override'}"
            tf.decided_by = payload.reviewer

        db.add(AuditLog(
            entity_id=conflict.entity_id,
            field=conflict.field_name,
            action="HUMAN_APPROVAL",
            actor=payload.reviewer,
            old_value=prev_recommendation,
            new_value=chosen_val,
            reason=f"Operator manually picked value '{chosen_val}'. Reason: {payload.reason or 'Manual selection'}",
            evidence_ids=json.dumps([f"Manual override for Conflict #{conflict.id}"])
        ))

    elif payload.action == "REJECT":
        conflict.status = "blocked"
        conflict.resolution_type = "BLOCKED"
        conflict.final_value = None
        conflict.resolved_at = datetime.utcnow()
        conflict.resolved_by = payload.reviewer

        db.add(AuditLog(
            entity_id=conflict.entity_id,
            field=conflict.field_name,
            action="HUMAN_REJECTION",
            actor=payload.reviewer,
            old_value=prev_recommendation,
            new_value=None,
            reason=payload.reason or "Rejected by human reviewer due to inadequate evidence.",
            evidence_ids=json.dumps([f"Conflict #{conflict.id}"])
        ))

    elif payload.action == "REQUEST_EVIDENCE":
        # Trigger fresh web verify
        entity_name = entity.canonical_name if entity else "Entity"
        evs = WebVerifyService.collect_evidence(
            entity_name=entity_name,
            field_name=conflict.field_name,
            contested_values=[v.value for v in conflict.values if v.value]
        )
        for e in evs:
            db.add(FieldEvidence(
                conflict_id=conflict.id,
                entity_id=conflict.entity_id,
                field_name=conflict.field_name,
                source_title=e["source_title"],
                url_reference=e.get("url_reference"),
                value=e["value"],
                authority=e["authority"],
                relevance=e["relevance"],
                confidence=e["confidence"],
                raw_snippet=e.get("raw_snippet")
            ))
        db.add(AuditLog(
            entity_id=conflict.entity_id,
            field=conflict.field_name,
            action="EVIDENCE_REQUESTED",
            actor=payload.reviewer,
            new_value=None,
            reason="Operator requested additional external evidence collection.",
            evidence_ids=json.dumps([e["source_title"] for e in evs])
        ))

    db.commit()
    return {
        "status": "success",
        "action": payload.action,
        "conflict_id": conflict.id,
        "final_value": conflict.final_value,
        "resolution_type": conflict.resolution_type
    }
