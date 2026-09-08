import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.entity import CanonicalEntity, TrustedField
from app.models.record import SourceRecord
from app.models.conflict import FieldConflict, ConflictingValue
from app.models.evidence import FieldEvidence
from app.schemas.entity import EntityResponse, EntityDetailResponse, TrustedFieldResponse
from app.schemas.record import RecordResponse
from app.schemas.conflict import ConflictResponse, ConflictingValueResponse
from app.schemas.evidence import EvidenceResponse

router = APIRouter(prefix="/entities", tags=["Entities"])

@router.get("", response_model=List[EntityResponse])
def list_entities(db: Session = Depends(get_db)):
    entities = db.query(CanonicalEntity).order_by(CanonicalEntity.updated_at.desc()).all()
    out = []
    for e in entities:
        feats = json.loads(e.matching_features_json) if e.matching_features_json else []
        rec_count = db.query(SourceRecord).filter(SourceRecord.entity_id == e.id).count()
        conf_count = db.query(FieldConflict).filter(FieldConflict.entity_id == e.id, FieldConflict.status != "auto_resolved").count()
        out.append(EntityResponse(
            id=e.id,
            canonical_name=e.canonical_name,
            entity_type=e.entity_type,
            match_confidence=e.match_confidence,
            matching_features=feats,
            status=e.status,
            record_count=rec_count,
            conflict_count=conf_count,
            created_at=e.created_at,
            updated_at=e.updated_at
        ))
    return out

@router.get("/{entity_id}", response_model=EntityDetailResponse)
def get_entity_detail(entity_id: int, db: Session = Depends(get_db)):
    entity = db.query(CanonicalEntity).filter(CanonicalEntity.id == entity_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")

    feats = json.loads(entity.matching_features_json) if entity.matching_features_json else []

    # Records (preserves raw original schema)
    records_db = db.query(SourceRecord).filter(SourceRecord.entity_id == entity.id).all()
    record_responses = []
    for r in records_db:
        record_responses.append(RecordResponse(
            id=r.id,
            source_id=r.source_id,
            source_name=r.source.name if r.source else "UNKNOWN",
            external_record_id=r.external_record_id,
            raw_data=json.loads(r.raw_data_json),
            normalized_data=json.loads(r.normalized_data_json),
            entity_id=r.entity_id,
            ingested_at=r.ingested_at
        ))

    # Conflicts
    conflicts_db = db.query(FieldConflict).filter(FieldConflict.entity_id == entity.id).all()
    conflict_responses = []
    for c in conflicts_db:
        vals = db.query(ConflictingValue).filter(ConflictingValue.conflict_id == c.id).all()
        val_res = [
            ConflictingValueResponse(
                id=v.id,
                source_name=v.source_name,
                value=v.value,
                authority_score=v.authority_score,
                is_selected=v.is_selected,
                timestamp=v.timestamp
            ) for v in vals
        ]

        ev_items = db.query(FieldEvidence).filter(FieldEvidence.conflict_id == c.id).all()
        ev_res = [
            EvidenceResponse(
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
            ) for ev in ev_items
        ]

        conflict_responses.append(ConflictResponse(
            id=c.id,
            entity_id=c.entity_id,
            entity_name=entity.canonical_name,
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
            values=val_res,
            evidence_items=ev_res
        ))

    # Golden Trusted Fields
    trusted_db = db.query(TrustedField).filter(TrustedField.entity_id == entity.id).all()
    trusted_responses = []
    for tf in trusted_db:
        srcs = json.loads(tf.source_names_json) if tf.source_names_json else []
        trusted_responses.append(TrustedFieldResponse(
            id=tf.id,
            field_name=tf.field_name,
            value=tf.value,
            confidence=tf.confidence,
            resolution_state=tf.resolution_state,
            source_names=srcs,
            reasoning=tf.reasoning,
            decided_by=tf.decided_by,
            decided_at=tf.decided_at,
            is_latest=tf.is_latest
        ))

    return EntityDetailResponse(
        id=entity.id,
        canonical_name=entity.canonical_name,
        entity_type=entity.entity_type,
        match_confidence=entity.match_confidence,
        matching_features=feats,
        status=entity.status,
        created_at=entity.created_at,
        updated_at=entity.updated_at,
        records=record_responses,
        conflicts=conflict_responses,
        trusted_fields=trusted_responses
    )

@router.get("/{entity_id}/graph")
def get_entity_evidence_graph(entity_id: int, db: Session = Depends(get_db)):
    """
    Constructs the complete hierarchical Evidence Graph for this entity:
    SOURCE -> RECORD -> ENTITY -> FIELD -> EVIDENCE -> AI DECISION -> TRUSTED RECORD
    """
    entity = db.query(CanonicalEntity).filter(CanonicalEntity.id == entity_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")

    nodes = []
    edges = []

    # 1. Entity Node (Root anchor)
    entity_node_id = f"entity_{entity.id}"
    nodes.append({
        "id": entity_node_id,
        "type": "ENTITY",
        "label": entity.canonical_name,
        "subtitle": f"Match Confidence: {entity.match_confidence}%",
        "status": entity.status,
        "data": {
            "id": entity.id,
            "name": entity.canonical_name,
            "type": entity.entity_type,
            "confidence": entity.match_confidence
        }
    })

    # 2. Source & Record Nodes
    records = db.query(SourceRecord).filter(SourceRecord.entity_id == entity.id).all()
    seen_sources = set()
    for r in records:
        src_name = r.source.name if r.source else "UNKNOWN"
        src_node_id = f"source_{r.source_id}"
        if src_node_id not in seen_sources:
            seen_sources.add(src_node_id)
            nodes.append({
                "id": src_node_id,
                "type": "SOURCE",
                "label": src_name,
                "subtitle": r.source.source_type if r.source else "DATA_SOURCE",
                "status": "active",
                "data": {
                    "source_name": src_name,
                    "filename": r.source.filename if r.source else ""
                }
            })

        rec_node_id = f"record_{r.id}"
        nodes.append({
            "id": rec_node_id,
            "type": "RECORD",
            "label": f"{src_name} #{r.external_record_id}",
            "subtitle": f"Record ID: {r.id}",
            "status": "ingested",
            "data": {
                "record_id": r.id,
                "external_id": r.external_record_id,
                "raw_data": json.loads(r.raw_data_json)
            }
        })
        # Edge: SOURCE -> RECORD
        edges.append({
            "id": f"e_{src_node_id}_{rec_node_id}",
            "source": src_node_id,
            "target": rec_node_id,
            "label": "contains"
        })
        # Edge: RECORD -> ENTITY
        edges.append({
            "id": f"e_{rec_node_id}_{entity_node_id}",
            "source": rec_node_id,
            "target": entity_node_id,
            "label": "resolved to"
        })

    # 3. Field & Conflict & Evidence & AI Decision & Trusted Record Nodes
    conflicts = db.query(FieldConflict).filter(FieldConflict.entity_id == entity.id).all()
    for c in conflicts:
        field_node_id = f"field_{c.id}"
        nodes.append({
            "id": field_node_id,
            "type": "FIELD",
            "label": c.field_name.upper(),
            "subtitle": f"Status: {c.status.upper()}",
            "status": c.status,
            "data": {
                "field_name": c.field_name,
                "confidence": c.confidence,
                "status": c.status
            }
        })
        # Edge: ENTITY -> FIELD
        edges.append({
            "id": f"e_{entity_node_id}_{field_node_id}",
            "source": entity_node_id,
            "target": field_node_id,
            "label": "has field"
        })

        # Evidences attached to this field
        evidences = db.query(FieldEvidence).filter(FieldEvidence.conflict_id == c.id).all()
        for ev in evidences:
            ev_node_id = f"evidence_{ev.id}"
            nodes.append({
                "id": ev_node_id,
                "type": "EVIDENCE",
                "label": ev.source_title[:28] + ("..." if len(ev.source_title) > 28 else ""),
                "subtitle": f"Value: '{ev.value}' (Auth: {ev.authority})",
                "status": ev.relevance.lower(),
                "data": {
                    "source_title": ev.source_title,
                    "url": ev.url_reference,
                    "value": ev.value,
                    "authority": ev.authority,
                    "confidence": ev.confidence,
                    "snippet": ev.raw_snippet
                }
            })
            # Edge: FIELD -> EVIDENCE
            edges.append({
                "id": f"e_{field_node_id}_{ev_node_id}",
                "source": field_node_id,
                "target": ev_node_id,
                "label": "verified by"
            })

        # AI Decision Node
        ai_node_id = f"ai_decision_{c.id}"
        nodes.append({
            "id": ai_node_id,
            "type": "AI_DECISION",
            "label": f"AI Decision ({c.confidence}%)",
            "subtitle": f"Rec: {c.recommended_value or 'None'}",
            "status": c.resolution_type.lower(),
            "data": {
                "recommended_value": c.recommended_value,
                "confidence": c.confidence,
                "reasoning": c.reasoning,
                "resolution_type": c.resolution_type
            }
        })
        # Edge: FIELD -> AI DECISION
        edges.append({
            "id": f"e_{field_node_id}_{ai_node_id}",
            "source": field_node_id,
            "target": ai_node_id,
            "label": "evaluates"
        })

        # If trusted field exists -> Golden Record Node
        tf = db.query(TrustedField).filter(
            TrustedField.entity_id == entity.id,
            TrustedField.field_name == c.field_name
        ).first()

        if tf:
            trusted_node_id = f"trusted_{tf.id}"
            nodes.append({
                "id": trusted_node_id,
                "type": "TRUSTED_RECORD",
                "label": f"Trusted: {tf.value}",
                "subtitle": f"{tf.confidence}% • {tf.decided_by}",
                "status": "trusted",
                "data": {
                    "field_name": tf.field_name,
                    "value": tf.value,
                    "confidence": tf.confidence,
                    "reasoning": tf.reasoning,
                    "decided_by": tf.decided_by
                }
            })
            # Edge: AI DECISION -> TRUSTED RECORD
            edges.append({
                "id": f"e_{ai_node_id}_{trusted_node_id}",
                "source": ai_node_id,
                "target": trusted_node_id,
                "label": "produces"
            })

    return {
        "entity_id": entity.id,
        "canonical_name": entity.canonical_name,
        "nodes": nodes,
        "edges": edges
    }
