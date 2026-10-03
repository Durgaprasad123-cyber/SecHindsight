"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Play, 
  Brain, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles,
  RefreshCw,
  ChevronRight,
  Cpu,
  Lock,
  Database,
  Layers,
  FileText,
  UserCheck,
  Server,
  Activity,
  Check
} from "lucide-react";
import { seedDemoData, triggerInvestigation, approveResponse, fetchIncidentDetail, retainMemoryApi } from "@/lib/api";
import { IncidentDetailResponse } from "@/lib/types";
import { StatusBadge, SeverityBadge, ConfidenceBar } from "@/components/ui/StatusBadge";
import { LoadingSkeleton, ErrorState } from "@/components/ui/StateViews";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

const STAGES = [
  { id: 1, label: "01 INCIDENT", short: "INCIDENT" },
  { id: 2, label: "02 RECALL", short: "RECALL" },
  { id: 3, label: "03 REFLECT", short: "REFLECT" },
  { id: 4, label: "04 DECIDE", short: "DECIDE" },
  { id: 5, label: "05 RETAIN", short: "RETAIN" }
];

export default function MasterDemoPage() {
  const [activeStage, setActiveStage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isInvestigating, setIsInvestigating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRetaining, setIsRetaining] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [incidentData, setIncidentData] = useState<IncidentDetailResponse | null>(null);
  const [retainSuccess, setRetainSuccess] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const detail = await fetchIncidentDetail("INC-1003");
      setIncidentData(detail);
      
      // Auto advance stage based on backend status
      if (detail?.incident?.status === "CONTAINED" || detail?.responses?.some((r) => r.status === "EXECUTED")) {
        setActiveStage(5);
      } else if (detail?.incident?.status === "AWAITING_APPROVAL" || detail?.agent_runs?.some((r) => r.agent_name === "response")) {
        setActiveStage(4);
      } else if (detail?.agent_runs?.some((r) => r.agent_name === "investigation")) {
        setActiveStage(3);
      }
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to fetch Master Demo incident INC-1003.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResetDemo = async () => {
    setLoading(true);
    try {
      await seedDemoData();
      setRetainSuccess(null);
      setActiveStage(1);
      await loadData();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Error resetting demo environment.");
    } finally {
      setLoading(false);
    }
  };

  const handleRunInvestigation = async () => {
    setIsInvestigating(true);
    try {
      await triggerInvestigation("INC-1003");
      await loadData();
      setActiveStage(3);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Error running investigation pipeline.");
    } finally {
      setIsInvestigating(false);
    }
  };

  const handleApproveConfirm = async () => {
    setIsApproving(true);
    try {
      await approveResponse("INC-1003");
      setShowConfirmModal(false);
      await loadData();
      setActiveStage(5);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Error approving defensive response.");
    } finally {
      setIsApproving(false);
    }
  };

  const handleRetainToHindsight = async () => {
    setIsRetaining(true);
    try {
      const res = await retainMemoryApi({
        incident_id: "INC-1003",
        category: "privilege_escalation",
        evidence_summary: "User 'jdoe' logged in from unrecognized device UNK-DEV-9921 via IP 192.168.1.105 and immediately initiated privilege escalation (sudo su - root / token impersonation).",
        analyst_decision: "CONFIRMED_COMPROMISE",
        response_taken: "ISOLATE_ENDPOINT",
        outcome: "Host WORKSTATION-042 isolated; active admin token revoked. Attack contained.",
        lesson_learned: "Unrecognized device combined with immediate privilege escalation strongly correlates with true compromise.",
        tags: ["privilege_escalation", "unknown_device", "isolated"]
      });
      setRetainSuccess(res);
      await loadData();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Error retaining memory.");
    } finally {
      setIsRetaining(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton message="Initializing Master Demo workspace for incident INC-1003..." />;
  }

  if (error || !incidentData) {
    return <ErrorState description={error || "Demo incident data unavailable."} onRetry={loadData} />;
  }

  const inc = incidentData.incident;
  const invRun = incidentData.agent_runs?.find((r) => r.agent_name === "investigation");
  const invOut = invRun?.output_json?.investigation;
  const recalledMemories = invRun?.output_json?.recalled_memories || [];
  const responses = incidentData.responses || [];
  const isContained = inc?.status === "CONTAINED" || responses.some((r) => r.status === "EXECUTED");

  return (
    <div className="space-y-6 max-w-[1700px] mx-auto pb-12">
      
      {/* Header & Demo Storyboard Banner */}
      <div className="soc-card p-6 border-[#242424] bg-[#161616] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-[#0F722A]/20 text-[#10B981] text-xs font-mono font-bold border border-[#0F722A]/40 flex items-center gap-1.5 uppercase">
              <Sparkles className="w-3.5 h-3.5 text-[#10B981]" /> Master Demonstration Workspace
            </span>
            <span className="text-xs text-neutral-400 font-mono">DEMO TARGET: INC-1003</span>
          </div>
          <h1 className="text-2xl font-bold text-white font-mono tracking-tight">
            Master Demo: Organizational Memory Cycle (INC-1003)
          </h1>
          <p className="text-xs text-neutral-400">
            A Cybersecurity SOC Copilot That Learns From Every Incident — Full Investigation, Memory Recall, Reflection & Retention.
          </p>
        </div>

        <button
          onClick={handleResetDemo}
          className="px-4 py-2 rounded bg-[#1A1A1A] hover:bg-[#242424] border border-[#242424] text-neutral-200 font-mono font-bold text-xs shadow transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#10B981] ${loading ? "animate-spin" : ""}`} />
          <span>Reset Demo Environment</span>
        </button>
      </div>

      {/* 5-Stage Guided Progress Stepper */}
      <div className="soc-card p-4 border-[#242424] bg-[#161616]">
        <div className="flex items-center justify-between font-mono">
          {STAGES.map((s, idx) => {
            const isActive = activeStage === s.id;
            const isCompleted = activeStage > s.id || (s.id === 5 && isContained);

            return (
              <React.Fragment key={s.id}>
                <button
                  onClick={() => {
                    // Allow navigating only to completed or active stage
                    if (s.id <= activeStage || isCompleted) {
                      setActiveStage(s.id);
                    }
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs font-bold transition-all cursor-pointer border relative z-10 ${
                    isActive
                      ? "bg-[#0F722A] text-white border-[#0F722A] shadow-md shadow-[#0F722A]/20"
                      : isCompleted
                      ? "bg-[#1A1A1A] text-emerald-400 border-emerald-500/40"
                      : "bg-[#121212] text-neutral-500 border-[#242424] opacity-60 cursor-not-allowed"
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    isActive ? "bg-white text-[#0F722A]" : isCompleted ? "bg-emerald-500/20 text-emerald-400" : "bg-[#242424] text-neutral-500"
                  }`}>
                    {isCompleted ? <Check className="w-3 h-3" /> : s.id}
                  </span>
                  <span>{s.label}</span>
                </button>
                {idx < STAGES.length - 1 && (
                  <div className={`flex-1 h-[2px] mx-2 transition-colors ${
                    activeStage > s.id ? "bg-[#0F722A]" : "bg-[#242424]"
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Workspace Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-mono">
        
        {/* Left Column (7 cols): Telemetry, Hindsight Recall & Comparison */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* SECTION 01: CURRENT INCIDENT TELEMETRY */}
          <div className="soc-card p-5 border-[#242424] space-y-4">
            <div className="flex items-center justify-between border-b border-[#242424] pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                  CURRENT TARGET
                </span>
                <span className="font-mono text-sm font-bold text-white">INC-1003</span>
              </div>
              <SeverityBadge severity={inc.severity} size="md" />
            </div>

            <div>
              <h2 className="text-base font-bold text-white">
                {inc.title}
              </h2>
              <p className="text-xs text-neutral-400 font-sans mt-1">
                {inc.description}
              </p>
            </div>

            {/* Telemetry Evidence Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
              <div className="bg-[#1A1A1A] p-2.5 rounded border border-[#242424]">
                <span className="text-neutral-500 text-[10px] block uppercase">USER</span>
                <span className="font-bold text-neutral-100">{inc.user_account || "jdoe"}</span>
              </div>
              <div className="bg-[#1A1A1A] p-2.5 rounded border border-[#242424]">
                <span className="text-neutral-500 text-[10px] block uppercase">SOURCE IP</span>
                <span className="font-bold text-neutral-100">{inc.ip_address || "192.168.1.105"}</span>
              </div>
              <div className="bg-[#1A1A1A] p-2.5 rounded border border-[#242424]">
                <span className="text-neutral-500 text-[10px] block uppercase">DEVICE</span>
                <span className="font-bold text-red-400">UNK-DEV-9921</span>
              </div>
              <div className="bg-[#1A1A1A] p-2.5 rounded border border-[#242424]">
                <span className="text-neutral-500 text-[10px] block uppercase">COMMAND</span>
                <span className="font-bold text-red-400">sudo su - root</span>
              </div>
              <div className="bg-[#1A1A1A] p-2.5 rounded border border-[#242424] col-span-2 sm:col-span-1">
                <span className="text-neutral-500 text-[10px] block uppercase">TOKEN ACTIVITY</span>
                <span className="font-bold text-red-400">impersonation</span>
              </div>
            </div>

            {/* Run Investigation Action Trigger */}
            <div className="flex items-center justify-between pt-2 border-t border-[#242424]">
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <Cpu className="w-4 h-4 text-[#10B981]" />
                <span>Multi-agent reasoning pipeline ready</span>
              </div>

              <button
                onClick={handleRunInvestigation}
                disabled={isInvestigating}
                className="px-4 py-2 rounded bg-[#0F722A] hover:bg-[#0F722A]/80 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 border border-[#0F722A]"
              >
                {isInvestigating ? (
                  <Activity className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Play className="w-4 h-4 fill-white text-white" />
                )}
                <span>{isInvestigating ? "Recalling Hindsight Memory..." : "RUN INVESTIGATION"}</span>
              </button>
            </div>
          </div>

          {/* SECTION 02: HINDSIGHT MEMORY RECALL */}
          <div className="soc-card p-5 border-[#242424] space-y-4">
            <div className="flex items-center justify-between border-b border-[#242424] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Brain className="w-4.5 h-4.5 text-[#10B981]" /> HINDSIGHT ORGANIZATIONAL MEMORY RECALL
                </h3>
                <p className="text-xs text-neutral-400 font-sans">Querying bank <span className="font-mono text-white font-bold">sechindsight</span> for historical experiences</p>
              </div>

              <span className="px-2.5 py-1 rounded bg-[#0F722A]/20 text-[#10B981] text-xs font-bold border border-[#0F722A]/40">
                {recalledMemories.length > 0 ? `${recalledMemories.length} Memories Recalled` : "Recall Ready"}
              </span>
            </div>

            {recalledMemories.length === 0 ? (
              <div className="p-6 text-center text-neutral-500 text-xs bg-[#1A1A1A] rounded border border-dashed border-[#242424] font-sans">
                Click "RUN INVESTIGATION" above to query Hindsight Cloud Memory bank for past incident experiences.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs font-bold text-[#10B981] flex items-center gap-1.5 uppercase">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> HINDSIGHT RECALL COMPLETE — Authentic Historical Experiences:
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* INC-1001 Recalled Experience */}
                  <div className="p-3.5 rounded bg-[#1A1A1A] border border-[#242424] space-y-2">
                    <div className="flex items-center justify-between border-b border-[#242424] pb-1.5">
                      <span className="font-bold text-neutral-100">HISTORICAL: INC-1001</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400">
                        BENIGN_CONFIRMED
                      </span>
                    </div>
                    <p className="text-neutral-300 font-sans text-xs">
                      <strong>Evidence:</strong> Known corporate laptop, internal VPN gateway. MAC address matched hardware asset registry.
                    </p>
                    <div className="p-2 rounded bg-[#121212] text-[11px] text-neutral-200 border border-[#242424]">
                      <strong>Outcome:</strong> Legitimate corporate access. No action required.
                    </div>
                  </div>

                  {/* INC-1002 Recalled Experience */}
                  <div className="p-3.5 rounded bg-[#1A1A1A] border border-[#242424] space-y-2">
                    <div className="flex items-center justify-between border-b border-[#242424] pb-1.5">
                      <span className="font-bold text-neutral-100">HISTORICAL: INC-1002</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400">
                        SESSION_VERIFIED
                      </span>
                    </div>
                    <p className="text-neutral-300 font-sans text-xs">
                      <strong>Evidence:</strong> Unknown device hardware ID <span className="text-white">UNK-DEV-9921</span>, but <em>no privilege escalation requested</em>.
                    </p>
                    <div className="p-2 rounded bg-[#121212] text-[11px] text-neutral-200 border border-[#242424]">
                      <strong>Outcome:</strong> Verified with secondary MFA push authentication.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 03: COMPARISON VISUALIZATION (PAST VS CURRENT) */}
          <div className="soc-card p-5 border-[#242424] space-y-4">
            <div className="border-b border-[#242424] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-[#10B981]" /> HINDSIGHT REFLECTION & COMPARISON VISUALIZATION
              </h3>
              <p className="text-xs text-neutral-400 font-sans">Side-by-side analytical breakdown identifying critical deltas</p>
            </div>

            {/* 3-Column Comparison Table */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              
              {/* Column 1: PAST INC-1001 */}
              <div className="p-3.5 rounded bg-[#1A1A1A] border border-[#242424] space-y-2">
                <div className="font-bold text-neutral-400 pb-1 border-b border-[#242424] text-[11px]">
                  PAST — INC-1001
                </div>
                <div className="space-y-1 text-neutral-300">
                  <div>• Device: <span>Corporate Laptop</span></div>
                  <div>• Auth: <span>Internal VPN</span></div>
                  <div>• Privileges: <span className="text-emerald-400 font-bold">None</span></div>
                  <div className="pt-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400">
                      BENIGN_CONFIRMED
                    </span>
                  </div>
                </div>
              </div>

              {/* Column 2: PAST INC-1002 */}
              <div className="p-3.5 rounded bg-[#1A1A1A] border border-[#242424] space-y-2">
                <div className="font-bold text-neutral-400 pb-1 border-b border-[#242424] text-[11px]">
                  PAST — INC-1002
                </div>
                <div className="space-y-1 text-neutral-300">
                  <div>• Device: <span className="text-amber-400">UNK-DEV-9921</span></div>
                  <div>• Auth: <span>VPN Gateway</span></div>
                  <div>• Privileges: <span className="text-emerald-400 font-bold">None</span></div>
                  <div className="pt-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400">
                      SESSION_VERIFIED
                    </span>
                  </div>
                </div>
              </div>

              {/* Column 3: CURRENT INC-1003 */}
              <div className="p-3.5 rounded bg-red-950/20 border border-red-500/40 space-y-2">
                <div className="font-bold text-red-400 pb-1 border-b border-red-500/30 flex justify-between text-[11px]">
                  <span>CURRENT — INC-1003</span>
                  <span className="font-bold">TARGET</span>
                </div>
                <div className="space-y-1 text-neutral-200">
                  <div>• Device: <span className="font-bold text-red-400">UNK-DEV-9921</span></div>
                  <div>• Auth: <span>Internal IP</span></div>
                  <div>• Privileges: <span className="font-bold text-red-400 bg-red-500/20 px-1 py-0.5 rounded">sudo su - root</span></div>
                  <div className="pt-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                      CONFIRMED_COMPROMISE
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* KEY DIFFERENCE HIGHLIGHT BOX */}
            <div className="p-4 rounded bg-[#0F722A]/15 border border-[#0F722A]/40 space-y-1">
              <div className="flex items-center gap-2 text-[#10B981] font-bold text-xs uppercase">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> KEY DIFFERENCE IDENTIFIED BY HINDSIGHT:
              </div>
              <p className="text-xs text-neutral-200 font-sans leading-relaxed">
                While INC-1001 and INC-1002 proved benign because no administrative privileges were requested, <strong>INC-1003 combines an unrecognized device hardware ID (UNK-DEV-9921) with immediate privilege escalation (<span className="font-mono text-red-400">sudo su - root</span> / token impersonation)</strong>.
              </p>
            </div>

          </div>

        </div>

        {/* Right Column (5 cols): Recommendation, Human Approval & Retention */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* SECTION 04: RECOMMENDATION & HUMAN APPROVAL */}
          <div className="soc-card p-5 border-[#242424] space-y-4">
            <div className="border-b border-[#242424] pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Zap className="w-4.5 h-4.5 text-amber-400" /> RESPONSE RECOMMENDATION
                </h3>
                <p className="text-xs text-neutral-400 font-sans">Formulated from Hindsight memory influence</p>
              </div>

              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/40">
                HUMAN APPROVAL REQUIRED
              </span>
            </div>

            {/* Recommended Actions */}
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded bg-[#1A1A1A] border border-[#242424] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">ISOLATE_ENDPOINT</span>
                  <span className="text-red-400 font-bold">Target: WORKSTATION-042</span>
                </div>
                <p className="text-neutral-400 font-sans">Sever host network connectivity to contain active root token impersonation.</p>
              </div>

              <div className="p-3 rounded bg-[#1A1A1A] border border-[#242424] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">REVOKE_SESSION</span>
                  <span className="text-red-400 font-bold">Target: jdoe@corp.internal</span>
                </div>
                <p className="text-neutral-400 font-sans">Revoke active authentication tokens and enforce secondary MFA re-authentication.</p>
              </div>
            </div>

            {/* Analyst Controls */}
            {isContained ? (
              <div className="p-4 rounded bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <div className="text-sm font-bold text-emerald-300">RESPONSE SIMULATION COMPLETE</div>
                <p className="text-xs text-neutral-300 font-sans">
                  Defensive isolation executed on host <span className="font-bold text-white">WORKSTATION-042</span>. Incident successfully contained.
                </p>
              </div>
            ) : (
              <div className="space-y-2 pt-2 border-t border-[#242424]">
                <button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={isApproving}
                  className="w-full py-3 rounded bg-[#0F722A] hover:bg-[#0F722A]/80 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 border border-[#0F722A]"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>APPROVE DEFENSIVE RESPONSE</span>
                </button>
              </div>
            )}
          </div>

          {/* SECTION 05: RETAIN TO HINDSIGHT */}
          <div className="soc-card p-5 border-[#242424] space-y-4">
            <div className="border-b border-[#242424] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4.5 h-4.5 text-[#10B981]" /> RETAIN TO HINDSIGHT MEMORY BANK
              </h3>
              <p className="text-xs text-neutral-400 font-sans">Store outcome as new organizational experience for future SOC investigations</p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded bg-[#1A1A1A] border border-[#242424] space-y-1">
                <div className="text-[10px] text-neutral-400 uppercase">OUTCOME TO RETAIN</div>
                <div className="font-bold text-red-400">CONFIRMED_COMPROMISE</div>
              </div>

              <div className="p-3 rounded bg-[#1A1A1A] border border-[#242424] space-y-1">
                <div className="text-[10px] text-neutral-400 uppercase">ORGANIZATIONAL LESSON LEARNED</div>
                <p className="text-neutral-200 font-sans font-medium leading-snug">
                  "Unrecognized device combined with immediate privilege escalation strongly correlates with true compromise."
                </p>
              </div>
            </div>

            {retainSuccess ? (
              <div className="p-4 rounded bg-[#0F722A]/20 border border-[#0F722A]/40 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> HINDSIGHT MEMORY RETAINED SUCCESSFULLY
                </div>
                <div className="text-[11px] text-neutral-300 space-y-0.5">
                  <div>Incident ID: <span className="font-bold text-white">INC-1003</span></div>
                  <div>Memory Bank: <span className="font-bold text-white">sechindsight</span></div>
                  <div>Status: <span className="text-emerald-400 font-bold">Retained to Organizational Memory</span></div>
                </div>
                <Link
                  href="/memory"
                  className="mt-2 text-xs font-bold text-[#10B981] hover:underline flex items-center gap-1 block"
                >
                  View in Memory Explorer <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <button
                onClick={handleRetainToHindsight}
                disabled={isRetaining}
                className="w-full py-3 rounded bg-[#1A1A1A] hover:bg-[#242424] border border-[#242424] text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isRetaining ? (
                  <Activity className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Database className="w-4 h-4 text-white" />
                )}
                <span>{isRetaining ? "Retaining Memory..." : "RETAIN TO HINDSIGHT"}</span>
              </button>
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
        description="Confirm defensive endpoint isolation 'ISOLATE_ENDPOINT' on target 'WORKSTATION-042'. Action will run in safe simulator mode and retain outcome into Hindsight."
        confirmText="Confirm & Execute Simulation"
        isLoading={isApproving}
      />

    </div>
  );
}
