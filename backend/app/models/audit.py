import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from app.core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    event_id = Column(String(64), default=lambda: f"EVT-{uuid.uuid4().hex[:12].upper()}", unique=True, index=True)
    entity_id = Column(Integer, nullable=True, index=True)
    field = Column(String(100), nullable=True) # Field name (e.g. address) or None for entity level
    action = Column(String(100), nullable=False, index=True) # RECORD_IMPORTED, ENTITY_MATCHED, CONFLICT_CREATED, EVIDENCE_ADDED, AI_RECOMMENDATION, HUMAN_APPROVAL, HUMAN_REJECTION, TRUSTED_VALUE_CREATED
    actor = Column(String(100), default="SYSTEM_PIPELINE") # SYSTEM_PIPELINE, AI_COPILOT, HUMAN_REVIEWER
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    reason = Column(Text, nullable=True)
    evidence_ids = Column(Text, default="[]") # JSON list of evidence IDs/sources
