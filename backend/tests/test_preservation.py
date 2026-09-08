import json
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base
from app.models.source import IngestionSource
from app.models.record import SourceRecord
from app.models.entity import CanonicalEntity, TrustedField
from app.services.reconciliation import run_reconciliation_pipeline

@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()
    yield db
    db.close()

def test_reconciliation_never_deletes_or_mutates_source_records(test_db):
    # 1. Ingest CRM record
    crm_source = IngestionSource(name="CRM", source_type="CRM", total_records=1, columns_json='["name", "address"]')
    test_db.add(crm_source)
    test_db.flush()

    raw_crm = {"name": "John A Smith", "address": "12 MG Road", "phone": "+919876543210"}
    norm_crm = {"entity_name": "John A Smith", "address": "12 MG Road", "phone": "+919876543210"}
    rec1 = SourceRecord(
        source_id=crm_source.id,
        external_record_id="CRM-1",
        raw_data_json=json.dumps(raw_crm),
        normalized_data_json=json.dumps(norm_crm)
    )
    test_db.add(rec1)

    # 2. Ingest ERP record with conflicting address
    erp_source = IngestionSource(name="ERP", source_type="ERP", total_records=1, columns_json='["name", "address"]')
    test_db.add(erp_source)
    test_db.flush()

    raw_erp = {"name": "J. Smith", "address": "18 MG Rd", "phone": "+919876543210"}
    norm_erp = {"entity_name": "J. Smith", "address": "18 MG Rd", "phone": "+919876543210"}
    rec2 = SourceRecord(
        source_id=erp_source.id,
        external_record_id="ERP-1",
        raw_data_json=json.dumps(raw_erp),
        normalized_data_json=json.dumps(norm_erp)
    )
    test_db.add(rec2)
    test_db.commit()

    initial_records_count = test_db.query(SourceRecord).count()
    assert initial_records_count == 2

    # 3. Execute reconciliation
    results = run_reconciliation_pipeline(test_db)
    assert results["entities_created"] == 1

    # 4. ASSERTION: Source records count must be unchanged
    after_records = test_db.query(SourceRecord).all()
    assert len(after_records) == 2, "Reconciliation deleted source records!"

    # 5. ASSERTION: Raw data in source records must remain 100% identical
    erp_rec_after = test_db.query(SourceRecord).filter(SourceRecord.source_id == erp_source.id).first()
    raw_erp_after = json.loads(erp_rec_after.raw_data_json)
    assert raw_erp_after["address"] == "18 MG Rd", "ERP original address was overwritten!"

    crm_rec_after = test_db.query(SourceRecord).filter(SourceRecord.source_id == crm_source.id).first()
    raw_crm_after = json.loads(crm_rec_after.raw_data_json)
    assert raw_crm_after["address"] == "12 MG Road", "CRM original address was modified!"

    # 6. Check that a trusted golden record exists independently
    trusted_address = test_db.query(TrustedField).filter(TrustedField.field_name == "address").first()
    assert trusted_address is not None
    assert trusted_address.value == "12 MG Road"
