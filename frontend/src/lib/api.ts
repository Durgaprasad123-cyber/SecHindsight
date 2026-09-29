const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function fetchHealth() {
  const res = await fetch(`${API_BASE_URL}/health`, { cache: 'no-store' });
  if (!res.ok) throw new Error("Health check failed");
  return res.json();
}

export async function fetchIncidents(params?: { status?: string; severity?: string; category?: string; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.status) query.append("status", params.status);
  if (params?.severity) query.append("severity", params.severity);
  if (params?.category) query.append("category", params.category);

  const res = await fetch(`${API_BASE_URL}/incidents?${query.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error("Failed to fetch incidents");
  return res.json();
}

export async function fetchIncidentDetail(id: string) {
  const res = await fetch(`${API_BASE_URL}/incidents/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch incident ${id}`);
  return res.json();
}

export async function createIncident(data: {
  title: string;
  description: string;
  category: string;
  severity: string;
  source_host?: string;
  user_account?: string;
  ip_address?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/incidents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create incident");
  return res.json();
}

export async function triggerInvestigation(id: string) {
  const res = await fetch(`${API_BASE_URL}/incidents/${id}/investigate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to trigger investigation");
  return res.json();
}

export async function approveResponse(id: string, payload?: { reasoning?: string; action_id?: string }) {
  const res = await fetch(`${API_BASE_URL}/incidents/${id}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      decision: "APPROVE",
      analyst_name: "SOC Lead Analyst",
      reasoning: payload?.reasoning || "Analyst approved recommended response action based on Hindsight memory influence.",
      action_id: payload?.action_id
    }),
  });
  if (!res.ok) throw new Error("Failed to approve response");
  return res.json();
}

export async function rejectResponse(id: string, reasoning?: string) {
  const res = await fetch(`${API_BASE_URL}/incidents/${id}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      decision: "REJECT",
      analyst_name: "SOC Lead Analyst",
      reasoning: reasoning || "Analyst rejected automated action."
    }),
  });
  if (!res.ok) throw new Error("Failed to reject response");
  return res.json();
}

export async function fetchMemories(category?: string, query?: string) {
  const params = new URLSearchParams();
  if (category) params.append("category", category);
  if (query) params.append("query", query);

  const res = await fetch(`${API_BASE_URL}/memories?${params.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error("Failed to fetch memories");
  return res.json();
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
}) {
  const res = await fetch(`${API_BASE_URL}/memories/retain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to retain memory");
  return res.json();
}

export async function fetchThreats() {
  const res = await fetch(`${API_BASE_URL}/threats`, { cache: 'no-store' });
  if (!res.ok) throw new Error("Failed to fetch threat intel");
  return res.json();
}

export async function fetchResponses() {
  const res = await fetch(`${API_BASE_URL}/responses`, { cache: 'no-store' });
  if (!res.ok) throw new Error("Failed to fetch responses");
  return res.json();
}

export async function fetchAuditLogs() {
  const res = await fetch(`${API_BASE_URL}/responses/audit-logs`, { cache: 'no-store' });
  if (!res.ok) throw new Error("Failed to fetch audit logs");
  return res.json();
}

export async function fetchAnalytics() {
  const res = await fetch(`${API_BASE_URL}/analytics`, { cache: 'no-store' });
  if (!res.ok) throw new Error("Failed to fetch analytics");
  return res.json();
}

export async function seedDemoData() {
  const res = await fetch(`${API_BASE_URL}/seed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to seed demo data");
  return res.json();
}
