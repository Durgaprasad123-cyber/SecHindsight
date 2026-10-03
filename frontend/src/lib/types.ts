export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export type IncidentStatus = 
  | "NEW" 
  | "TRIAGING" 
  | "INVESTIGATING" 
  | "THREAT_ANALYSIS" 
  | "RESPONSE_RECOMMENDED" 
  | "AWAITING_APPROVAL" 
  | "CONTAINED" 
  | "REJECTED" 
  | "CLOSED" 
  | "FAILED";

export interface IncidentEvidence {
  id: string;
  incident_id: string;
  evidence_type: string;
  description: string;
  raw_data?: Record<string, any>;
  created_at?: string;
}

export interface AgentRun {
  id: string;
  incident_id: string;
  agent_name: "triage" | "investigation" | "threat" | "response";
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  input_summary?: string;
  output_json?: Record<string, any>;
  execution_time_ms: number;
  error?: string;
  started_at?: string;
  completed_at?: string;
}

export interface AnalystDecision {
  id: string;
  incident_id: string;
  decision: "APPROVE" | "REJECT";
  analyst_name: string;
  reasoning?: string;
  created_at?: string;
}

export interface ResponseAction {
  id: string;
  incident_id: string;
  action_type: "ISOLATE_ENDPOINT" | "BLOCK_IP" | "DISABLE_ACCOUNT" | "REVOKE_SESSION" | "QUARANTINE_FILE" | string;
  target: string;
  reason: string;
  risk_level: "low" | "medium" | "high" | "critical";
  status: "PENDING_APPROVAL" | "APPROVED" | "EXECUTED" | "REJECTED" | "FAILED";
  approved_by?: string;
  execution_details?: Record<string, any>;
  executed_at?: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: IncidentSeverity;
  confidence: number;
  status: IncidentStatus;
  source_host?: string;
  user_account?: string;
  ip_address?: string;
  demo_scenario_step?: number;
  created_at?: string;
  updated_at?: string;
}

export interface IncidentDetailResponse {
  incident: Incident;
  evidence: IncidentEvidence[];
  agent_runs: AgentRun[];
  decisions: AnalystDecision[];
  responses: ResponseAction[];
}

export interface HindsightMemory {
  id: string;
  incident_id: string;
  bank_id?: string;
  category: string;
  evidence_summary: string;
  analyst_decision: string;
  response_taken: string;
  outcome: string;
  lesson_learned: string;
  tags?: string[];
  similarity_score?: number;
  retained_at?: string;
}

export interface MitreTechnique {
  id: string;
  name: string;
  tactic: string;
  description: string;
  detection: string;
  mitigation: string;
}

export interface AuditLog {
  id: string;
  incident_id?: string;
  actor: string;
  action: string;
  details: string;
  timestamp?: string;
}

export interface AnalyticsMetrics {
  total_incidents: number;
  contained_incidents: number;
  awaiting_approval: number;
  retained_memories: number;
  response_actions_executed: number;
  avg_agent_latency_ms: number;
  false_positive_reduction_rate: string;
  memory_influence_accuracy: string;
}

export interface AnalyticsData {
  metrics: AnalyticsMetrics;
  severity_breakdown: Array<{ name: string; value: number; color: string }>;
  category_breakdown: Array<{ category: string; count: number }>;
  status_breakdown: Record<string, number>;
}

export interface HealthData {
  status: string;
  system: string;
  version: string;
  ai_provider: {
    active_provider: string;
    active_model: string;
    configured: boolean;
  };
  integrations: {
    groq_llm: { status: string; model: string; configured: boolean };
    gemini_llm: { status: string; model: string; configured: boolean };
    hindsight_memory: { status: string; bank_id: string; configured: boolean };
    database: { status: string; url_type: string; supabase_configured: boolean };
  };
}

export interface AiProviderInfo {
  provider: string;
  model: string;
  configured: boolean;
  supported_providers: string[];
  active_provider_setting: string;
}
