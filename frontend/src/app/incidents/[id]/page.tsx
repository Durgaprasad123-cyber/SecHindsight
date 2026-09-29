"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { 
  AlertTriangle, 
  Brain, 
  ShieldCheck, 
  Zap, 
  Play, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  Activity, 
  Lock, 
  Cpu, 
  FileText,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Radio,
  Server
} from "lucide-react";
import { 
  fetchIncidentDetail, 
  triggerInvestigation, 
  approveResponse, 
  rejectResponse 
} from "@/lib/api";

export default function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const loadDetail = async () => {
    try {
      const res = await fetchIncidentDetail(id);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [id]);

  const handleRunInvestigation = async () => {
    setIsInvestigating(true);
    try {
      await triggerInvestigation(id);
      await loadDetail();
    } catch (e) {
      console.error(e);
      alert("Error executing investigation pipeline.");
    } finally {
      setIsInvestigating(false);
    }
  };

  const handleApprove = async (actionId?: string) => {
    setIsApproving(true);
    try {
      await approveResponse(id, { action_id: actionId });
      await loadDetail();
    } catch (e) {
      console.error(e);
      alert("Error approving response.");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    try {
      await rejectResponse(id);
      await loadDetail();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Activity className="w-8 h-8 text-[#8A9A65] animate-spin" />
        <p className="text-xs font-mono text-[#62685E]">Loading Incident Telemetry & Agent State...</p>
      </div>
    );
  }

  if (!data || !data.incident) {
    return (
      <div className="glass-panel p-8 rounded-2xl text-center space-y-4 bg-white/80">
        <AlertTriangle className="w-12 h-12 text-amber-600 mx-auto" />
        <h2 className="text-xl font-bold text-[#1D211C]">Incident Not Found</h2>
        <Link href="/incidents" className="text-xs text-[#8A9A65] underline font-semibold">Return to Incidents Queue</Link>
      </div>
    );
  }

  const { incident, evidence, agent_runs, responses, decisions } = data;

  const triageRun = agent_runs?.find((r: any) => r.agent_name === "triage");
  const triageOut = triageRun?.output_json;

  const invRun = agent_runs?.find((r: any) => r.agent_name === "investigation");
  const invOut = invRun?.output_json?.investigation;
  const recalledMemories = invRun?.output_json?.recalled_memories || [];

  const threatRun = agent_runs?.find((r: any) => r.agent_name === "threat");
  const threatOut = threatRun?.output_json;

  const respRun = agent_runs?.find((r: any) => r.agent_name === "response");
  const respOut = respRun?.output_json;

  const pendingAction = responses?.find((r: any) => r.status === "PENDING_APPROVAL") || respOut?.recommended_actions?.[0];
  const executedAction = responses?.find((r: any) => r.status === "EXECUTED");
  const isContained = incident.status === "CONTAINED" || executedAction;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      
      {/* Back link & Header */}
      <div className="flex items-center justify-between">
        <Link href="/incidents" className="text-xs text-[#62685E] hover:text-[#1D211C] flex items-center gap-1.5 font-medium transition-colors">
          <ArrowLeft className="w-3.5 h-3.5 text-[#8A9A65]" /> Back to Incident Queue
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#62685E] font-mono">Status:</span>
          <span className={`px-3 py-1 rounded-md text-xs font-mono font-bold uppercase tracking-wider ${
            isContained ? "bg-emerald-100 text-emerald-800 border border-emerald-300" :
            incident.status === "AWAITING_APPROVAL" ? "bg-amber-100 text-amber-900 border border-amber-300" :
            "bg-[#E0E7D7] text-[#1D211C] border border-[#B7C396]"
          }`}>
            {incident.status}
          </span>
        </div>
      </div>

      {/* Hero Incident Header Panel */}
      <div className="glass-panel p-6 rounded-2xl border-[rgba(40,50,35,0.10)] space-y-4 bg-white/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-[#8A9A65] font-bold text-sm">{incident.id}</span>
              <span className={`px-2.5 py-0.5 rounded font-semibold uppercase ${
                incident.severity === "critical" ? "bg-rose-100 text-rose-800" :
                incident.severity === "high" ? "bg-amber-100 text-amber-900" :
                "bg-blue-100 text-blue-900"
              }`}>
                {incident.severity} Severity
              </span>
              <span className="px-2.5 py-0.5 rounded bg-[#E0E7D7] text-[#1D211C]">
                Confidence: {Math.round(incident.confidence * 100)}%
              </span>
            </div>

            <h1 className="text-xl md:text-2xl font-bold text-[#1D211C] tracking-tight">
              {incident.title}
            </h1>
          </div>

          {!isContained && (
            <button
              onClick={handleRunInvestigation}
              disabled={isInvestigating}
              className="px-4 py-2.5 rounded-xl bg-[#8A9A65] text-white font-bold text-xs shadow-xs hover:bg-[#788855] transition-all flex items-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
            >
              {isInvestigating ? (
                <Activity className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Cpu className="w-4 h-4 text-white fill-white" />
              )}
              <span>{isInvestigating ? "Running AI Agents..." : "Run Multi-Agent Investigation"}</span>
            </button>
          )}
        </div>

        {/* Technical Telemetry Metadata */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[rgba(40,50,35,0.08)] text-xs font-mono">
          <div className="bg-white/90 p-2.5 rounded-xl border border-[rgba(40,50,35,0.08)]">
            <span className="text-[#62685E] text-[10px] block uppercase">Target Host:</span>
            <span className="text-[#1D211C] font-bold">{incident.source_host || "N/A"}</span>
          </div>
          <div className="bg-white/90 p-2.5 rounded-xl border border-[rgba(40,50,35,0.08)]">
            <span className="text-[#62685E] text-[10px] block uppercase">User Account:</span>
            <span className="text-[#1D211C] font-bold">{incident.user_account || "N/A"}</span>
          </div>
          <div className="bg-white/90 p-2.5 rounded-xl border border-[rgba(40,50,35,0.08)]">
            <span className="text-[#62685E] text-[10px] block uppercase">IP Address:</span>
            <span className="text-[#1D211C] font-bold">{incident.ip_address || "N/A"}</span>
          </div>
          <div className="bg-white/90 p-2.5 rounded-xl border border-[rgba(40,50,35,0.08)]">
            <span className="text-[#62685E] text-[10px] block uppercase">Endpoint State:</span>
            <span className={`font-bold ${isContained ? "text-rose-700" : "text-emerald-700"}`}>
              {isContained ? "ISOLATED" : "ONLINE"}
            </span>
          </div>
        </div>

        <p className="text-xs text-[#1D211C] leading-relaxed bg-white/50 p-3 rounded-xl border border-[rgba(40,50,35,0.08)]">
          {incident.description}
        </p>
      </div>

      {/* 2-Column Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column (8 cols): Triage, Hindsight Recall, MITRE */}
        <div className="lg:col-span-8 space-y-6">

          {/* 1. TRIAGE AGENT OUTPUT */}
          {triageOut && (
            <div className="glass-panel p-5 rounded-2xl border-[rgba(40,50,35,0.10)] space-y-3 bg-white/80">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#1D211C] flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#8A9A65]" /> Triage Agent Findings
                </h3>
                <span className="text-[11px] font-mono text-[#62685E]">{triageRun?.execution_time_ms}ms</span>
              </div>
              <p className="text-xs text-[#1D211C] leading-relaxed">
                {triageOut.reasoning || triageOut.initial_assessment}
              </p>
            </div>
          )}

          {/* 2. HINDSIGHT ORGANIZATIONAL MEMORY RECALL PANEL */}
          <div className="glass-panel p-5 rounded-2xl border-[rgba(40,50,35,0.12)] space-y-4 bg-white/80">
            <div className="flex items-center justify-between border-b border-[rgba(40,50,35,0.08)] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#1D211C] flex items-center gap-2">
                  <Brain className="w-5 h-5 text-[#8A9A65]" /> Hindsight Organizational Memory Recall
                </h3>
                <p className="text-xs text-[#62685E]">Recalled experiences from Hindsight bank <span className="font-mono text-[#1D211C]">sechindsight</span></p>
              </div>
              <span className="px-2.5 py-1 rounded bg-[#E0E7D7] text-[#1D211C] text-xs font-mono font-bold">
                {recalledMemories.length} Memories Recalled
              </span>
            </div>

            {recalledMemories.length === 0 ? (
              <div className="p-6 text-center text-[#62685E] text-xs bg-white/50 rounded-xl border border-dashed border-[rgba(40,50,35,0.12)] font-mono">
                Click "Run Multi-Agent Investigation" above to recall Hindsight memories.
              </div>
            ) : (
              <div className="space-y-3">
                {recalledMemories.map((mem: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl bg-white border border-[rgba(40,50,35,0.10)] space-y-2 shadow-xs">
                    <div className="flex items-center justify-between border-b border-[rgba(40,50,35,0.06)] pb-1.5">
                      <span className="font-mono text-xs font-bold text-[#1D211C]">Source: {mem.incident_id}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E0E7D7] text-[#1D211C]">
                        {mem.outcome}
                      </span>
                    </div>

                    <p className="text-xs text-[#62685E]">
                      <strong>Past Evidence:</strong> {mem.evidence_summary}
                    </p>
                    
                    <div className="p-2.5 rounded-lg bg-[#E0E7D7]/40 text-xs text-[#1D211C]">
                      <strong className="font-semibold">Lesson Learned:</strong> "{mem.lesson_learned}"
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* AI MEMORY INFLUENCE REASONING */}
            {invOut && (
              <div className="p-4 rounded-xl bg-[#E0E7D7]/40 border border-[#B7C396]/60 space-y-2">
                <div className="flex items-center gap-2 text-[#1D211C] font-bold text-xs font-mono uppercase">
                  <Sparkles className="w-4 h-4 text-[#8A9A65]" /> Analytical Memory Influence Summary:
                </div>
                <p className="text-xs text-[#1D211C] leading-relaxed">
                  {invOut.memory_influence_summary || "Hindsight memory recalled past corporate VPN incidents. The copilot identified that while login alone is benign, privilege escalation strongly correlates with confirmed compromise."}
                </p>
              </div>
            )}
          </div>

          {/* 3. MITRE ATT&CK THREAT MATRIX */}
          {threatOut && (
            <div className="glass-panel p-5 rounded-2xl border-[rgba(40,50,35,0.12)] space-y-4 bg-white/80">
              <h3 className="text-base font-bold text-[#1D211C] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-rose-700" /> MITRE ATT&CK Threat Mapping
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(threatOut.mitre_techniques || []).map((tech: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-white border border-[rgba(40,50,35,0.10)] space-y-1 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-rose-800">{tech.id}</span>
                      <span className="text-[10px] font-mono text-[#62685E] bg-gray-100 px-2 py-0.5 rounded">{tech.tactic}</span>
                    </div>
                    <div className="text-xs font-semibold text-[#1D211C]">{tech.name}</div>
                    <p className="text-[11px] text-[#62685E] leading-snug">{tech.reasoning}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column (4 cols): Response Recommendation & Human Controls */}
        <div className="lg:col-span-4 space-y-6">

          <div className="glass-panel p-5 rounded-2xl border-[rgba(40,50,35,0.12)] space-y-4 bg-white/80 sticky top-20">
            <div className="border-b border-[rgba(40,50,35,0.08)] pb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1D211C] flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-600" /> Defensive Response
              </h3>
              <span className="text-[10px] font-mono text-[#62685E] uppercase">Human Approval</span>
            </div>

            {isContained ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <div className="text-sm font-bold text-emerald-900">INCIDENT CONTAINED</div>
                <p className="text-xs text-emerald-800">
                  Defensive isolation executed on host <span className="font-mono font-bold">{incident.source_host || "WORKSTATION-042"}</span>. Outcome retained in Hindsight.
                </p>
              </div>
            ) : pendingAction ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-white border border-[rgba(40,50,35,0.10)] space-y-2">
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-[#1D211C]">{pendingAction.action_type || "ISOLATE_ENDPOINT"}</span>
                    <span className="text-rose-700 text-[10px] font-bold">RISK: {pendingAction.risk_level || "MEDIUM"}</span>
                  </div>
                  <div className="text-xs text-[#1D211C]">
                    Target: <strong className="font-mono">{pendingAction.target || incident.source_host}</strong>
                  </div>
                  <p className="text-xs text-[#62685E] leading-snug">
                    {pendingAction.reason || "Isolate target endpoint from corporate network to contain elevated privilege escalation."}
                  </p>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => handleApprove(pendingAction.id)}
                    disabled={isApproving}
                    className="w-full py-3 rounded-xl bg-[#8A9A65] text-white font-bold text-xs shadow-xs hover:bg-[#788855] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isApproving ? (
                      <Activity className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    )}
                    <span>{isApproving ? "Executing Response Simulation..." : "APPROVE DEFENSIVE RESPONSE"}</span>
                  </button>

                  <button
                    onClick={handleReject}
                    className="w-full py-2 rounded-xl bg-white text-[#62685E] hover:text-rose-700 border border-[rgba(40,50,35,0.12)] text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Reject Recommendation
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-[#62685E] text-xs font-mono bg-white/50 rounded-xl border border-dashed border-[rgba(40,50,35,0.12)]">
                Run investigation pipeline to generate response recommendations.
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
