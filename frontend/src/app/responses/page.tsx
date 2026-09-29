"use client";

import React, { useEffect, useState } from "react";
import { 
  Zap, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Lock, 
  Activity,
  FileText
} from "lucide-react";
import { fetchResponses, fetchAuditLogs } from "@/lib/api";

export default function ResponsesPage() {
  const [responses, setResponses] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchResponses(), fetchAuditLogs()])
      .then(([respData, auditData]) => {
        setResponses(respData.responses || []);
        setAuditLogs(auditData.audit_logs || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border-[rgba(40,50,35,0.10)] bg-white/80">
        <div className="space-y-1">
          <span className="px-2.5 py-0.5 rounded-md bg-[#E0E7D7] text-[#1D211C] text-xs font-semibold border border-[#B7C396]/40">
            Defensive Response Simulator
          </span>
          <h1 className="text-2xl font-bold text-[#1D211C] flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-600" /> Response Center & Audit Logs
          </h1>
          <p className="text-xs text-[#62685E]">
            Track human-approved simulated defensive actions (endpoint isolation, IP blocking, session revocation).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Col: Executed Response Actions */}
        <div className="glass-panel p-6 rounded-2xl space-y-4 bg-white/80 border-[rgba(40,50,35,0.10)]">
          <h2 className="text-base font-bold text-[#1D211C] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#8A9A65]" /> Response Actions Executed
          </h2>

          {loading ? (
            <div className="p-8 text-center text-[#62685E] font-mono text-xs">Loading actions...</div>
          ) : responses.length === 0 ? (
            <div className="p-8 text-center glass-pill rounded-xl text-[#62685E] text-xs font-mono">No response actions executed yet.</div>
          ) : (
            <div className="space-y-3">
              {responses.map((action) => (
                <div key={action.id} className="p-4 rounded-xl bg-white border border-[rgba(40,50,35,0.10)] space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#1D211C]">{action.action_type}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      action.status === "EXECUTED" ? "bg-emerald-100 text-emerald-800" :
                      action.status === "APPROVED" ? "bg-blue-100 text-blue-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {action.status}
                    </span>
                  </div>

                  <div className="text-xs text-[#1D211C] font-mono">
                    Target: <strong className="text-[#1D211C]">{action.target}</strong> | Incident: <strong className="text-[#8A9A65]">{action.incident_id}</strong>
                  </div>

                  <p className="text-xs text-[#62685E] leading-snug">{action.reason}</p>

                  {action.execution_details && (
                    <div className="p-2.5 rounded-lg bg-[#E0E7D7]/40 text-[11px] font-mono text-[#1D211C] border border-[#B7C396]/30 space-y-0.5">
                      <div>Target State: <span className="text-rose-800 font-bold">{action.execution_details.target_current_state || "ISOLATED"}</span></div>
                      <div>Approved By: <span className="text-[#1D211C] font-semibold">{action.approved_by || "SOC Lead Analyst"}</span></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Audit Logs */}
        <div className="glass-panel p-6 rounded-2xl space-y-4 bg-white/80 border-[rgba(40,50,35,0.10)]">
          <h2 className="text-base font-bold text-[#1D211C] flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#8A9A65]" /> Immutable Audit Trail
          </h2>

          {loading ? (
            <div className="p-8 text-center text-[#62685E] font-mono text-xs">Loading audit trail...</div>
          ) : (
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3.5 rounded-xl bg-white border border-[rgba(40,50,35,0.10)] space-y-1 font-mono text-xs shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#8A9A65] font-bold">{log.action}</span>
                    <span className="text-[10px] text-[#62685E]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-[#62685E] text-[11px]">Actor: <span className="text-[#1D211C] font-bold">{log.actor}</span></div>
                  <p className="text-[#1D211C] text-[11px] font-sans mt-0.5">{log.details}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
