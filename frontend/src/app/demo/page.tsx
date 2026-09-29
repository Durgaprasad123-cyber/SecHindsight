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
  Activity
} from "lucide-react";
import { seedDemoData, triggerInvestigation, approveResponse, fetchIncidentDetail, retainMemoryApi } from "@/lib/api";

const STAGES = [
  { id: 1, label: "01 INCIDENT", short: "INCIDENT" },
  { id: 2, label: "02 RECALL", short: "RECALL" },
  { id: 3, label: "03 REFLECT", short: "REFLECT" },
  { id: 4, label: "04 DECIDE", short: "DECIDE" },
  { id: 5, label: "05 RETAIN", short: "RETAIN" }
];

export default function MasterDemoPage() {
  const [activeStage, setActiveStage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRetaining, setIsRetaining] = useState(false);
  const [incidentData, setIncidentData] = useState<any>(null);
  const [retainSuccess, setRetainSuccess] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const detail = await fetchIncidentDetail("INC-1003");
      setIncidentData(detail);
      
      // Auto advance stage based on backend status
      if (detail?.incident?.status === "CONTAINED" || detail?.responses?.some((r: any) => r.status === "EXECUTED")) {
        setActiveStage(5);
      } else if (detail?.incident?.status === "AWAITING_APPROVAL" || detail?.agent_runs?.some((r: any) => r.agent_name === "response")) {
        setActiveStage(4);
      } else if (detail?.agent_runs?.some((r: any) => r.agent_name === "investigation")) {
        setActiveStage(3);
      }
    } catch (e) {
      console.error(e);
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
    } catch (e) {
      console.error(e);
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
    } catch (e) {
      console.error(e);
    } finally {
      setIsInvestigating(false);
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await approveResponse("INC-1003");
      await loadData();
      setActiveStage(5);
    } catch (e) {
      console.error(e);
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
    } catch (e) {
      console.error(e);
    } finally {
      setIsRetaining(false);
    }
  };

  const inc = incidentData?.incident;
  const invRun = incidentData?.agent_runs?.find((r: any) => r.agent_name === "investigation");
  const invOut = invRun?.output_json?.investigation;
  const recalledMemories = invRun?.output_json?.recalled_memories || [];
  const responses = incidentData?.responses || [];
  const isContained = inc?.status === "CONTAINED" || responses.some((r: any) => r.status === "EXECUTED");

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto pb-12">
      
      {/* Header & Demo Storyboard Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border-[rgba(40,50,35,0.12)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md bg-[#E0E7D7] text-[#1D211C] text-xs font-semibold border border-[#B7C396]/40 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#8A9A65]" /> 3-Minute Hackathon Demo Workspace
            </span>
            <span className="text-xs text-[#62685E] font-mono">DEMO TELEMETRY</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1D211C] tracking-tight">
            Master Demo: Organizational Memory Cycle (INC-1003)
          </h1>
          <p className="text-xs text-[#62685E]">
            A Cybersecurity SOC Copilot That Learns From Every Incident — Full Investigation, Memory Recall, Reflection & Retention.
          </p>
        </div>

        <button
          onClick={handleResetDemo}
          className="px-4 py-2 rounded-xl bg-white border border-[rgba(40,50,35,0.15)] text-[#1D211C] font-semibold text-xs shadow-xs hover:bg-[#F5F6F1] transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#8A9A65] ${loading ? "animate-spin" : ""}`} />
          <span>Reset Demo Environment</span>
        </button>
      </div>

      {/* 5-Stage Guided Progress Stepper Line */}
      <div className="glass-panel p-4 rounded-2xl border-[rgba(40,50,35,0.10)] bg-white/80">
        <div className="flex items-center justify-between relative">
          {STAGES.map((s, idx) => {
            const isActive = activeStage === s.id;
            const isCompleted = activeStage > s.id || (s.id === 5 && isContained);

            return (
              <React.Fragment key={s.id}>
                <button
                  onClick={() => setActiveStage(s.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border relative z-10 ${
                    isActive
                      ? "bg-[#E0E7D7] text-[#1D211C] border-[#8A9A65] shadow-xs"
                      : isCompleted
                      ? "bg-white text-[#8A9A65] border-[#B7C396]/50"
                      : "bg-white/50 text-[#62685E] border-transparent hover:bg-white"
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${
                    isActive ? "bg-[#8A9A65] text-white font-bold" : isCompleted ? "bg-[#B7C396] text-white" : "bg-[#EDECEC] text-[#62685E]"
                  }`}>
                    {s.id}
                  </span>
                  <span>{s.label}</span>
                </button>
                {idx < STAGES.length - 1 && (
                  <div className={`flex-1 h-[2px] mx-2 transition-colors ${
                    activeStage > s.id ? "bg-[#8A9A65]" : "bg-[#EDECEC]"
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Primary Investigation Surface: 1920x1080 Optimized Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (7 cols): Telemetry, Hindsight Recall & Comparison */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* SECTION 01: CURRENT INCIDENT TELEMETRY */}
          <div className="glass-panel p-5 rounded-2xl border-[rgba(40,50,35,0.12)] space-y-4">
            <div className="flex items-center justify-between border-b border-[rgba(40,50,35,0.08)] pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-200">
                  CURRENT INCIDENT
                </span>
                <span className="font-mono text-sm font-bold text-[#1D211C]">INC-1003</span>
              </div>
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-semibold bg-[#E0E7D7] text-[#1D211C]">
                Severity: HIGH (94% Confidence)
              </span>
            </div>

            <div>
              <h2 className="text-base font-bold text-[#1D211C]">
                Suspicious Login + Unknown Device + Privilege Escalation Attempt
              </h2>
              <p className="text-xs text-[#62685E] mt-0.5">
                Authentication detected from non-enrolled device followed immediately by credential token impersonation.
              </p>
            </div>

            {/* Primary Telemetry Evidence Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
              <div className="bg-white/80 p-2.5 rounded-xl border border-[rgba(40,50,35,0.08)]">
                <span className="text-[#62685E] text-[10px] block uppercase">USER</span>
                <span className="font-bold text-[#1D211C]">jdoe</span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-xl border border-[rgba(40,50,35,0.08)]">
                <span className="text-[#62685E] text-[10px] block uppercase">SOURCE IP</span>
                <span className="font-bold text-[#1D211C]">192.168.1.105</span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-xl border border-[rgba(40,50,35,0.08)]">
                <span className="text-[#62685E] text-[10px] block uppercase">DEVICE</span>
                <span className="font-bold text-rose-700">UNK-DEV-9921</span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-xl border border-[rgba(40,50,35,0.08)]">
                <span className="text-[#62685E] text-[10px] block uppercase">COMMAND</span>
                <span className="font-bold text-rose-700">sudo su - root</span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-xl border border-[rgba(40,50,35,0.08)] col-span-2 sm:col-span-1">
                <span className="text-[#62685E] text-[10px] block uppercase">TOKEN ACTIVITY</span>
                <span className="font-bold text-rose-700">impersonation</span>
              </div>
            </div>

            {/* Run Investigation Action Trigger */}
            <div className="flex items-center justify-between pt-2 border-t border-[rgba(40,50,35,0.08)]">
              <div className="flex items-center gap-2 text-xs text-[#62685E]">
                <Cpu className="w-4 h-4 text-[#8A9A65]" />
                <span>Multi-agent reasoning pipeline ready</span>
              </div>

              <button
                onClick={handleRunInvestigation}
                disabled={isInvestigating}
                className="px-4 py-2 rounded-xl bg-[#8A9A65] text-white font-bold text-xs shadow-xs hover:bg-[#788855] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
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
          <div className="glass-panel p-5 rounded-2xl border-[rgba(40,50,35,0.12)] space-y-4">
            <div className="flex items-center justify-between border-b border-[rgba(40,50,35,0.08)] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#1D211C] flex items-center gap-2">
                  <Brain className="w-5 h-5 text-[#8A9A65]" /> HINDSIGHT ORGANIZATIONAL MEMORY RECALL
                </h3>
                <p className="text-xs text-[#62685E]">Querying bank <span className="font-mono font-semibold text-[#1D211C]">sechindsight</span> for historical experiences</p>
              </div>

              <span className="px-2.5 py-1 rounded bg-[#E0E7D7] text-[#1D211C] font-mono text-xs font-bold border border-[#B7C396]/40">
                {recalledMemories.length > 0 ? `${recalledMemories.length} Memories Recalled` : "Recall Ready"}
              </span>
            </div>

            {recalledMemories.length === 0 ? (
              <div className="p-6 text-center text-[#62685E] text-xs bg-white/50 rounded-xl border border-dashed border-[rgba(40,50,35,0.15)]">
                Click "RUN INVESTIGATION" above to query Hindsight Cloud Memory bank for past incident experiences.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-[#8A9A65] flex items-center gap-1.5 uppercase font-mono">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> HINDSIGHT RECALL COMPLETE — Authentic Historical Experiences:
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* INC-1001 Recalled Experience */}
                  <div className="p-3.5 rounded-xl bg-white border border-[rgba(40,50,35,0.10)] space-y-2 shadow-xs">
                    <div className="flex items-center justify-between border-b border-[rgba(40,50,35,0.06)] pb-1.5">
                      <span className="font-mono text-xs font-bold text-[#1D211C]">HISTORICAL: INC-1001</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                        BENIGN_CONFIRMED
                      </span>
                    </div>
                    <p className="text-xs text-[#62685E] leading-snug">
                      <strong>Evidence:</strong> Known corporate laptop, internal VPN gateway. MAC address matched hardware asset registry.
                    </p>
                    <div className="p-2 rounded bg-[#E0E7D7]/50 text-[11px] text-[#1D211C]">
                      <strong>Outcome:</strong> Legitimate corporate access. No action required.
                    </div>
                  </div>

                  {/* INC-1002 Recalled Experience */}
                  <div className="p-3.5 rounded-xl bg-white border border-[rgba(40,50,35,0.10)] space-y-2 shadow-xs">
                    <div className="flex items-center justify-between border-b border-[rgba(40,50,35,0.06)] pb-1.5">
                      <span className="font-mono text-xs font-bold text-[#1D211C]">HISTORICAL: INC-1002</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800">
                        SESSION_VERIFIED
                      </span>
                    </div>
                    <p className="text-xs text-[#62685E] leading-snug">
                      <strong>Evidence:</strong> Unknown device hardware ID <span className="font-mono text-[#1D211C]">UNK-DEV-9921</span>, but <em>no privilege escalation requested</em>.
                    </p>
                    <div className="p-2 rounded bg-[#E0E7D7]/50 text-[11px] text-[#1D211C]">
                      <strong>Outcome:</strong> Verified with secondary MFA push authentication.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 03: POLISHED COMPARISON VISUALIZATION (PAST VS CURRENT) */}
          <div className="glass-panel p-5 rounded-2xl border-[rgba(40,50,35,0.12)] space-y-4">
            <div className="border-b border-[rgba(40,50,35,0.08)] pb-3">
              <h3 className="text-base font-bold text-[#1D211C] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#8A9A65]" /> HINDSIGHT REFLECTION & COMPARISON VISUALIZATION
              </h3>
              <p className="text-xs text-[#62685E]">Side-by-side analytical breakdown identifying critical deltas</p>
            </div>

            {/* 3-Column Comparison Table */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              
              {/* Column 1: PAST INC-1001 */}
              <div className="p-3.5 rounded-xl bg-white/90 border border-[rgba(40,50,35,0.10)] space-y-2">
                <div className="font-mono text-xs font-bold text-[#62685E] pb-1 border-b border-[rgba(40,50,35,0.08)]">
                  PAST — INC-1001
                </div>
                <div className="space-y-1 text-[#1D211C]">
                  <div>• Device: <span className="font-mono">Corporate Laptop</span></div>
                  <div>• Auth: <span className="font-mono">Internal VPN</span></div>
                  <div>• Privileges: <span className="font-mono text-emerald-700">None</span></div>
                  <div className="pt-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                      BENIGN_CONFIRMED
                    </span>
                  </div>
                </div>
              </div>

              {/* Column 2: PAST INC-1002 */}
              <div className="p-3.5 rounded-xl bg-white/90 border border-[rgba(40,50,35,0.10)] space-y-2">
                <div className="font-mono text-xs font-bold text-[#62685E] pb-1 border-b border-[rgba(40,50,35,0.08)]">
                  PAST — INC-1002
                </div>
                <div className="space-y-1 text-[#1D211C]">
                  <div>• Device: <span className="font-mono text-amber-700">UNK-DEV-9921</span></div>
                  <div>• Auth: <span className="font-mono">VPN Gateway</span></div>
                  <div>• Privileges: <span className="font-mono text-emerald-700">None</span></div>
                  <div className="pt-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800">
                      SESSION_VERIFIED
                    </span>
                  </div>
                </div>
              </div>

              {/* Column 3: CURRENT INC-1003 */}
              <div className="p-3.5 rounded-xl bg-rose-50/80 border border-rose-300 space-y-2 shadow-xs">
                <div className="font-mono text-xs font-bold text-rose-900 pb-1 border-b border-rose-200 flex justify-between">
                  <span>CURRENT — INC-1003</span>
                  <span className="text-rose-700 font-bold">TARGET</span>
                </div>
                <div className="space-y-1 text-[#1D211C]">
                  <div>• Device: <span className="font-mono font-bold text-rose-700">UNK-DEV-9921</span></div>
                  <div>• Auth: <span className="font-mono">Internal IP</span></div>
                  <div>• Privileges: <span className="font-mono font-bold text-rose-800 bg-rose-200 px-1 py-0.5 rounded">sudo su - root</span></div>
                  <div className="pt-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-900 text-white">
                      CONFIRMED_COMPROMISE
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* KEY DIFFERENCE HIGHLIGHT BOX */}
            <div className="p-4 rounded-xl bg-[#BA9A91]/15 border border-[#BA9A91]/40 space-y-1">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-xs uppercase tracking-wider font-mono">
                <AlertTriangle className="w-4 h-4 text-rose-700" /> KEY DIFFERENCE IDENTIFIED BY HINDSIGHT:
              </div>
              <p className="text-xs text-[#1D211C] leading-relaxed">
                While INC-1001 and INC-1002 proved benign because no administrative privileges were requested, <strong>INC-1003 combines an unrecognized device hardware ID (UNK-DEV-9921) with immediate privilege escalation (<span className="font-mono">sudo su - root</span> / token impersonation)</strong>.
              </p>
            </div>

          </div>

        </div>

        {/* Right Column (5 cols): Recommendation, Human Approval & Retention */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* SECTION 04: RECOMMENDATION & HUMAN APPROVAL */}
          <div className="glass-panel p-5 rounded-2xl border-[rgba(40,50,35,0.12)] space-y-4">
            <div className="border-b border-[rgba(40,50,35,0.08)] pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#1D211C] flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-600" /> RESPONSE RECOMMENDATION
                </h3>
                <p className="text-xs text-[#62685E]">Formulated from Hindsight memory influence</p>
              </div>

              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-mono text-[10px] font-bold border border-amber-300">
                HUMAN APPROVAL REQUIRED
              </span>
            </div>

            {/* Recommended Defensive Actions List */}
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-white border border-[rgba(40,50,35,0.10)] space-y-1">
                <div className="flex items-center justify-between font-mono">
                  <span className="font-bold text-[#1D211C]">ISOLATE_ENDPOINT</span>
                  <span className="text-rose-700 font-bold">Target: WORKSTATION-042</span>
                </div>
                <p className="text-[#62685E]">Sever host network connectivity to contain active root token impersonation.</p>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[rgba(40,50,35,0.10)] space-y-1">
                <div className="flex items-center justify-between font-mono">
                  <span className="font-bold text-[#1D211C]">REVOKE_SESSION</span>
                  <span className="text-rose-700 font-bold">Target: jdoe@corp.internal</span>
                </div>
                <p className="text-[#62685E]">Revoke active authentication tokens and enforce secondary MFA re-authentication.</p>
              </div>
            </div>

            {/* Human-in-the-Loop Analyst Action Controls */}
            {isContained ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <div className="text-sm font-bold text-emerald-900">RESPONSE SIMULATION COMPLETE</div>
                <p className="text-xs text-emerald-800">
                  Defensive isolation executed on host <span className="font-mono font-bold">WORKSTATION-042</span>. Incident successfully contained.
                </p>
              </div>
            ) : (
              <div className="space-y-2 pt-2 border-t border-[rgba(40,50,35,0.08)]">
                <div className="text-[11px] font-semibold text-[#1D211C] uppercase tracking-wider">
                  ANALYST DECISION REQUIRED:
                </div>
                <button
                  onClick={handleApprove}
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
              </div>
            )}
          </div>

          {/* SECTION 05: RETAIN TO HINDSIGHT */}
          <div className="glass-panel p-5 rounded-2xl border-[rgba(40,50,35,0.12)] space-y-4">
            <div className="border-b border-[rgba(40,50,35,0.08)] pb-3">
              <h3 className="text-base font-bold text-[#1D211C] flex items-center gap-2">
                <Database className="w-5 h-5 text-[#8A9A65]" /> RETAIN TO HINDSIGHT MEMORY BANK
              </h3>
              <p className="text-xs text-[#62685E]">Store outcome as new organizational experience for future SOC investigations</p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-white border border-[rgba(40,50,35,0.10)] space-y-1">
                <div className="text-[10px] font-mono text-[#62685E] uppercase">OUTCOME TO RETAIN</div>
                <div className="font-bold text-rose-800 font-mono">CONFIRMED_COMPROMISE</div>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[rgba(40,50,35,0.10)] space-y-1">
                <div className="text-[10px] font-mono text-[#62685E] uppercase">ORGANIZATIONAL LESSON LEARNED</div>
                <p className="text-[#1D211C] font-medium leading-snug">
                  "Unrecognized device combined with immediate privilege escalation strongly correlates with true compromise."
                </p>
              </div>
            </div>

            {retainSuccess ? (
              <div className="p-4 rounded-xl bg-[#E0E7D7] border border-[#B7C396] space-y-2">
                <div className="flex items-center gap-2 text-[#1D211C] font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" /> HINDSIGHT MEMORY RETAINED SUCCESSFULLY
                </div>
                <div className="text-[11px] font-mono text-[#62685E] space-y-0.5">
                  <div>Incident ID: <span className="font-bold text-[#1D211C]">INC-1003</span></div>
                  <div>Memory Bank: <span className="font-bold text-[#1D211C]">sechindsight</span></div>
                  <div>Status: <span className="text-emerald-800 font-bold">Retained to Organizational Memory</span></div>
                </div>
                <Link
                  href="/memory"
                  className="mt-2 text-xs font-bold text-[#8A9A65] hover:underline flex items-center gap-1 block"
                >
                  View in Memory Explorer <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <button
                onClick={handleRetainToHindsight}
                disabled={isRetaining}
                className="w-full py-3 rounded-xl bg-[#1D211C] text-white font-bold text-xs hover:bg-[#283029] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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

    </div>
  );
}
