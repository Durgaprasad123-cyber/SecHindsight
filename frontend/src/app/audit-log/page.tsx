"use client";

import React, { useEffect, useState } from "react";
import { 
  FileText, 
  Search, 
  Filter, 
  RefreshCw, 
  Activity, 
  ShieldCheck,
  Brain
} from "lucide-react";
import { fetchAuditLogs } from "@/lib/api";

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await fetchAuditLogs();
      setLogs(data.audit_logs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.actor.toLowerCase().includes(search.toLowerCase()) ||
      (l.incident_id && l.incident_id.toLowerCase().includes(search.toLowerCase())) ||
      l.details.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border-[rgba(40,50,35,0.10)] bg-white/80">
        <div className="space-y-1">
          <span className="px-2.5 py-0.5 rounded-md bg-[#E0E7D7] text-[#1D211C] text-xs font-semibold border border-[#B7C396]/40 font-mono">
            Compliance & Security Audit Trail
          </span>
          <h1 className="text-2xl font-bold text-[#1D211C] flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#8A9A65]" /> Immutable Audit Log
          </h1>
          <p className="text-xs text-[#62685E]">
            Comprehensive ledger of multi-agent operations, Hindsight memory retention events, and human analyst decisions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#62685E] absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search audit logs..."
              className="w-full bg-white border border-[rgba(40,50,35,0.12)] rounded-xl pl-9 pr-4 py-2 text-xs text-[#1D211C] focus:outline-none focus:border-[#8A9A65] font-mono shadow-xs"
            />
          </div>

          <button
            onClick={loadLogs}
            className="p-2 rounded-xl bg-white border border-[rgba(40,50,35,0.12)] text-[#62685E] hover:text-[#1D211C] transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-[#8A9A65] ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Enterprise Audit Log Table */}
      <div className="glass-panel p-5 rounded-2xl border-[rgba(40,50,35,0.10)] bg-white/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[rgba(40,50,35,0.10)] text-[#62685E] font-mono uppercase text-[10px]">
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">Actor</th>
                <th className="py-3 px-3">Action</th>
                <th className="py-3 px-3">Incident</th>
                <th className="py-3 px-3">Result / Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(40,50,35,0.06)] font-mono">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#62685E] text-xs">
                    Loading audit trail...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#62685E] text-xs">
                    No audit records found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#E0E7D7]/30 transition-colors">
                    <td className="py-3 px-3 text-[#62685E] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-bold text-[#1D211C]">
                      {log.actor}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E0E7D7] text-[#1D211C]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-[#8A9A65]">
                      {log.incident_id || "SYSTEM"}
                    </td>
                    <td className="py-3 px-3 text-[#1D211C] font-sans">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
