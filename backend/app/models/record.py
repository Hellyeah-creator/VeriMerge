from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class SourceRecord(Base):
    """
    Immutable representation of an ingested raw record.
    Preserves original field names, original values, and source metadata.
    NEVER deleted or modified by reconciliation.
    """
    __tablename__ = "source_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    source_id = Column(Integer, ForeignKey("ingestion_sources.id"), nullable=False, index=True)
    external_record_id = Column(String(255), nullable=True) # e.g. CRM Record #392
    raw_data_json = Column(Text, nullable=False) # Original untouched record
    normalized_data_json = Column(Text, nullable=False) # Canonical mapped fields
    entity_id = Column(Integer, ForeignKey("canonical_entities.id"), nullable=True, index=True)
    ingested_at = Column(DateTime, default=datetime.utcnow)

    source = relationship("IngestionSource")
    entity = relationship("CanonicalEntity", back_populates="records")
