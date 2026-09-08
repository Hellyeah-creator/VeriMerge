import pytest
from app.services.entity_resolution import calculate_pair_similarity, resolve_entities_graph

def test_multi_signal_pair_matching():
    # John A Smith vs J. Smith with same phone and similar address
    rec_a = {
        "entity_name": "John A Smith",
        "entity_name_norm": "john a smith",
        "phone": "+919876543210",
        "address": "12 MG Road",
        "address_norm": "12 mg road"
    }
    rec_b = {
        "entity_name": "J. Smith",
        "entity_name_norm": "j smith",
        "phone": "+919876543210",
        "address": "18 MG Rd",
        "address_norm": "18 mg road"
    }

    score, features = calculate_pair_similarity(rec_a, rec_b)
    assert score >= 80.0
    assert "exact_phone_match" in features

def test_resolve_entities_clustering():
    records = [
        {"db_id": 1, "source_name": "CRM", "normalized_data": {"entity_name": "John A Smith", "phone": "+919876543210", "address_norm": "12 mg road"}},
        {"db_id": 2, "source_name": "ERP", "normalized_data": {"entity_name": "J. Smith", "phone": "+919876543210", "address_norm": "18 mg road"}},
        {"db_id": 3, "source_name": "Excel", "normalized_data": {"entity_name": "Jon Smith", "phone": "+919876543210", "address_norm": "12 mg road"}},
        {"db_id": 4, "source_name": "CRM", "normalized_data": {"entity_name": "Acme Global", "phone": "+14155550192", "address_norm": "45 cyber city"}}
    ]

    clusters = resolve_entities_graph(records, match_threshold=75.0)
    # Should resolve into 2 entities: John Smith cluster (3 records) and Acme Global (1 record)
    assert len(clusters) == 2
    john_cluster = next(c for c in clusters if "smith" in c["canonical_name"].lower())
    assert len(john_cluster["records"]) == 3
    assert john_cluster["match_confidence"] >= 90.0
