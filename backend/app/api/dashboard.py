import json
from collections import Counter
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.source import IngestionSource
from app.models.record import SourceRecord
from app.models.entity import CanonicalEntity
from app.models.conflict import FieldConflict, ConflictingValue
from app.models.audit import AuditLog
from app.schemas.dashboard import DashboardStatsResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_metrics(db: Session = Depends(get_db)):
    total_records = db.query(SourceRecord).count()
    unique_entities = db.query(CanonicalEntity).count()
    total_conflicts = db.query(FieldConflict).count()
    auto_resolved = db.query(FieldConflict).filter(FieldConflict.resolution_type == "AUTO").count()
    needs_review = db.query(FieldConflict).filter(FieldConflict.status.in_(["review_required", "conflict"])).count()
    blocked = db.query(FieldConflict).filter(FieldConflict.status == "blocked").count()

    # 1. Conflicts by Source
    conflicting_vals = db.query(ConflictingValue).all()
    source_counts = Counter(cv.source_name for cv in conflicting_vals)
    conflicts_by_source = [
        {"source": src, "count": count}
        for src, count in (source_counts.most_common(6) or [("CRM", 0), ("ERP", 0), ("EXCEL", 0), ("WEB", 0)])
    ]

    # 2. Conflicts by Field
    all_conflicts = db.query(FieldConflict).all()
    field_counts = Counter(c.field_name for c in all_conflicts)
    conflicts_by_field = [
        {"field": fld, "count": count}
        for fld, count in (field_counts.most_common(6) or [("address", 0), ("director", 0), ("bank_account", 0), ("phone", 0)])
    ]

    # 3. Confidence Distribution: [0-50, 50-70, 70-85, 85-95, 95-100]
    buckets = {
        "95-100% (High Auto)": 0,
        "90-94% (Auto)": 0,
        "70-89% (Review)": 0,
        "50-69% (Blocked)": 0,
        "< 50% (High Risk)": 0
    }
    for c in all_conflicts:
        conf = c.confidence
        if conf >= 95.0:
            buckets["95-100% (High Auto)"] += 1
        elif conf >= 90.0:
            buckets["90-94% (Auto)"] += 1
        elif conf >= 70.0:
            buckets["70-89% (Review)"] += 1
        elif conf >= 50.0:
            buckets["50-69% (Blocked)"] += 1
        else:
            buckets["< 50% (High Risk)"] += 1

    confidence_distribution = [
        {"range": rng, "count": cnt}
        for rng, cnt in buckets.items()
    ]

    # 4. Reconciliation Status Breakdown
    reconciliation_status = [
        {"status": "Auto-Resolved", "count": auto_resolved, "color": "#10B981"},
        {"status": "Needs Review", "count": needs_review, "color": "#F59E0B"},
        {"status": "Blocked", "count": blocked, "color": "#EF4444"}
    ]

    # 5. Recent Activity
    recent_logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(8).all()
    recent_activity = [
        {
            "id": l.id,
            "event_id": l.event_id,
            "action": l.action,
            "actor": l.actor,
            "field": l.field,
            "timestamp": l.timestamp.isoformat(),
            "reason": l.reason
        }
        for l in recent_logs
    ]

    return DashboardStatsResponse(
        total_records=total_records,
        unique_entities=unique_entities,
        total_conflicts=total_conflicts,
        auto_resolved=auto_resolved,
        needs_review=needs_review,
        blocked=blocked,
        conflicts_by_source=conflicts_by_source,
        conflicts_by_field=conflicts_by_field,
        confidence_distribution=confidence_distribution,
        reconciliation_status=reconciliation_status,
        recent_activity=recent_activity
    )
