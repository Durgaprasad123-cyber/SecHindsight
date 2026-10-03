import {
  HealthData,
  AiProviderInfo,
  Incident,
  IncidentDetailResponse,
  HindsightMemory,
  MitreTechnique,
  ResponseAction,
  AuditLog,
  AnalyticsData,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const errJson = await res.json();
      if (errJson.detail) {
        errorDetail = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errorDetail);
  }
  return res.json() as Promise<T>;
}

export async function fetchHealth(): Promise<HealthData> {
  const res = await fetch(`${API_BASE_URL}/health`, { cache: 'no-store' });
  return handleResponse<HealthData>(res);
}

export async function fetchAiProvider(): Promise<AiProviderInfo> {
  const res = await fetch(`${API_BASE_URL}/ai/provider`, { cache: 'no-store' });
  return handleResponse<AiProviderInfo>(res);
}

export async function fetchIncidents(params?: {
  status?: string;
  severity?: string;
  category?: string;
  limit?: number;
}): Promise<{ incidents: Incident[]; count: number }> {
  const query = new URLSearchParams();
  if (params?.status) query.append("status", params.status);
  if (params?.severity) query.append("severity", params.severity);
  if (params?.category) query.append("category", params.category);
  if (params?.limit) query.append("limit", params.limit.toString());

  const res = await fetch(`${API_BASE_URL}/incidents?${query.toString()}`, { cache: 'no-store' });
  return handleResponse<{ incidents: Incident[]; count: number }>(res);
}

export async function fetchIncidentDetail(id: string): Promise<IncidentDetailResponse> {
  const res = await fetch(`${API_BASE_URL}/incidents/${id}`, { cache: 'no-store' });
  return handleResponse<IncidentDetailResponse>(res);
}

export async function createIncident(data: {
  title: string;
  description: string;
  category: string;
  severity: string;
  source_host?: string;
  user_account?: string;
  ip_address?: string;
}): Promise<{ id: string; title: string; status: string; message: string }> {
  const res = await fetch(`${API_BASE_URL}/incidents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<{ id: string; title: string; status: string; message: string }>(res);
}

export async function triggerInvestigation(id: string): Promise<{
  incident_id: string;
  status: string;
  results: Record<string, any>;
}> {
  const res = await fetch(`${API_BASE_URL}/incidents/${id}/investigate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse<{ incident_id: string; status: string; results: Record<string, any> }>(res);
}

export async function approveResponse(
  id: string,
  payload?: { reasoning?: string; action_id?: string; analyst_name?: string }
): Promise<{
  incident_id: string;
  decision: string;
  action_executed: Record<string, any>;
  message: string;
}> {
  const res = await fetch(`${API_BASE_URL}/incidents/${id}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      decision: "APPROVE",
      analyst_name: payload?.analyst_name || "SOC Lead Analyst",
      reasoning: payload?.reasoning || "Confirmed threat based on evidence delta & Hindsight memory influence.",
      action_id: payload?.action_id,
    }),
  });
  return handleResponse<{
    incident_id: string;
    decision: string;
    action_executed: Record<string, any>;
    message: string;
  }>(res);
}

export async function rejectResponse(
  id: string,
  reasoning?: string
): Promise<{ incident_id: string; status: string; message: string }> {
  const res = await fetch(`${API_BASE_URL}/incidents/${id}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      decision: "REJECT",
      analyst_name: "SOC Lead Analyst",
      reasoning: reasoning || "Analyst rejected automated response action.",
    }),
  });
  return handleResponse<{ incident_id: string; status: string; message: string }>(res);
}

export async function fetchMemories(
  category?: string,
  query?: string,
  limit: number = 50
): Promise<{ memories: HindsightMemory[]; count: number; bank_id?: string; query?: string }> {
  const params = new URLSearchParams();
  if (category) params.append("category", category);
  if (query) params.append("query", query);
  params.append("limit", limit.toString());

  const res = await fetch(`${API_BASE_URL}/memories?${params.toString()}`, { cache: 'no-store' });
  return handleResponse<{ memories: HindsightMemory[]; count: number; bank_id?: string; query?: string }>(res);
}

export async function retainMemoryApi(payload: {
  incident_id: string;
  category: string;
  evidence_summary: string;
  analyst_decision: string;
  response_taken: string;
  outcome: string;
  lesson_learned: string;
  tags?: string[];
}): Promise<{ status: string; retained_memory: Record<string, any> }> {
  const res = await fetch(`${API_BASE_URL}/memories/retain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<{ status: string; retained_memory: Record<string, any> }>(res);
}

export async function fetchThreats(): Promise<{ techniques: MitreTechnique[]; count: number }> {
  const res = await fetch(`${API_BASE_URL}/threats`, { cache: 'no-store' });
  return handleResponse<{ techniques: MitreTechnique[]; count: number }>(res);
}

export async function fetchResponses(params?: {
  status?: string;
  limit?: number;
}): Promise<{ responses: ResponseAction[]; count: number }> {
  const query = new URLSearchParams();
  if (params?.status) query.append("status", params.status);
  if (params?.limit) query.append("limit", params.limit.toString());

  const res = await fetch(`${API_BASE_URL}/responses?${query.toString()}`, { cache: 'no-store' });
  return handleResponse<{ responses: ResponseAction[]; count: number }>(res);
}

export async function fetchAuditLogs(params?: {
  limit?: number;
}): Promise<{ audit_logs: AuditLog[]; count: number }> {
  const query = new URLSearchParams();
  if (params?.limit) query.append("limit", params.limit.toString());

  const res = await fetch(`${API_BASE_URL}/responses/audit-logs?${query.toString()}`, { cache: 'no-store' });
  return handleResponse<{ audit_logs: AuditLog[]; count: number }>(res);
}

export async function fetchAnalytics(): Promise<AnalyticsData> {
  const res = await fetch(`${API_BASE_URL}/analytics`, { cache: 'no-store' });
  return handleResponse<AnalyticsData>(res);
}

export async function seedDemoData(): Promise<{
  status: string;
  message: string;
  master_demo_incidents: string[];
  synthetic_scenarios: string[];
}> {
  const res = await fetch(`${API_BASE_URL}/seed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse<{
    status: string;
    message: string;
    master_demo_incidents: string[];
    synthetic_scenarios: string[];
  }>(res);
}
