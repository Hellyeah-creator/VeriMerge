export interface Source {
  id: number;
  name: string;
  source_type: string;
  filename: string;
  total_records: number;
  total_columns: number;
  columns: string[];
  uploaded_at: string;
  status: string;
  error_message?: string;
}

export interface SourcePreview {
  source_id: number;
  name: string;
  source_type: string;
  total_records: number;
  columns: string[];
  sample_rows: Record<string, any>[];
  detected_mappings: Record<string, string>;
}

export interface RecordItem {
  id: number;
  source_id: number;
  source_name: string;
  external_record_id: string;
  raw_data: Record<string, any>;
  normalized_data: Record<string, any>;
  entity_id?: number;
  ingested_at: string;
}

export interface ConflictingValue {
  id: number;
  source_name: string;
  value: string;
  authority_score: number;
  is_selected: boolean;
  timestamp: string;
}

export interface Evidence {
  id: number;
  conflict_id?: number;
  entity_id: number;
  field_name: string;
  source_title: string;
  url_reference?: string;
  retrieved_at: string;
  value: string;
  authority: number;
  relevance: string;
  confidence: number;
  raw_snippet?: string;
}

export interface Conflict {
  id: number;
  entity_id: number;
  entity_name?: string;
  field_name: string;
  status: 'conflict' | 'auto_resolved' | 'human_reviewed' | 'blocked' | 'review_required';
  resolution_type: 'AUTO' | 'MANUAL' | 'UNRESOLVED' | 'BLOCKED';
  recommended_value?: string;
  final_value?: string;
  confidence: number;
  reasoning?: string;
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
  values: ConflictingValue[];
  evidence_items: Evidence[];
}

export interface TrustedField {
  id: number;
  field_name: string;
  value: string;
  confidence: number;
  resolution_state: string; // AUTO, REVIEW, BLOCK, REVIEW_APPROVED, MANUAL_CHOICE
  source_names: string[];
  reasoning?: string;
  decided_by: string;
  decided_at: string;
  is_latest: boolean;
}

export interface Entity {
  id: number;
  canonical_name: string;
  entity_type: string;
  match_confidence: number;
  matching_features: string[];
  status: 'auto_reconciled' | 'needs_review' | 'blocked';
  record_count: number;
  conflict_count: number;
  created_at: string;
  updated_at: string;
}

export interface EntityDetail extends Entity {
  records: RecordItem[];
  conflicts: Conflict[];
  trusted_fields: TrustedField[];
}

export interface AuditLog {
  id: number;
  event_id: string;
  entity_id?: number;
  field?: string;
  action: string;
  actor: string;
  timestamp: string;
  old_value?: string;
  new_value?: string;
  reason?: string;
  evidence_ids: string[];
}

export interface DashboardStats {
  total_records: number;
  unique_entities: number;
  total_conflicts: number;
  auto_resolved: number;
  needs_review: number;
  blocked: number;
  conflicts_by_source: { source: string; count: number }[];
  conflicts_by_field: { field: string; count: number }[];
  confidence_distribution: { range: string; count: number }[];
  reconciliation_status: { status: string; count: number; color: string }[];
  recent_activity: {
    id: number;
    event_id: string;
    action: string;
    actor: string;
    field?: string;
    timestamp: string;
    reason: string;
  }[];
}

export interface CopilotResponse {
  conflict_id: number;
  field_name: string;
  conflict_summary: string;
  sources_compared: string[];
  evidence_considered: {
    source_title: string;
    value: string;
    authority: number;
    relevance: string;
    confidence: number;
    snippet?: string;
  }[];
  recommended_value?: string;
  confidence: number;
  reasoning: string;
  next_action: string;
  is_ai_generated: boolean;
  provider_used: string;
}

export interface GraphNode {
  id: string;
  type: 'SOURCE' | 'RECORD' | 'ENTITY' | 'FIELD' | 'EVIDENCE' | 'AI_DECISION' | 'TRUSTED_RECORD';
  label: string;
  subtitle: string;
  status: string;
  data: Record<string, any>;
  x?: number;
  y?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface EvidenceGraphData {
  entity_id: number;
  canonical_name: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface SystemSettings {
  auto_resolve_threshold: number;
  human_review_threshold: number;
  entity_match_threshold: number;
  source_authorities: Record<string, number>;
}
