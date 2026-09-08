from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text
from app.core.database import Base

class IngestionSource(Base):
    __tablename__ = "ingestion_sources"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    source_type = Column(String(50), nullable=False) # CRM, ERP, EXCEL, WEB/API, REGISTRY
    filename = Column(String(255), nullable=True)
    total_records = Column(Integer, default=0)
    total_columns = Column(Integer, default=0)
    columns_json = Column(Text, default="[]")
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default="processed") # uploaded, processing, processed, error
    error_message = Column(Text, nullable=True)
