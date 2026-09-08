import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.models.settings import SystemSetting
from app.schemas.settings import SettingsResponse, SettingsUpdateRequest

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("", response_model=SettingsResponse)
def get_system_settings(db: Session = Depends(get_db)):
    auto_th = db.query(SystemSetting).filter(SystemSetting.key == "AUTO_RESOLVE_THRESHOLD").first()
    rev_th = db.query(SystemSetting).filter(SystemSetting.key == "HUMAN_REVIEW_THRESHOLD").first()
    ent_th = db.query(SystemSetting).filter(SystemSetting.key == "ENTITY_MATCH_THRESHOLD").first()
    src_auth = db.query(SystemSetting).filter(SystemSetting.key == "SOURCE_AUTHORITIES").first()

    return SettingsResponse(
        auto_resolve_threshold=float(auto_th.value_json) if auto_th else settings.AUTO_RESOLVE_THRESHOLD,
        human_review_threshold=float(rev_th.value_json) if rev_th else settings.HUMAN_REVIEW_THRESHOLD,
        entity_match_threshold=float(ent_th.value_json) if ent_th else settings.ENTITY_MATCH_THRESHOLD,
        source_authorities=json.loads(src_auth.value_json) if src_auth else settings.DEFAULT_SOURCE_AUTHORITIES
    )

@router.post("", response_model=SettingsResponse)
def update_system_settings(payload: SettingsUpdateRequest, db: Session = Depends(get_db)):
    def set_val(k: str, v: str):
        row = db.query(SystemSetting).filter(SystemSetting.key == k).first()
        if not row:
            row = SystemSetting(key=k, value_json=v)
            db.add(row)
        else:
            row.value_json = v

    set_val("AUTO_RESOLVE_THRESHOLD", str(payload.auto_resolve_threshold))
    set_val("HUMAN_REVIEW_THRESHOLD", str(payload.human_review_threshold))
    set_val("ENTITY_MATCH_THRESHOLD", str(payload.entity_match_threshold))
    set_val("SOURCE_AUTHORITIES", json.dumps(payload.source_authorities))

    # Also update in-memory settings
    settings.AUTO_RESOLVE_THRESHOLD = payload.auto_resolve_threshold
    settings.HUMAN_REVIEW_THRESHOLD = payload.human_review_threshold
    settings.ENTITY_MATCH_THRESHOLD = payload.entity_match_threshold
    settings.DEFAULT_SOURCE_AUTHORITIES = payload.source_authorities

    db.commit()

    return SettingsResponse(
        auto_resolve_threshold=payload.auto_resolve_threshold,
        human_review_threshold=payload.human_review_threshold,
        entity_match_threshold=payload.entity_match_threshold,
        source_authorities=payload.source_authorities
    )
