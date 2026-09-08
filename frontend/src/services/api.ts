import {
  DashboardStats,
  Source,
  SourcePreview,
  Entity,
  EntityDetail,
  EvidenceGraphData,
  Conflict,
  CopilotResponse,
  AuditLog,
  SystemSettings
} from '../types';

const BASE_URL = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const errorBody = await res.text();
    let errorMsg = `Request failed (${res.status})`;
    try {
      const parsed = JSON.parse(errorBody);
      if (parsed.detail) errorMsg = parsed.detail;
    } catch {
      if (errorBody) errorMsg = errorBody;
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // Dashboard
  getDashboardStats: () => fetchJson<DashboardStats>(`${BASE_URL}/dashboard/stats`),

  // Sources
  getSources: () => fetchJson<Source[]>(`${BASE_URL}/sources`),
  uploadSource: async (file: File, name?: string, sourceType: string = 'CRM') => {
    const formData = new FormData();
    formData.append('file', file);
    if (name) formData.append('name', name);
    formData.append('source_type', sourceType);
    return fetchJson<Source>(`${BASE_URL}/sources/upload`, {
      method: 'POST',
      body: formData,
    });
  },
  getSourcePreview: (sourceId: number) => fetchJson<SourcePreview>(`${BASE_URL}/sources/${sourceId}/preview`),
  deleteSource: (sourceId: number) => fetchJson<{ status: string; message: string }>(`${BASE_URL}/sources/${sourceId}`, {
    method: 'DELETE',
  }),

  // Reconciliation
  runReconciliation: () => fetchJson<{ status: string; data: any }>(`${BASE_URL}/reconciliation/run`, {
    method: 'POST',
  }),
  getReconciliationStatus: () => fetchJson<any>(`${BASE_URL}/reconciliation/status`),
  loadDemoData: () => fetchJson<{ status: string; message: string; stats: any }>(`${BASE_URL}/reconciliation/load-demo`, {
    method: 'POST',
  }),

  // Entities
  getEntities: () => fetchJson<Entity[]>(`${BASE_URL}/entities`),
  getEntityDetail: (id: number) => fetchJson<EntityDetail>(`${BASE_URL}/entities/${id}`),
  getEntityGraph: (id: number) => fetchJson<EvidenceGraphData>(`${BASE_URL}/entities/${id}/graph`),

  // Evidence & Web Verify
  triggerWebVerify: (entityId: number, fieldName: string, contestedValues: string[] = []) =>
    fetchJson<{
      status: string;
      message: string;
      new_confidence: number;
      recommended_value: string;
      evidences: any[];
    }>(`${BASE_URL}/evidence/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity_id: entityId, field_name: fieldName, contested_values: contestedValues }),
    }),

  // Conflict Copilot
  queryCopilot: (conflictId: number, userPrompt: string = 'Why did you choose this value?') =>
    fetchJson<CopilotResponse>(`${BASE_URL}/copilot/investigate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conflict_id: conflictId, user_prompt: userPrompt }),
    }),

  // Human Review Queue
  getReviewQueue: () => fetchJson<Conflict[]>(`${BASE_URL}/review`),
  resolveReviewCase: (
    conflictId: number,
    payload: {
      selected_value: string;
      action: 'APPROVE' | 'REJECT' | 'CHOOSE' | 'REQUEST_EVIDENCE';
      reason?: string;
      reviewer?: string;
    }
  ) =>
    fetchJson<{ status: string; action: string; conflict_id: number; final_value?: string }>(
      `${BASE_URL}/review/${conflictId}/resolve`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    ),

  // Audit Ledger
  getAuditLogs: (entityId?: number, action?: string, limit: number = 100) => {
    const params = new URLSearchParams();
    if (entityId) params.append('entity_id', entityId.toString());
    if (action) params.append('action', action);
    params.append('limit', limit.toString());
    return fetchJson<AuditLog[]>(`${BASE_URL}/audit?${params.toString()}`);
  },

  // Settings
  getSettings: () => fetchJson<SystemSettings>(`${BASE_URL}/settings`),
  updateSettings: (settings: SystemSettings) =>
    fetchJson<SystemSettings>(`${BASE_URL}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    }),
};
