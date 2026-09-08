import json
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.audit import AuditLog
from app.schemas.audit import AuditLogResponse

router = APIRouter(prefix="/audit", tags=["Audit"])

@router.get("", response_model=List[AuditLogResponse])
def get_audit_trail(
    entity_id: Optional[int] = Query(None),
    action: Optional[str] = Query(None),
    limit: int = Query(100),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if entity_id:
        query = query.filter(AuditLog.entity_id == entity_id)
    if action:
        query = query.filter(AuditLog.action == action)

    logs = query.order_by(AuditLog.timestamp.desc()).limit(limit).all()

    out = []
    for l in logs:
        ev_ids = json.loads(l.evidence_ids) if l.evidence_ids else []
        out.append(AuditLogResponse(
            id=l.id,
            event_id=l.event_id,
            entity_id=l.entity_id,
            field=l.field,
            action=l.action,
            actor=l.actor,
            timestamp=l.timestamp,
            old_value=l.old_value,
            new_value=l.new_value,
            reason=l.reason,
            evidence_ids=ev_ids
        ))
    return out
