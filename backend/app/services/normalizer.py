import re
from typing import Dict, Any, Tuple

CANONICAL_FIELD_SYNONYMS: Dict[str, list[str]] = {
    "entity_name": [
        "name", "full_name", "fullname", "customer_name", "cust_name", 
        "client_name", "individual_name", "contact_name", "person_name", "entity_name"
    ],
    "email": [
        "email", "email_address", "mail", "e_mail", "contact_email", "primary_email"
    ],
    "phone": [
        "phone", "phone_number", "mobile", "mobile_number", "tel", "telephone", 
        "cell", "contact_no", "contact_number", "contact_phone"
    ],
    "address": [
        "address", "street_address", "addr", "location", "office_address", 
        "residence", "business_address", "registered_office"
    ],
    "company": [
        "company", "company_name", "org", "organization", "firm", "employer", 
        "business_name", "corporate_entity"
    ],
    "registration_id": [
        "registration_id", "registration_number", "reg_no", "cin", "tax_id", 
        "ssn", "gstin", "id_number", "gov_id", "entity_id", "reg_id"
    ],
    "director": [
        "director", "director_name", "managing_director", "board_member", 
        "officer", "principal", "executive"
    ],
    "bank_account": [
        "bank_account", "bank_details", "account_no", "account_number", 
        "iban", "bank_acc", "masked_account", "acc_no"
    ],
    "date_of_birth": [
        "date_of_birth", "dob", "birthdate", "birth_date"
    ]
}

def detect_canonical_mapping(columns: list[str]) -> Dict[str, str]:
    """
    Maps original source column headers to canonical field names.
    Returns: Dict[original_column, canonical_field]
    """
    mapping: Dict[str, str] = {}
    for col in columns:
        cleaned = re.sub(r"[^a-zA-Z0-9_]", "_", col.strip().lower())
        matched = False
        for canonical, synonyms in CANONICAL_FIELD_SYNONYMS.items():
            if cleaned in synonyms or any(s in cleaned for s in synonyms):
                mapping[col] = canonical
                matched = True
                break
        if not matched:
            mapping[col] = col
    return mapping

def clean_phone_number(val: Any) -> str:
    if not val:
        return ""
    s = str(val).strip()
    digits_only = re.sub(r"[^\d+]", "", s)
    return digits_only

def clean_address_string(val: Any) -> Tuple[str, str]:
    """
    Returns (display_value, normalized_for_match)
    Normalizes common abbreviations: Rd -> Road, St -> Street, Ave -> Avenue, etc.
    """
    if not val:
        return ("", "")
    display = str(val).strip()
    norm = display.lower()
    norm = re.sub(r"\bm\.?g\.?\b", "mg", norm)
    norm = re.sub(r"\brd\.?\b", "road", norm)
    norm = re.sub(r"\bst\.?\b", "street", norm)
    norm = re.sub(r"\bave\.?\b", "avenue", norm)
    norm = re.sub(r"[^\w\s]", " ", norm)
    norm = re.sub(r"\s+", " ", norm).strip()
    return (display, norm)

def clean_name_string(val: Any) -> Tuple[str, str]:
    """
    Returns (display_name, normalized_name)
    """
    if not val:
        return ("", "")
    display = str(val).strip()
    norm = display.lower()
    norm = re.sub(r"\b(mr|mrs|ms|dr|prof)\.?\b", "", norm)
    norm = re.sub(r"[^\w\s]", " ", norm)
    norm = re.sub(r"\s+", " ", norm).strip()
    return (display, norm)

def normalize_record(raw_dict: Dict[str, Any], mapping: Dict[str, str]) -> Dict[str, Any]:
    """
    Converts raw record dictionary into canonical schema dictionary
    without discarding unmapped fields.
    """
    normalized: Dict[str, Any] = {}
    for raw_key, raw_value in raw_dict.items():
        canonical_key = mapping.get(raw_key, raw_key)
        val_str = str(raw_value).strip() if raw_value is not None else ""
        
        if canonical_key == "phone":
            normalized["phone"] = clean_phone_number(val_str)
            normalized["phone_raw"] = val_str
        elif canonical_key == "address":
            disp, norm = clean_address_string(val_str)
            normalized["address"] = disp
            normalized["address_norm"] = norm
        elif canonical_key == "entity_name":
            disp, norm = clean_name_string(val_str)
            normalized["entity_name"] = disp
            normalized["entity_name_norm"] = norm
        else:
            normalized[canonical_key] = val_str

    return normalized
