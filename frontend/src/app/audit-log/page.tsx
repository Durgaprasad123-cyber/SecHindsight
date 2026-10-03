"use client";

import React, { useEffect, useState } from "react";
import { 
  FileText, 
  Search, 
  Filter, 
  RefreshCw, 
  Activity, 
  ShieldCheck,
  Brain,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { fetchAuditLogs } from "@/lib/api";
import { AuditLog } from "@/lib/types";
import { LoadingSkeleton, ErrorState, EmptyState } from "@/components/ui/StateViews";

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAuditLogs({ limit: 100 });
      setLogs(data.audit_logs || []);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      !search.trim() ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.actor.toLowerCase().includes(search.toLowerCase()) ||
      (l.incident_id && l.incident_id.toLowerCase().includes(search.toLowerCase())) ||
      l.details.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1700px] mx-auto pb-12">
      
      {/* Header */}
      <div className="soc-card p-6 border-slate-800 bg-[#1A1A1A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-[#0F722A]/20 text-[#10B981] text-xs font-mono font-bold border border-[#0F722A]/40 uppercase">
              Application Audit Log
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white font-mono flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#10B981]" /> Operational Application Audit Trail
          </h1>
          <p className="text-xs text-slate-400">
            Append-only record of multi-agent investigation runs, Hindsight memory retentions, and human analyst choices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search audit logs..."
              className="w-full bg-[#242424] border border-slate-800 rounded pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#0F722A] font-mono"
            />
          </div>

          <button
            onClick={loadLogs}
            className="p-2 rounded bg-[#242424] border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Refresh Audit Logs"
          >
            <RefreshCw className={`w-4 h-4 text-[#10B981] ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Audit Log Data Table */}
      {loading ? (
        <LoadingSkeleton message="Fetching application audit log ledger..." />
      ) : error ? (
        <ErrorState description={error} onRetry={loadLogs} />
      ) : filteredLogs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No audit events found"
          description="No log events match current search query."
        />
      ) : (
        <div className="soc-card p-5 border-slate-800 bg-[#1A1A1A]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-3">Actor</th>
                  <th className="py-3 px-3">Action</th>
                  <th className="py-3 px-3">Incident ID</th>
                  <th className="py-3 px-3">Details Summary</th>
                  <th className="py-3 px-3 text-right">Expand</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLogs.map((log) => {
                  const isExpanded = expandedId === log.id;

                  return (
                    <React.Fragment key={log.id}>
                      <tr 
                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                        className="hover:bg-[#242424] transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : "N/A"}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-100">
                          {log.actor}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0F722A]/20 text-[#10B981] border border-[#0F722A]/40">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-[#10B981]">
                          {log.incident_id || "SYSTEM"}
                        </td>
                        <td className="py-3 px-3 text-slate-300 font-sans max-w-md truncate">
                          {log.details}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-500">
                          {isExpanded ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-[#242424]/70">
                          <td colSpan={6} className="p-4 border-b border-slate-800">
                            <div className="space-y-2 font-mono text-xs text-slate-200">
                              <div className="text-[#10B981] font-bold">Audit Event Log Details (ID: {log.id}):</div>
                              <p className="p-3 bg-[#121212] rounded border border-slate-800 font-sans leading-relaxed">
                                {log.details}
                              </p>
                              <div className="text-[11px] text-slate-400">
                                Recorded At: {log.timestamp} | Actor System: {log.actor} | Correlation Incident: {log.incident_id || "N/A"}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
