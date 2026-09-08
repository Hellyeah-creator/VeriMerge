import {
  DashboardStats,
  Source,
  Entity,
  EntityDetail,
  Conflict,
  AuditLog,
  EvidenceGraphData,
  SystemSettings
} from '../types';

export const mockDashboardStats: DashboardStats = {
  total_records: 10,
  unique_entities: 3,
  total_conflicts: 18,
  auto_resolved: 9,
  needs_review: 9,
  blocked: 4,
  conflicts_by_source: [
    { source: "Global ERP Database", count: 18 },
    { source: "Enterprise CRM", count: 15 },
    { source: "Customer Onboarding", count: 10 },
    { source: "Public Web Evidence", count: 10 }
  ],
  conflicts_by_field: [
    { field: "company_name", count: 4 },
    { field: "address", count: 4 },
    { field: "phone", count: 3 },
    { field: "bank_account", count: 3 },
    { field: "registration_id", count: 2 },
    { field: "industry", count: 2 }
  ],
  confidence_distribution: [
    { range: "95-100% (High Auto)", count: 3 },
    { range: "90-94% (Auto)", count: 6 },
    { range: "70-89% (Review)", count: 5 },
    { range: "50-69% (Blocked)", count: 4 },
    { range: "< 50% (High Risk)", count: 0 }
  ],
  reconciliation_status: [
    { status: "Auto-Resolved", count: 9, color: "#10B981" },
    { status: "Needs Review", count: 9, color: "#F59E0B" },
    { status: "Blocked", count: 4, color: "#EF4444" }
  ],
  recent_activity: [
    {
      id: 86,
      event_id: "EVT-6E46F98BDC5B",
      action: "AI_RECOMMENDATION",
      actor: "AI_COPILOT",
      field: "registration_id",
      timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      reason: "Recommended 'TAX-7729104' (75.2% confidence). Routed to /review queue for human approval."
    },
    {
      id: 85,
      event_id: "EVT-61644C406E45",
      action: "FIELD_EVALUATED",
      actor: "CONFLICT_ENGINE",
      field: "registration_id",
      timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
      reason: "Assessed 2 values across 2 sources. Status: REVIEW (75.2%)"
    },
    {
      id: 84,
      event_id: "EVT-3E60A4541265",
      action: "RECONCILIATION_BLOCKED",
      actor: "ZERO_TRUST_GATEWAY",
      field: "company",
      timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
      reason: "Confidence 65.2% falls below zero-trust threshold (<70%). Blocked from automated resolution."
    },
    {
      id: 82,
      event_id: "EVT-C01299804063",
      action: "RECONCILIATION_BLOCKED",
      actor: "ZERO_TRUST_GATEWAY",
      field: "bank_account",
      timestamp: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
      reason: "Confidence 58.0% falls below zero-trust threshold (<70%). Blocked from automated resolution."
    },
    {
      id: 80,
      event_id: "EVT-9E46ABBA4D10",
      action: "TRUSTED_VALUE_CREATED",
      actor: "AI_RECONCILER",
      field: "phone",
      timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      reason: "Value '+12125553421' supported by Global ERP and verified by Official Phone Registry (91.0% confidence)."
    }
  ]
};

export const mockSources: Source[] = [
  {
    id: 1,
    name: "Enterprise CRM",
    source_type: "CRM",
    filename: "CRM.csv",
    total_records: 3,
    total_columns: 7,
    columns: ["id", "company", "address", "phone", "email", "bank_account", "registration_id"],
    uploaded_at: new Date(Date.now() - 1000 * 3600 * 4).toISOString(),
    status: "processed"
  },
  {
    id: 2,
    name: "Global ERP Database",
    source_type: "ERP",
    filename: "ERP.csv",
    total_records: 3,
    total_columns: 7,
    columns: ["erp_id", "entity_name", "hq_address", "contact_number", "tax_number", "iban", "sector"],
    uploaded_at: new Date(Date.now() - 1000 * 3600 * 3).toISOString(),
    status: "processed"
  },
  {
    id: 3,
    name: "Customer Onboarding",
    source_type: "EXCEL",
    filename: "Customers.xlsx",
    total_records: 2,
    total_columns: 6,
    columns: ["customer_id", "org_name", "registered_office", "support_phone", "company_tax_id", "status"],
    uploaded_at: new Date(Date.now() - 1000 * 3600 * 2).toISOString(),
    status: "processed"
  },
  {
    id: 4,
    name: "Public Web Evidence",
    source_type: "WEB/API",
    filename: "WebEvidence.json",
    total_records: 2,
    total_columns: 5,
    columns: ["source", "entity", "verified_address", "phone_verified", "trust_rating"],
    uploaded_at: new Date(Date.now() - 1000 * 3600 * 1).toISOString(),
    status: "processed"
  }
];

export const mockEntities: Entity[] = [
  {
    id: 1,
    canonical_name: "TechCorp Solutions Inc.",
    entity_type: "ORGANIZATION",
    match_confidence: 96.4,
    matching_features: ["tax_id: TAX-883921", "domain: techcorp.io", "fuzzy_name: 94%"],
    status: "auto_reconciled",
    record_count: 4,
    conflict_count: 6,
    created_at: new Date(Date.now() - 1000 * 3600 * 2).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    canonical_name: "Apex Innovations LLC",
    entity_type: "ORGANIZATION",
    match_confidence: 84.1,
    matching_features: ["fuzzy_name: 88%", "phone: +14155558912"],
    status: "needs_review",
    record_count: 3,
    conflict_count: 5,
    created_at: new Date(Date.now() - 1000 * 3600 * 2).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    canonical_name: "Global Maritime Logistics Co.",
    entity_type: "ORGANIZATION",
    match_confidence: 62.8,
    matching_features: ["fuzzy_name: 65%"],
    status: "blocked",
    record_count: 3,
    conflict_count: 7,
    created_at: new Date(Date.now() - 1000 * 3600 * 2).toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const mockEntityDetail: EntityDetail = {
  ...mockEntities[0],
  records: [
    {
      id: 101,
      source_id: 1,
      source_name: "Enterprise CRM",
      external_record_id: "CRM-9021",
      raw_data: {
        company: "TechCorp Solutions Inc",
        address: "500 Howard St, Ste 400, San Francisco, CA 94105",
        phone: "+1 (415) 555-0199",
        email: "contact@techcorp.io",
        bank_account: "US98CHAS0023491028"
      },
      normalized_data: {
        canonical_name: "TechCorp Solutions Inc.",
        address: "500 Howard St, Ste 400, San Francisco, CA 94105",
        phone: "+14155550199",
        email: "contact@techcorp.io"
      },
      ingested_at: new Date(Date.now() - 1000 * 3600 * 3).toISOString()
    },
    {
      id: 102,
      source_id: 2,
      source_name: "Global ERP Database",
      external_record_id: "ERP-4820",
      raw_data: {
        entity_name: "TechCorp Solutions, Inc.",
        hq_address: "500 Howard Street, Suite 400, SF, CA",
        contact_number: "+14155550199",
        tax_number: "TAX-883921",
        iban: "US98CHAS0023491028"
      },
      normalized_data: {
        canonical_name: "TechCorp Solutions Inc.",
        address: "500 Howard St, Ste 400, San Francisco, CA 94105",
        phone: "+14155550199",
        registration_id: "TAX-883921"
      },
      ingested_at: new Date(Date.now() - 1000 * 3600 * 3).toISOString()
    }
  ],
  conflicts: [
    {
      id: 201,
      entity_id: 1,
      entity_name: "TechCorp Solutions Inc.",
      field_name: "address",
      status: "auto_resolved",
      resolution_type: "AUTO",
      recommended_value: "500 Howard St, Ste 400, San Francisco, CA 94105",
      final_value: "500 Howard St, Ste 400, San Francisco, CA 94105",
      confidence: 94.5,
      reasoning: "High agreement between CRM and ERP, corroborated by USPS Postal Address Database API.",
      created_at: new Date(Date.now() - 1000 * 3600).toISOString(),
      resolved_at: new Date().toISOString(),
      resolved_by: "ZERO_TRUST_ENGINE",
      values: [
        { id: 1, source_name: "Enterprise CRM", value: "500 Howard St, Ste 400, San Francisco, CA 94105", authority_score: 85, is_selected: true, timestamp: "2026-09-08T01:00:00Z" },
        { id: 2, source_name: "Global ERP Database", value: "500 Howard Street, Suite 400, SF, CA", authority_score: 90, is_selected: false, timestamp: "2026-09-08T01:10:00Z" }
      ],
      evidence_items: [
        {
          id: 501,
          entity_id: 1,
          field_name: "address",
          source_title: "USPS Address Validation Service",
          url_reference: "https://tools.usps.com/zip-code-lookup",
          retrieved_at: new Date().toISOString(),
          value: "500 Howard St, Ste 400, San Francisco, CA 94105",
          authority: 98,
          relevance: "EXACT_MATCH",
          confidence: 96.0
        }
      ]
    },
    {
      id: 202,
      entity_id: 1,
      entity_name: "TechCorp Solutions Inc.",
      field_name: "phone",
      status: "auto_resolved",
      resolution_type: "AUTO",
      recommended_value: "+1 (415) 555-0199",
      final_value: "+1 (415) 555-0199",
      confidence: 92.0,
      reasoning: "Validated via Telco E.164 verification standard across CRM and ERP.",
      created_at: new Date(Date.now() - 1000 * 3600).toISOString(),
      resolved_at: new Date().toISOString(),
      resolved_by: "ZERO_TRUST_ENGINE",
      values: [
        { id: 3, source_name: "Enterprise CRM", value: "+1 (415) 555-0199", authority_score: 85, is_selected: true, timestamp: "2026-09-08T01:00:00Z" },
        { id: 4, source_name: "Global ERP Database", value: "+14155550199", authority_score: 90, is_selected: false, timestamp: "2026-09-08T01:10:00Z" }
      ],
      evidence_items: []
    }
  ],
  trusted_fields: [
    {
      id: 301,
      field_name: "company_name",
      value: "TechCorp Solutions Inc.",
      confidence: 97.2,
      resolution_state: "AUTO",
      source_names: ["Global ERP Database", "Enterprise CRM"],
      reasoning: "Normalized legal entity designation matches Delaware Division of Corporations Registry.",
      decided_by: "ZERO_TRUST_ENGINE",
      decided_at: new Date().toISOString(),
      is_latest: true
    },
    {
      id: 302,
      field_name: "address",
      value: "500 Howard St, Ste 400, San Francisco, CA 94105",
      confidence: 94.5,
      resolution_state: "AUTO",
      source_names: ["Enterprise CRM", "Global ERP Database"],
      reasoning: "Standardized to USPS CASS format.",
      decided_by: "ZERO_TRUST_ENGINE",
      decided_at: new Date().toISOString(),
      is_latest: true
    },
    {
      id: 303,
      field_name: "registration_id",
      value: "TAX-883921",
      confidence: 99.0,
      resolution_state: "AUTO",
      source_names: ["Global ERP Database"],
      reasoning: "Exact federal employer identification match.",
      decided_by: "ZERO_TRUST_ENGINE",
      decided_at: new Date().toISOString(),
      is_latest: true
    }
  ]
};

export const mockReviewConflicts: Conflict[] = [
  {
    id: 401,
    entity_id: 2,
    entity_name: "Apex Innovations LLC",
    field_name: "registration_id",
    status: "review_required",
    resolution_type: "UNRESOLVED",
    recommended_value: "TAX-7729104",
    confidence: 75.2,
    reasoning: "ERP lists TAX-7729104 while Customer Onboarding provides TAX-7729199. AI recommendation favors ERP due to higher authority score (90 vs 75).",
    created_at: new Date(Date.now() - 1000 * 1800).toISOString(),
    values: [
      { id: 11, source_name: "Global ERP Database", value: "TAX-7729104", authority_score: 90, is_selected: false, timestamp: "2026-09-08T02:00:00Z" },
      { id: 12, source_name: "Customer Onboarding", value: "TAX-7729199", authority_score: 75, is_selected: false, timestamp: "2026-09-08T02:15:00Z" }
    ],
    evidence_items: [
      {
        id: 601,
        entity_id: 2,
        field_name: "registration_id",
        source_title: "California Secretary of State Business Search",
        retrieved_at: new Date().toISOString(),
        value: "TAX-7729104",
        authority: 95,
        relevance: "OFFICIAL_REGISTRY",
        confidence: 88.0
      }
    ]
  },
  {
    id: 402,
    entity_id: 3,
    entity_name: "Global Maritime Logistics Co.",
    field_name: "bank_account",
    status: "blocked",
    resolution_type: "BLOCKED",
    recommended_value: undefined,
    confidence: 58.0,
    reasoning: "Severe discrepancy in bank account numbers across CRM and ERP. Below 70% threshold. Automated merge blocked under Zero-Trust policy.",
    created_at: new Date(Date.now() - 1000 * 2400).toISOString(),
    values: [
      { id: 21, source_name: "Enterprise CRM", value: "US22WF0098124019", authority_score: 85, is_selected: false, timestamp: "2026-09-08T02:00:00Z" },
      { id: 22, source_name: "Global ERP Database", value: "US99CHAS00441920", authority_score: 90, is_selected: false, timestamp: "2026-09-08T02:05:00Z" }
    ],
    evidence_items: []
  }
];

export const mockAuditLogs: AuditLog[] = [
  {
    id: 86,
    event_id: "EVT-6E46F98BDC5B",
    entity_id: 2,
    field: "registration_id",
    action: "AI_RECOMMENDATION",
    actor: "AI_COPILOT",
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    new_value: "TAX-7729104",
    reason: "Recommended 'TAX-7729104' (75.2% confidence). Routed to /review queue for human approval.",
    evidence_ids: ["California Secretary of State Business Search"]
  },
  {
    id: 85,
    event_id: "EVT-61644C406E45",
    entity_id: 2,
    field: "registration_id",
    action: "FIELD_EVALUATED",
    actor: "CONFLICT_ENGINE",
    timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    reason: "Assessed 2 values across 2 sources. Status: REVIEW (75.2%)",
    evidence_ids: []
  },
  {
    id: 84,
    event_id: "EVT-3E60A4541265",
    entity_id: 3,
    field: "company",
    action: "RECONCILIATION_BLOCKED",
    actor: "ZERO_TRUST_GATEWAY",
    timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    reason: "Confidence 65.2% falls below zero-trust threshold (<70%). Blocked from automated resolution.",
    evidence_ids: []
  },
  {
    id: 80,
    event_id: "EVT-9E46ABBA4D10",
    entity_id: 1,
    field: "phone",
    action: "TRUSTED_VALUE_CREATED",
    actor: "AI_RECONCILER",
    timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    new_value: "+1 (415) 555-0199",
    reason: "Value '+1 (415) 555-0199' supported by Global ERP and verified by Official Phone Registry (91.0% confidence).",
    evidence_ids: ["E.164 Standard", "Telco Registry"]
  }
];

export const mockEvidenceGraph: EvidenceGraphData = {
  entity_id: 1,
  canonical_name: "TechCorp Solutions Inc.",
  nodes: [
    { id: "src-1", type: "SOURCE", label: "Enterprise CRM", subtitle: "Weight: 85", status: "active", data: {} },
    { id: "src-2", type: "SOURCE", label: "Global ERP", subtitle: "Weight: 90", status: "active", data: {} },
    { id: "rec-1", type: "RECORD", label: "CRM-9021", subtitle: "Ingested", status: "active", data: {} },
    { id: "rec-2", type: "RECORD", label: "ERP-4820", subtitle: "Ingested", status: "active", data: {} },
    { id: "ent-1", type: "ENTITY", label: "TechCorp Solutions Inc.", subtitle: "Match: 96.4%", status: "active", data: {} },
    { id: "fld-1", type: "FIELD", label: "Address Conflict", subtitle: "2 competing values", status: "resolved", data: {} },
    { id: "evi-1", type: "EVIDENCE", label: "USPS CASS Service", subtitle: "Score: 98%", status: "verified", data: {} },
    { id: "dec-1", type: "AI_DECISION", label: "Auto-Resolved", subtitle: "Conf: 94.5%", status: "approved", data: {} },
    { id: "gold-1", type: "TRUSTED_RECORD", label: "Golden Record", subtitle: "Zero Overwrite Verified", status: "golden", data: {} }
  ],
  edges: [
    { id: "e1", source: "src-1", target: "rec-1" },
    { id: "e2", source: "src-2", target: "rec-2" },
    { id: "e3", source: "rec-1", target: "ent-1" },
    { id: "e4", source: "rec-2", target: "ent-1" },
    { id: "e5", source: "ent-1", target: "fld-1" },
    { id: "e6", source: "evi-1", target: "fld-1" },
    { id: "e7", source: "fld-1", target: "dec-1" },
    { id: "e8", source: "dec-1", target: "gold-1" }
  ]
};

export const mockSettings: SystemSettings = {
  auto_resolve_threshold: 90,
  human_review_threshold: 70,
  entity_match_threshold: 80,
  source_authorities: {
    "Global ERP Database": 95,
    "Enterprise CRM": 85,
    "Customer Onboarding": 75,
    "Public Web Evidence": 70
  }
};
