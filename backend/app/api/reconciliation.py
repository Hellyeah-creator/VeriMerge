import os
import io
import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import pandas as pd

from app.core.database import get_db
from app.models.source import IngestionSource
from app.models.record import SourceRecord
from app.models.entity import CanonicalEntity
from app.models.conflict import FieldConflict
from app.models.audit import AuditLog
from app.services.reconciliation import run_reconciliation_pipeline
from app.services.normalizer import detect_canonical_mapping, normalize_record

router = APIRouter(prefix="/reconciliation", tags=["Reconciliation"])

@router.post("/run")
def trigger_reconciliation(db: Session = Depends(get_db)):
    """
    Executes the end-to-end zero-trust reconciliation pipeline across all ingested data.
    """
    try:
        results = run_reconciliation_pipeline(db)
        return {"status": "success", "data": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reconciliation error: {str(e)}")

@router.get("/status")
def get_reconciliation_status(db: Session = Depends(get_db)):
    total_records = db.query(SourceRecord).count()
    entities_count = db.query(CanonicalEntity).count()
    conflicts_count = db.query(FieldConflict).count()
    auto_resolved = db.query(FieldConflict).filter(FieldConflict.resolution_type == "AUTO").count()
    needs_review = db.query(FieldConflict).filter(FieldConflict.status == "review_required").count()
    blocked = db.query(FieldConflict).filter(FieldConflict.status == "blocked").count()

    return {
        "status": "ready" if total_records > 0 else "idle",
        "total_records": total_records,
        "unique_entities": entities_count,
        "total_conflicts": conflicts_count,
        "auto_resolved": auto_resolved,
        "needs_review": needs_review,
        "blocked": blocked
    }

@router.post("/load-demo")
def load_and_run_demo(db: Session = Depends(get_db)):
    """
    1-Click Live Demo Seeder:
    Loads CRM.csv, ERP.csv, Customers.xlsx, WebEvidence.json and executes reconciliation.
    """
    demo_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "demo_data")
    
    # 1. Load CRM.csv
    crm_path = os.path.join(demo_dir, "CRM.csv")
    erp_path = os.path.join(demo_dir, "ERP.csv")
    cust_path = os.path.join(demo_dir, "Customers.xlsx")
    web_path = os.path.join(demo_dir, "WebEvidence.json")

    # Clear existing sources and records for clean demo
    db.query(SourceRecord).delete()
    db.query(IngestionSource).delete()
    db.commit()

    file_sources = [
        ("Enterprise CRM", "CRM", crm_path, "csv"),
        ("Global ERP Database", "ERP", erp_path, "csv"),
        ("Customer Onboarding", "EXCEL", cust_path, "excel"),
        ("Public Web Evidence", "WEB/API", web_path, "json"),
    ]

    for name, s_type, f_path, f_format in file_sources:
        if not os.path.exists(f_path):
            continue

        if f_format == "csv":
            df = pd.read_csv(f_path)
        elif f_format == "excel":
            df = pd.read_excel(f_path)
        elif f_format == "json":
            with open(f_path, "r", encoding="utf-8") as jf:
                data = json.load(jf)
                df = pd.DataFrame(data if isinstance(data, list) else [data])
        else:
            continue

        df = df.fillna("")
        cols = [str(c) for c in df.columns.tolist()]
        mapping = detect_canonical_mapping(cols)

        source = IngestionSource(
            name=name,
            source_type=s_type,
            filename=os.path.basename(f_path),
            total_records=len(df),
            total_columns=len(cols),
            columns_json=json.dumps(cols),
            status="processed"
        )
        db.add(source)
        db.flush()

        for idx, row in df.iterrows():
            raw_d = row.to_dict()
            norm_d = normalize_record(raw_d, mapping)
            ext_id = str(raw_d.get("id", raw_d.get("record_id", f"{s_type}#{idx+1}")))

            db.add(SourceRecord(
                source_id=source.id,
                external_record_id=ext_id,
                raw_data_json=json.dumps(raw_d),
                normalized_data_json=json.dumps(norm_d),
                ingested_at=datetime.utcnow()
            ))

        db.add(AuditLog(
            entity_id=None,
            field=None,
            action="RECORD_IMPORTED",
            actor="DEMO_LOADER",
            new_value=f"{name} ({len(df)} records)",
            reason="Loaded seed dataset for live demonstration.",
            evidence_ids=json.dumps(cols)
        ))

    db.commit()

    # Automatically trigger reconciliation pipeline
    pipeline_stats = run_reconciliation_pipeline(db)

    return {
        "status": "success",
        "message": "Demo data successfully seeded and reconciled!",
        "stats": pipeline_stats
    }
