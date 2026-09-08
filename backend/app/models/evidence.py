from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class FieldEvidence(Base):
    __tablename__ = "field_evidences"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    conflict_id = Column(Integer, ForeignKey("field_conflicts.id"), nullable=True, index=True)
    entity_id = Column(Integer, ForeignKey("canonical_entities.id"), nullable=False, index=True)
    field_name = Column(String(100), nullable=False)
    source_title = Column(String(255), nullable=False) # e.g. "Government MCA Registry", "Official Company Portal"
    url_reference = Column(String(500), nullable=True) # Reference or API endpoint
    retrieved_at = Column(DateTime, default=datetime.utcnow)
    value = Column(Text, nullable=False) # Corroborating value found
    authority = Column(Float, default=0.85) # Source authority weight [0.0, 1.0]
    relevance = Column(String(50), default="HIGH") # HIGH, MEDIUM, LOW
    confidence = Column(Float, default=95.0) # Evidence confidence [0, 100]
    raw_snippet = Column(Text, nullable=True) # Evidentiary extract/quote

    conflict = relationship("FieldConflict", back_populates="evidence_items")
