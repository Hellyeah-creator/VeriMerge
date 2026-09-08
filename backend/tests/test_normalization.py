import pytest
from app.services.normalizer import detect_canonical_mapping, clean_phone_number, clean_address_string, normalize_record

def test_column_mapping_detection():
    cols = ["customer_name", "cust_addr", "mobile_no", "cin_number", "bank_account_no"]
    mapping = detect_canonical_mapping(cols)
    assert mapping["customer_name"] == "entity_name"
    assert mapping["mobile_no"] == "phone"
    assert mapping["bank_account_no"] == "bank_account"

def test_clean_phone_number():
    assert clean_phone_number("+91 98765-43210") == "+919876543210"
    assert clean_phone_number("(415) 555-0192") == "4155550192"

def test_clean_address():
    disp, norm = clean_address_string("12 M.G. Road, Suite #4")
    assert "mg road" in norm
    assert disp == "12 M.G. Road, Suite #4"

def test_normalize_record_preserves_keys():
    raw = {"Client_Name": "John A Smith", "Office_Addr": "12 MG Rd", "Custom_Field": "Custom123"}
    mapping = detect_canonical_mapping(list(raw.keys()))
    norm = normalize_record(raw, mapping)
    assert norm["entity_name"] == "John A Smith"
    assert "Custom_Field" in norm
