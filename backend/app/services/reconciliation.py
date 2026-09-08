import json
from datetime import datetime
from typing import List, Dict, Any
from sqlalchemy.orm import Session

from app.models.source import IngestionSource
from app.models.record import SourceRecord
from app.models.entity import CanonicalEntity, TrustedField
from app.models.conflict import FieldConflict, ConflictingValue
from app.models.evidence import FieldEvidence
from app.models.audit import AuditLog
from app.services.entity_resolution import resolve_entities_graph
from app.services.trust_scoring import calculate_field_confidence
from app.services.web_verify import WebVerifyService
from app.core.config import settings

def run_reconciliation_pipeline(db: Session) -> Dict[str, Any]:
    """
    Executes the full zero-trust reconciliation pipeline:
    1. Entity Resolution
    2. Conflict Detection
    3. Trust Scoring & Evidence Gathering
    4. Auto-reconciliation & Review routing
    5. Golden Record & Audit Trail generation
    Preserves all original source records without modification.
    """
    # 1. Fetch all source records
    records_db = db.query(SourceRecord).all()
    if not records_db:
        return {
            "status": "completed",
            "message": "No source records found to reconcile.",
            "total_records": 0,
            "entities_created": 0,
            "conflicts_detected": 0,
            "auto_resolved": 0,
            "needs_review": 0,
            "blocked": 0
        }

    # Prepare normalized data payloads for clustering
    record_payloads = []
    for r in records_db:
        norm_data = json.loads(r.normalized_data_json)
        source_name = r.source.name if r.source else "UNKNOWN"
        record_payloads.append({
            "db_id": r.id,
            "source_name": source_name,
            "external_id": r.external_record_id,
            "normalized_data": norm_data
        })

    # 2. Run Multi-Signal Entity Resolution
    clusters = resolve_entities_graph(record_payloads, match_threshold=settings.ENTITY_MATCH_THRESHOLD)

    stats = {
        "total_records": len(records_db),
        "entities_created": len(clusters),
        "conflicts_detected": 0,
        "auto_resolved": 0,
        "needs_review": 0,
        "blocked": 0
    }

    # Clean existing generated entities/conflicts/trusted_fields for fresh idempotency
    # IMPORTANT: SourceRecord and IngestionSource are NEVER wiped.
    db.query(TrustedField).delete()
    db.query(ConflictingValue).delete()
    db.query(FieldConflict).delete()
    db.query(CanonicalEntity).delete()
    db.flush()

    # 3. Process each Entity Cluster
    for cluster in clusters:
        entity = CanonicalEntity(
            canonical_name=cluster["canonical_name"],
            entity_type="INDIVIDUAL" if any(k in cluster["canonical_name"].lower() for k in ["smith", "kumar", "john", "jane"]) else "ORGANIZATION",
            match_confidence=cluster["match_confidence"],
            matching_features_json=json.dumps(cluster["matching_features"]),
            status="auto_reconciled"
        )
        db.add(entity)
        db.flush() # Get entity.id

        # Link source records to this entity (preserves raw records intact)
        for rec in cluster["records"]:
            db_rec = db.query(SourceRecord).filter(SourceRecord.id == rec["db_id"]).first()
            if db_rec:
                db_rec.entity_id = entity.id

        # Audit event for entity match
        db.add(AuditLog(
            entity_id=entity.id,
            field=None,
            action="ENTITY_MATCHED",
            actor="ENTITY_RESOLUTION_ENGINE",
            new_value=entity.canonical_name,
            reason=f"Multi-signal match with {entity.match_confidence}% confidence ({', '.join(cluster['matching_features'])})",
            evidence_ids=json.dumps([f"Record #{rec['db_id']}" for rec in cluster["records"]])
        ))

        # 4. Field-level conflict detection across records
        # Canonical fields to compare
        canonical_fields = ["entity_name", "address", "phone", "director", "bank_account", "company", "registration_id"]
        
        has_review = False
        has_blocked = False

        for f_name in canonical_fields:
            candidate_values: List[Dict[str, Any]] = []
            for rec in cluster["records"]:
                val = rec["normalized_data"].get(f_name)
                if val and str(val).strip():
                    candidate_values.append({
                        "source": rec["source_name"],
                        "source_name": rec["source_name"],
                        "value": str(val).strip(),
                        "record_id": rec["db_id"],
                        "timestamp": datetime.utcnow()
                    })

            if not candidate_values:
                continue

            # Fetch or generate external corroborating evidence
            unique_raw_vals = list(set(item["value"] for item in candidate_values))
            evidences = WebVerifyService.collect_evidence(
                entity_name=entity.canonical_name,
                field_name=f_name,
                contested_values=unique_raw_vals
            )

            # Calculate Zero-Trust Field Confidence
            trust_res = calculate_field_confidence(
                field_name=f_name,
                candidate_values=candidate_values,
                external_evidences=evidences,
                entity_match_confidence=entity.match_confidence,
                auto_threshold=settings.AUTO_RESOLVE_THRESHOLD,
                review_threshold=settings.HUMAN_REVIEW_THRESHOLD
            )

            is_conflict = trust_res["is_conflict"]
            status = trust_res["status"] # AUTO, REVIEW, BLOCK
            conf = trust_res["confidence"]
            rec_val = trust_res["recommended_value"]
            reasoning = trust_res["reasoning"]

            if is_conflict:
                stats["conflicts_detected"] += 1

            # Save FieldConflict object
            conflict = FieldConflict(
                entity_id=entity.id,
                field_name=f_name,
                status="conflict" if is_conflict else "resolved",
                resolution_type="AUTO" if status == "AUTO" else ("UNRESOLVED" if status == "REVIEW" else "BLOCKED"),
                recommended_value=rec_val,
                final_value=rec_val if status == "AUTO" else None,
                confidence=conf,
                reasoning=reasoning,
                created_at=datetime.utcnow(),
                resolved_at=datetime.utcnow() if status == "AUTO" else None,
                resolved_by="AI_RECONCILER" if status == "AUTO" else None
            )
            db.add(conflict)
            db.flush()

            # Add conflicting value entries
            for cv in candidate_values:
                is_sel = (status == "AUTO" and cv["value"] == rec_val)
                db.add(ConflictingValue(
                    conflict_id=conflict.id,
                    source_record_id=cv["record_id"],
                    source_name=cv["source_name"],
                    value=cv["value"],
                    authority_score=settings.DEFAULT_SOURCE_AUTHORITIES.get(cv["source_name"], 0.7),
                    is_selected=is_sel
                ))

            # Store evidence items in DB
            for ev in evidences:
                db.add(FieldEvidence(
                    conflict_id=conflict.id,
                    entity_id=entity.id,
                    field_name=f_name,
                    source_title=ev["source_title"],
                    url_reference=ev.get("url_reference"),
                    value=ev["value"],
                    authority=ev["authority"],
                    relevance=ev["relevance"],
                    confidence=ev["confidence"],
                    raw_snippet=ev.get("raw_snippet")
                ))

            # Audit event for conflict/evaluation
            db.add(AuditLog(
                entity_id=entity.id,
                field=f_name,
                action="CONFLICT_CREATED" if is_conflict else "FIELD_EVALUATED",
                actor="CONFLICT_ENGINE",
                new_value=rec_val,
                reason=f"Assessed {len(candidate_values)} values across {len(set(c['source_name'] for c in candidate_values))} sources. Status: {status} ({conf}%)",
                evidence_ids=json.dumps([f"{c['source_name']}: {c['value']}" for c in candidate_values])
            ))

            # Route based on status
            if status == "AUTO":
                stats["auto_resolved"] += 1
                # Create Golden Record field
                db.add(TrustedField(
                    entity_id=entity.id,
                    field_name=f_name,
                    value=rec_val,
                    confidence=conf,
                    resolution_state="AUTO",
                    source_names_json=json.dumps(trust_res["agreeing_sources"]),
                    reasoning=reasoning,
                    decided_by="AI_ENGINE",
                    decided_at=datetime.utcnow(),
                    is_latest=True
                ))
                db.add(AuditLog(
                    entity_id=entity.id,
                    field=f_name,
                    action="TRUSTED_VALUE_CREATED",
                    actor="AI_RECONCILER",
                    new_value=rec_val,
                    reason=reasoning,
                    evidence_ids=json.dumps(trust_res["agreeing_sources"])
                ))
            elif status == "REVIEW":
                has_review = True
                stats["needs_review"] += 1
                conflict.status = "review_required"
                db.add(AuditLog(
                    entity_id=entity.id,
                    field=f_name,
                    action="AI_RECOMMENDATION",
                    actor="AI_COPILOT",
                    new_value=rec_val,
                    reason=f"Recommended '{rec_val}' ({conf}% confidence). Routed to /review queue for human approval.",
                    evidence_ids=json.dumps(trust_res["agreeing_sources"])
                ))
            elif status == "BLOCK":
                has_blocked = True
                stats["blocked"] += 1
                conflict.status = "blocked"
                db.add(AuditLog(
                    entity_id=entity.id,
                    field=f_name,
                    action="RECONCILIATION_BLOCKED",
                    actor="ZERO_TRUST_GATEWAY",
                    new_value=None,
                    reason=f"Confidence {conf}% falls below zero-trust threshold (<70%). Blocked from automated resolution.",
                    evidence_ids=json.dumps([])
                ))

        # Set final entity overall status
        if has_blocked:
            entity.status = "blocked"
        elif has_review:
            entity.status = "needs_review"
        else:
            entity.status = "auto_reconciled"

    db.commit()
    return stats
