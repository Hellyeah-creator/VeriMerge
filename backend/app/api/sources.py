import io
import json
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
import pandas as pd

from app.core.database import get_db
from app.models.source import IngestionSource
from app.models.record import SourceRecord
from app.models.audit import AuditLog
from app.schemas.source import SourceResponse, SourcePreview
from app.services.normalizer import detect_canonical_mapping, normalize_record

router = APIRouter(prefix="/sources", tags=["Sources"])

@router.get("", response_model=List[SourceResponse])
def list_sources(db: Session = Depends(get_db)):
    sources = db.query(IngestionSource).order_by(IngestionSource.uploaded_at.desc()).all()
    results = []
    for s in sources:
        cols = json.loads(s.columns_json) if s.columns_json else []
        results.append(SourceResponse(
            id=s.id,
            name=s.name,
            source_type=s.source_type,
            filename=s.filename,
            total_records=s.total_records,
            total_columns=s.total_columns,
            columns=cols,
            uploaded_at=s.uploaded_at,
            status=s.status,
            error_message=s.error_message
        ))
    return results

@router.post("/upload", response_model=SourceResponse)
async def upload_source(
    file: UploadFile = File(...),
    name: str = Form(None),
    source_type: str = Form("CRM"),
    db: Session = Depends(get_db)
):
    filename = file.filename
    if not name:
        name = filename.rsplit(".", 1)[0]

    contents = await file.read()
    df = None

    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        elif filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(contents))
        elif filename.endswith(".json"):
            json_data = json.loads(contents.decode("utf-8"))
            if isinstance(json_data, dict) and "records" in json_data:
                df = pd.DataFrame(json_data["records"])
            elif isinstance(json_data, list):
                df = pd.DataFrame(json_data)
            else:
                df = pd.DataFrame([json_data])
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload CSV, XLSX, or JSON.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    # Clean DataFrame
    df = df.fillna("")
    columns = [str(c) for c in df.columns.tolist()]
    mapping = detect_canonical_mapping(columns)

    # Save Source Metadata
    source = IngestionSource(
        name=name,
        source_type=source_type.upper(),
        filename=filename,
        total_records=len(df),
        total_columns=len(columns),
        columns_json=json.dumps(columns),
        uploaded_at=datetime.utcnow(),
        status="processed"
    )
    db.add(source)
    db.flush()

    # Save Raw Immutable Records
    for idx, row in df.iterrows():
        raw_dict = row.to_dict()
        normalized_dict = normalize_record(raw_dict, mapping)
        ext_id = str(raw_dict.get("id", raw_dict.get("record_id", f"{source.source_type}#{idx+1}")))

        source_rec = SourceRecord(
            source_id=source.id,
            external_record_id=ext_id,
            raw_data_json=json.dumps(raw_dict),
            normalized_data_json=json.dumps(normalized_dict),
            ingested_at=datetime.utcnow()
        )
        db.add(source_rec)

    # Add audit entry
    db.add(AuditLog(
        entity_id=None,
        field=None,
        action="RECORD_IMPORTED",
        actor="SYSTEM_INGESTION",
        new_value=f"{source.name} ({source.total_records} records)",
        reason=f"Successfully ingested {source.filename} into source catalog. Mapped {len(mapping)} fields to canonical schema.",
        evidence_ids=json.dumps(columns)
    ))

    db.commit()
    db.refresh(source)

    return SourceResponse(
        id=source.id,
        name=source.name,
        source_type=source.source_type,
        filename=source.filename,
        total_records=source.total_records,
        total_columns=source.total_columns,
        columns=columns,
        uploaded_at=source.uploaded_at,
        status=source.status
    )

@router.get("/{source_id}/preview", response_model=SourcePreview)
def preview_source(source_id: int, db: Session = Depends(get_db)):
    source = db.query(IngestionSource).filter(IngestionSource.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    columns = json.loads(source.columns_json) if source.columns_json else []
    mapping = detect_canonical_mapping(columns)

    records = db.query(SourceRecord).filter(SourceRecord.source_id == source_id).limit(10).all()
    sample_rows = [json.loads(r.raw_data_json) for r in records]

    return SourcePreview(
        source_id=source.id,
        name=source.name,
        source_type=source.source_type,
        total_records=source.total_records,
        columns=columns,
        sample_rows=sample_rows,
        detected_mappings=mapping
    )

@router.delete("/{source_id}")
def delete_source(source_id: int, db: Session = Depends(get_db)):
    source = db.query(IngestionSource).filter(IngestionSource.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    
    db.query(SourceRecord).filter(SourceRecord.source_id == source_id).delete()
    db.delete(source)
    db.commit()
    return {"status": "success", "message": f"Source {source_id} deleted."}
