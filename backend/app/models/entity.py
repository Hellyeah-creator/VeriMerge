from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class CanonicalEntity(Base):
    __tablename__ = "canonical_entities"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    canonical_name = Column(String(255), nullable=False, index=True)
    entity_type = Column(String(50), default="INDIVIDUAL") # INDIVIDUAL, ORGANIZATION
    match_confidence = Column(Float, default=100.0)
    matching_features_json = Column(Text, default="[]") # e.g. ["exact_phone", "fuzzy_name_0.94"]
    status = Column(String(50), default="needs_review") # auto_reconciled, needs_review, blocked
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    records = relationship("SourceRecord", back_populates="entity")
    conflicts = relationship("FieldConflict", back_populates="entity", cascade="all, delete-orphan")
    trusted_fields = relationship("TrustedField", back_populates="entity", cascade="all, delete-orphan")

class TrustedField(Base):
    """
    Represents the golden trusted record for a specific canonical entity field.
    Carries complete provenance: confidence, reasoning, evidence links, and who decided it.
    """
    __tablename__ = "trusted_fields"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    entity_id = Column(Integer, ForeignKey("canonical_entities.id"), nullable=False, index=True)
    field_name = Column(String(100), nullable=False) # e.g. address, phone, director
    value = Column(Text, nullable=True) # Final trusted value
    confidence = Column(Float, nullable=False) # e.g. 96.0
    resolution_state = Column(String(50), nullable=False) # AUTO, REVIEW, BLOCK
    source_names_json = Column(Text, default="[]") # Corroborating sources e.g. ["CRM", "WEB"]
    reasoning = Column(Text, nullable=True) # Why this value was chosen
    decided_by = Column(String(100), default="AI_ENGINE") # AI_ENGINE, HUMAN_REVIEWER
    decided_at = Column(DateTime, default=datetime.utcnow)
    is_latest = Column(Boolean, default=True)

    entity = relationship("CanonicalEntity", back_populates="trusted_fields")
