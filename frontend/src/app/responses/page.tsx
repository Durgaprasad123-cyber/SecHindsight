"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Zap, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Lock, 
  Activity,
  FileText,
  RefreshCw,
  AlertTriangle,
  Server
} from "lucide-react";
import { fetchResponses, fetchAuditLogs, approveResponse, rejectResponse } from "@/lib/api";
import { ResponseAction, AuditLog } from "@/lib/types";
import { LoadingSkeleton, ErrorState, EmptyState } from "@/components/ui/StateViews";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

export default function ResponsesPage() {
  const [responses, setResponses] = useState<ResponseAction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedAction, setSelectedAction] = useState<ResponseAction | null>(null);
  const [isApproving, setIsApproving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [respData, auditData] = await Promise.all([
        fetchResponses({ limit: 50 }),
        fetchAuditLogs({ limit: 50 })
      ]);
      setResponses(respData.responses || []);
      setAuditLogs(auditData.audit_logs || []);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to load response center telemetry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveAction = async () => {
    if (!selectedAction) return;
    setIsApproving(true);
    try {
      await approveResponse(selectedAction.incident_id, { action_id: selectedAction.id });
      setSelectedAction(null);
      await loadData();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Error approving action.");
    } finally {
      setIsApproving(false);
    }
  };

  const pendingActions = responses.filter(r => r.status === "PENDING_APPROVAL");
  const executedActions = responses.filter(r => r.status === "EXECUTED" || r.status === "APPROVED");

  return (
    <div className="space-y-6 max-w-[1700px] mx-auto pb-12">
      
      {/* Header Banner */}
      <div className="soc-card p-6 border-slate-800 bg-[#1A1A1A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-xs font-mono font-bold border border-amber-500/40 uppercase">
              DEFENSIVE RESPONSE SIMULATOR
            </span>
            <span className="text-xs text-slate-400 font-mono">SAFE SIMULATION ENGINE</span>
          </div>
          <h1 className="text-2xl font-bold text-white font-mono flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-400" /> Response Center & Safe Action Execution
          </h1>
          <p className="text-xs text-slate-400 max-w-3xl">
            Human-in-the-loop approval workflow for simulated defensive operations (endpoint isolation, IP blocking, session revocation, account disabling).
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2.5 rounded bg-[#242424] text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors shrink-0"
          title="Refresh Operations"
        >
          <RefreshCw className={`w-4 h-4 text-[#10B981] ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading ? (
        <LoadingSkeleton message="Fetching response action state & audit logs..." />
      ) : error ? (
        <ErrorState description={error} onRetry={loadData} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Col: Pending & Executed Response Actions */}
          <div className="space-y-6">
            
            {/* Pending Approvals Queue */}
            <div className="soc-card p-5 border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 font-mono">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" /> PENDING HUMAN APPROVALS ({pendingActions.length})
                </h2>
                <span className="text-[10px] text-amber-400 uppercase font-bold">QUEUED FOR ANALYST</span>
              </div>

              {pendingActions.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs font-mono bg-[#242424] rounded border border-dashed border-slate-800">
                  No pending response actions awaiting approval.
                </div>
              ) : (
                <div className="space-y-3 font-mono text-xs">
                  {pendingActions.map((action) => (
                    <div key={action.id} className="p-4 rounded bg-[#242424] border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-100">{action.action_type}</span>
                        <span className="text-red-400 text-[10px] font-bold uppercase">RISK: {action.risk_level}</span>
                      </div>
                      <div className="text-slate-300">
                        Target: <strong className="text-white">{action.target}</strong> | Incident: <Link href={`/incidents/${action.incident_id}`} className="text-[#10B981] hover:underline font-bold">{action.incident_id}</Link>
                      </div>
                      <p className="text-slate-400 text-[11px] font-sans leading-snug">{action.reason}</p>

                      <button
                        onClick={() => setSelectedAction(action)}
                        className="mt-2 w-full py-2 rounded bg-[#0F722A] hover:bg-[#0B561F] text-white font-bold text-xs shadow transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#0F722A]"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>REVIEW & APPROVE SIMULATION</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Executed Responses */}
            <div className="soc-card p-5 border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 font-mono">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> EXECUTED RESPONSE ACTIONS ({executedActions.length})
                </h2>
                <span className="text-[10px] text-emerald-400 uppercase font-bold">SIMULATED SUCCESS</span>
              </div>

              {executedActions.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs font-mono bg-[#242424] rounded border border-dashed border-slate-800">
                  No response actions executed yet.
                </div>
              ) : (
                <div className="space-y-3 font-mono text-xs">
                  {executedActions.map((action) => (
                    <div key={action.id} className="p-4 rounded bg-[#242424] border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#10B981]">{action.action_type}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400">
                          {action.status}
                        </span>
                      </div>

                      <div className="text-slate-300">
                        Target: <strong className="text-white">{action.target}</strong> | Incident: <strong className="text-slate-100">{action.incident_id}</strong>
                      </div>

                      <p className="text-slate-400 text-[11px] font-sans leading-snug">{action.reason}</p>

                      {action.execution_details && (
                        <div className="p-2.5 rounded bg-[#121212] text-[11px] font-mono text-slate-200 border border-slate-800 space-y-1">
                          <div className="flex items-center justify-between text-[#10B981] font-bold text-[10px] uppercase">
                            <span>SIMULATION EXECUTION METRICS</span>
                            <span>{action.execution_details.latency_ms || 142} ms</span>
                          </div>
                          <div>Target Current State: <span className="text-red-400 font-bold">{action.execution_details.target_current_state || "ISOLATED"}</span></div>
                          <div>Approved By: <span className="text-white">{action.approved_by || "SOC Lead Analyst"}</span></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Col: Recent Application Audit Trail */}
          <div className="soc-card p-5 border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 font-mono">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#10B981]" /> RECENT AUDIT TRAIL ({auditLogs.length})
              </h2>
              <Link href="/audit-log" className="text-xs text-[#10B981] hover:underline">
                View Full Audit Log
              </Link>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              {auditLogs.slice(0, 10).map((log) => (
                <div key={log.id} className="p-3 rounded bg-[#242424] border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#10B981] font-bold">{log.action}</span>
                    <span className="text-slate-500 text-[10px]">{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ""}</span>
                  </div>
                  <div className="text-slate-400 text-[11px]">Actor: <span className="text-white font-bold">{log.actor}</span></div>
                  <p className="text-slate-200 text-[11px] font-sans">{log.details}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Confirmation Modal */}
      {selectedAction && (
        <ConfirmationModal
          isOpen={!!selectedAction}
          onClose={() => setSelectedAction(null)}
          onConfirm={handleApproveAction}
          title="Approve Defensive Action Simulation"
          description={`Confirm defensive isolation '${selectedAction.action_type}' on target '${selectedAction.target}' for incident '${selectedAction.incident_id}'. Executed in safe simulation mode and retained into Hindsight memory.`}
          confirmText="Approve & Execute Simulation"
          isLoading={isApproving}
        />
      )}

    </div>
  );
}
