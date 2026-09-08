from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class FieldConflict(Base):
    __tablename__ = "field_conflicts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    entity_id = Column(Integer, ForeignKey("canonical_entities.id"), nullable=False, index=True)
    field_name = Column(String(100), nullable=False) # e.g. address, director, bank_account
    status = Column(String(50), default="conflict") # conflict, auto_resolved, human_reviewed, blocked
    resolution_type = Column(String(50), default="UNRESOLVED") # AUTO, MANUAL, UNRESOLVED, BLOCKED
    recommended_value = Column(Text, nullable=True) # AI or scoring recommendation
    final_value = Column(Text, nullable=True) # Selected/approved value
    confidence = Column(Float, default=0.0) # Calculated field confidence score
    reasoning = Column(Text, nullable=True) # Structured AI reasoning
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    resolved_by = Column(String(100), nullable=True) # AI_RECONCILER, user@verimerge.ai

    entity = relationship("CanonicalEntity", back_populates="conflicts")
    values = relationship("ConflictingValue", back_populates="conflict", cascade="all, delete-orphan")
    evidence_items = relationship("FieldEvidence", back_populates="conflict", cascade="all, delete-orphan")

class ConflictingValue(Base):
    __tablename__ = "conflicting_values"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    conflict_id = Column(Integer, ForeignKey("field_conflicts.id"), nullable=False, index=True)
    source_record_id = Column(Integer, ForeignKey("source_records.id"), nullable=True)
    source_name = Column(String(100), nullable=False) # CRM, ERP, EXCEL
    value = Column(Text, nullable=True)
    authority_score = Column(Float, default=0.7)
    is_selected = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    conflict = relationship("FieldConflict", back_populates="values")
    source_record = relationship("SourceRecord")
