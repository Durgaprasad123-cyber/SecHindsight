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
  Cpu, 
  Sparkles,
  RefreshCw,
  Clock,
  Server,
  Layers,
  Check,
  Database
} from "lucide-react";
import { 
  fetchIncidentDetail, 
  triggerInvestigation, 
  approveResponse, 
  rejectResponse 
} from "@/lib/api";
import { IncidentDetailResponse } from "@/lib/types";
import { StatusBadge, SeverityBadge, ConfidenceBar } from "@/components/ui/StatusBadge";
import { LoadingSkeleton, ErrorState } from "@/components/ui/StateViews";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

const WORKFLOW_STAGES = [
  { id: "NEW", label: "01 NEW ALERT" },
  { id: "TRIAGING", label: "02 TRIAGE" },
  { id: "INVESTIGATING", label: "03 RECALL & REFLECT" },
  { id: "THREAT_ANALYSIS", label: "04 THREAT MATRIX" },
  { id: "RESPONSE_RECOMMENDED", label: "05 RESPONSE STRATEGY" },
  { id: "AWAITING_APPROVAL", label: "06 HUMAN DECISION" },
  { id: "CONTAINED", label: "07 SIMULATED CONTAINMENT" },
];

export default function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<IncidentDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isInvestigating, setIsInvestigating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedActionId, setSelectedActionId] = useState<string | undefined>(undefined);

  const loadDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchIncidentDetail(id);
      setData(res);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || `Incident ${id} not found.`);
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
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Error executing investigation pipeline.");
    } finally {
      setIsInvestigating(false);
    }
  };

  const handleApproveConfirm = async () => {
    setIsApproving(true);
    try {
      await approveResponse(id, { action_id: selectedActionId });
      setShowConfirmModal(false);
      await loadDetail();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Error approving response action.");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!confirm("Are you sure you want to reject the recommended response action?")) return;
    try {
      await rejectResponse(id, "Analyst rejected recommended action.");
      await loadDetail();
    } catch (e: any) {
      console.error(e);
    }
  };

  if (loading) {
    return <LoadingSkeleton message={`Loading Incident ${id} telemetry & agent state...`} />;
  }

  if (error || !data || !data.incident) {
    return (
      <ErrorState
        title={`Incident ${id} Unavailable`}
        description={error || "Incident record not found in backend."}
        onRetry={loadDetail}
      />
    );
  }

  const { incident, evidence, agent_runs, responses } = data;

  const triageRun = agent_runs?.find((r) => r.agent_name === "triage");
  const triageOut = triageRun?.output_json;

  const invRun = agent_runs?.find((r) => r.agent_name === "investigation");
  const invOut = invRun?.output_json?.investigation;
  const recalledMemories = invRun?.output_json?.recalled_memories || [];

  const threatRun = agent_runs?.find((r) => r.agent_name === "threat");
  const threatOut = threatRun?.output_json;

  const respRun = agent_runs?.find((r) => r.agent_name === "response");
  const respOut = respRun?.output_json;

  const pendingAction = responses?.find((r) => r.status === "PENDING_APPROVAL") || respOut?.recommended_actions?.[0];
  const executedAction = responses?.find((r) => r.status === "EXECUTED");
  const isContained = incident.status === "CONTAINED" || !!executedAction;

  // Determine active workflow step index
  const getCurrentStepIndex = () => {
    if (isContained) return 6;
    if (incident.status === "AWAITING_APPROVAL") return 5;
    if (incident.status === "RESPONSE_RECOMMENDED") return 4;
    if (incident.status === "THREAT_ANALYSIS") return 3;
    if (incident.status === "INVESTIGATING") return 2;
    if (incident.status === "TRIAGING") return 1;
    return 0;
  };

  const activeStepIdx = getCurrentStepIndex();

  return (
    <div className="space-y-6 max-w-[1700px] mx-auto pb-12">
      
      {/* Back Link & Header Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/incidents"
          className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#10B981]" /> Back to Incidents Queue
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={loadDetail}
            className="p-1.5 rounded bg-[#242424] text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
            title="Refresh Incident State"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#10B981]" />
          </button>
          <StatusBadge status={incident.status} size="md" />
        </div>
      </div>

      {/* Incident Hero Card */}
      <div className="soc-card p-6 border-slate-800 bg-[#1A1A1A] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 font-mono text-xs">
              <span className="font-bold text-[#10B981] text-base">{incident.id}</span>
              <SeverityBadge severity={incident.severity} size="md" />
              <div className="flex items-center gap-1.5 bg-[#242424] px-2.5 py-0.5 rounded border border-slate-800">
                <span className="text-slate-400 text-[10px]">CONFIDENCE:</span>
                <ConfidenceBar confidence={incident.confidence} />
              </div>
            </div>

            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              {incident.title}
            </h1>
          </div>

          {!isContained && (
            <button
              onClick={handleRunInvestigation}
              disabled={isInvestigating}
              className="px-4 py-2.5 rounded bg-[#0F722A] hover:bg-[#0B561F] text-white font-mono font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0 disabled:opacity-50 border border-[#0F722A]"
            >
              {isInvestigating ? (
                <Activity className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Cpu className="w-4 h-4 text-white" />
              )}
              <span>{isInvestigating ? "Running Agent Pipeline..." : "Run Multi-Agent Investigation"}</span>
            </button>
          )}
        </div>

        {/* Telemetry Entity Metadata Table */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800 font-mono text-xs">
          <div className="bg-[#242424] p-2.5 rounded border border-slate-800">
            <span className="text-slate-500 text-[10px] block uppercase">TARGET HOST</span>
            <span className="text-slate-100 font-bold">{incident.source_host || "WORKSTATION-042"}</span>
          </div>
          <div className="bg-[#242424] p-2.5 rounded border border-slate-800">
            <span className="text-slate-500 text-[10px] block uppercase">USER ACCOUNT</span>
            <span className="text-slate-100 font-bold">{incident.user_account || "jdoe"}</span>
          </div>
          <div className="bg-[#242424] p-2.5 rounded border border-slate-800">
            <span className="text-slate-500 text-[10px] block uppercase">SOURCE IP</span>
            <span className="text-slate-100 font-bold">{incident.ip_address || "192.168.1.105"}</span>
          </div>
          <div className="bg-[#242424] p-2.5 rounded border border-slate-800">
            <span className="text-slate-500 text-[10px] block uppercase">ENDPOINT STATE</span>
            <span className={`font-bold ${isContained ? "text-red-400" : "text-emerald-400"}`}>
              {isContained ? "ISOLATED" : "ONLINE"}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed bg-[#242424] p-3 rounded border border-slate-800 font-mono">
          {incident.description}
        </p>
      </div>

      {/* Investigation Workflow Progress Stepper */}
      <div className="soc-card p-4 border-slate-800 bg-[#1A1A1A]">
        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#10B981] mb-3">
          Multi-Agent Investigation Workflow Pipeline State:
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {WORKFLOW_STAGES.map((s, idx) => {
            const isDone = activeStepIdx > idx;
            const isCurrent = activeStepIdx === idx;

            return (
              <div
                key={s.id}
                className={`p-2 rounded border text-[11px] font-mono transition-all ${
                  isCurrent
                    ? "bg-[#0F722A]/20 text-white border-[#0F722A] font-bold"
                    : isDone
                    ? "bg-[#242424] text-emerald-400 border-emerald-500/30"
                    : "bg-[#121212] text-slate-500 border-slate-800"
                }`}
              >
                <div className="flex items-center gap-1 mb-0.5">
                  {isDone ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : isCurrent ? (
                    <Activity className="w-3 h-3 text-[#10B981] animate-spin" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                  )}
                  <span className="text-[10px] truncate">{s.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Left (Investigation, Recall & MITRE) vs Right (Defensive Actions & Approval) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">

          {/* 1. TRIAGE AGENT FINDINGS */}
          {triageOut && (
            <div className="soc-card p-5 border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#10B981]" /> Triage Agent Output
                </h3>
                <span className="text-[10px] font-mono text-slate-400">
                  {triageRun?.execution_time_ms ? `${triageRun.execution_time_ms} ms` : "Completed"}
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-mono bg-[#242424] p-3 rounded border border-slate-800">
                {triageOut.reasoning || triageOut.initial_assessment}
              </p>
            </div>
          )}

          {/* 2. HINDSIGHT ORGANIZATIONAL MEMORY RECALL PANEL */}
          <div className="soc-card p-5 border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Brain className="w-4.5 h-4.5 text-[#10B981]" /> HINDSIGHT ORGANIZATIONAL MEMORY RECALL
                </h3>
                <p className="text-xs text-slate-400">Recalled experiences from memory bank <span className="font-mono text-slate-200">sechindsight</span></p>
              </div>
              <span className="px-2.5 py-1 rounded bg-[#0F722A]/20 text-[#10B981] text-xs font-mono font-bold border border-[#0F722A]/40">
                {recalledMemories.length} Memories Recalled
              </span>
            </div>

            {recalledMemories.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs font-mono bg-[#242424] rounded border border-dashed border-slate-800">
                Click "Run Multi-Agent Investigation" above to recall Hindsight memories.
              </div>
            ) : (
              <div className="space-y-3">
                {recalledMemories.map((mem: any, idx: number) => (
                  <div key={idx} className="p-4 rounded bg-[#242424] border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 font-mono text-xs">
                      <span className="font-bold text-[#10B981]">Source: {mem.incident_id}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400">
                        {mem.outcome}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 font-mono">
                      <strong>Historical Evidence:</strong> {mem.evidence_summary}
                    </p>
                    
                    <div className="p-2.5 rounded bg-[#121212] text-xs text-slate-200 font-mono border border-slate-800">
                      <strong className="text-teal-400">Lesson Learned:</strong> "{mem.lesson_learned}"
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. MEMORY INFLUENCE & REFLECTION PANEL ("WHY DID SECHINDSIGHT RECOMMEND THIS?") */}
          {invOut && (
            <div className="soc-card p-5 border-slate-800 space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Sparkles className="w-4.5 h-4.5 text-[#10B981]" /> WHY DID SECHINDSIGHT RECOMMEND THIS?
                </h3>
                <p className="text-xs text-slate-400">Analytical delta between current alert & recalled organizational memories</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
                <div className="p-3.5 rounded bg-[#242424] border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">CURRENT EVIDENCE</span>
                  <p className="text-slate-200">{incident.description}</p>
                </div>
                <div className="p-3.5 rounded bg-[#242424] border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">HISTORICAL PATTERN</span>
                  <p className="text-slate-200">{invOut.reflection_summary || "Prior benign VPN logins lacked privilege escalation attempts."}</p>
                </div>
              </div>

              <div className="p-3.5 rounded bg-[#0F722A]/15 border border-[#0F722A]/40 font-mono text-xs space-y-1">
                <div className="font-bold text-[#10B981] uppercase text-[10px]">CRITICAL DELTA IDENTIFIED:</div>
                <p className="text-slate-200 leading-relaxed">
                  Unlike previous false-positive VPN alerts, current incident combines unrecognized hardware ID <span className="font-bold text-red-400 font-mono">UNK-DEV-9921</span> with immediate privilege escalation command (<span className="font-bold text-red-400 font-mono">sudo su - root</span>).
                </p>
              </div>
            </div>
          )}

          {/* 4. MITRE ATT&CK THREAT MAPPING */}
          {threatOut && (
            <div className="soc-card p-5 border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <ShieldCheck className="w-4.5 h-4.5 text-red-400" /> MITRE ATT&CK Threat Mapping
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                {(threatOut.mitre_techniques || []).map((tech: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded bg-[#242424] border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-red-400">{tech.id}</span>
                      <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">{tech.tactic}</span>
                    </div>
                    <div className="font-bold text-slate-100">{tech.name}</div>
                    <p className="text-[11px] text-slate-400 leading-snug">{tech.reasoning}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. PRIMARY TELEMETRY EVIDENCE LOGS */}
          <div className="soc-card p-5 border-slate-800 space-y-3 font-mono text-xs">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Primary Evidence Items ({evidence.length}):</h3>
            <div className="space-y-2">
              {evidence.map((ev) => (
                <div key={ev.id} className="p-3 rounded bg-[#242424] border border-slate-800 flex items-center justify-between">
                  <span className="font-bold text-[#10B981]">{ev.evidence_type}</span>
                  <span className="text-slate-300 font-sans">{ev.description}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column (4 cols): Defensive Response & Human Approval */}
        <div className="lg:col-span-4 space-y-6">

          <div className="soc-card p-5 border-slate-800 space-y-4 sticky top-20">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between font-mono">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4.5 h-4.5 text-amber-400" /> DEFENSIVE RESPONSE
              </h3>
              <span className="text-[10px] text-amber-400 uppercase font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                HUMAN APPROVAL
              </span>
            </div>

            {isContained ? (
              <div className="p-4 rounded bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2 font-mono">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <div className="text-sm font-bold text-emerald-300">INCIDENT CONTAINED</div>
                <p className="text-xs text-slate-300">
                  Defensive isolation executed on target <span className="font-bold text-white">{incident.source_host || "WORKSTATION-042"}</span>. Outcome retained in Hindsight.
                </p>
              </div>
            ) : pendingAction ? (
              <div className="space-y-4 font-mono text-xs">
                <div className="p-3.5 rounded bg-[#242424] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100">{pendingAction.action_type || "ISOLATE_ENDPOINT"}</span>
                    <span className="text-red-400 text-[10px] font-bold">RISK: {pendingAction.risk_level || "MEDIUM"}</span>
                  </div>
                  <div className="text-slate-300">
                    Target: <strong className="text-white">{pendingAction.target || incident.source_host}</strong>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-snug">
                    {pendingAction.reason || "Isolate target endpoint to contain root privilege escalation."}
                  </p>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setSelectedActionId(pendingAction.id);
                      setShowConfirmModal(true);
                    }}
                    disabled={isApproving}
                    className="w-full py-3 rounded bg-[#0F722A] hover:bg-[#0B561F] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 border border-[#0F722A]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>APPROVE DEFENSIVE RESPONSE</span>
                  </button>

                  <button
                    onClick={handleReject}
                    className="w-full py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Reject Recommendation
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 text-xs font-mono bg-[#242424] rounded border border-dashed border-slate-800">
                Run investigation pipeline to generate response recommendations.
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleApproveConfirm}
        title="Approve Defensive Response Action"
        description={`Confirm defensive isolation command '${pendingAction?.action_type || "ISOLATE_ENDPOINT"}' on target '${pendingAction?.target || incident.source_host}'. Action will run in safe simulator mode and retain outcome into Hindsight.`}
        confirmText="Confirm & Execute Simulation"
        isLoading={isApproving}
      />

    </div>
  );
}
