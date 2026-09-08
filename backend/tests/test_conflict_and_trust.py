import pytest
from app.services.trust_scoring import calculate_field_confidence

def test_field_confidence_corroborated():
    # 12 MG Road with external evidence corroboration
    candidate_values = [
        {"source": "CRM", "value": "12 MG Road"},
        {"source": "ERP", "value": "18 MG Road"},
        {"source": "EXCEL", "value": "12 MG Road"}
    ]
    external_evidences = [
        {"source_title": "MCA Corporate Registry", "value": "12 MG Road", "authority": 0.95}
    ]

    res = calculate_field_confidence(
        field_name="address",
        candidate_values=candidate_values,
        external_evidences=external_evidences,
        entity_match_confidence=97.0
    )

    assert res["recommended_value"] == "12 MG Road"
    assert res["confidence"] >= 90.0
    assert res["status"] == "AUTO"
    assert res["is_conflict"] is True

def test_director_human_review_threshold():
    candidate_values = [
        {"source": "ERP", "value": "Raj Kumar"}
    ]
    res = calculate_field_confidence(
        field_name="director",
        candidate_values=candidate_values,
        external_evidences=[]
    )
    # Director should trigger Human Review (70% - 89%)
    assert res["status"] == "REVIEW"
    assert 70.0 <= res["confidence"] < 90.0

def test_bank_details_blocked():
    candidate_values = [
        {"source": "CRM", "value": "•••• 4321"}
    ]
    res = calculate_field_confidence(
        field_name="bank_account",
        candidate_values=candidate_values,
        external_evidences=[]
    )
    # Bank details should trigger Block (<70%)
    assert res["status"] == "BLOCK"
    assert res["confidence"] < 70.0
