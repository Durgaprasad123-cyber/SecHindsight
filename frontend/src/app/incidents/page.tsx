"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter, 
  ChevronRight, 
  RefreshCw,
  ShieldCheck,
  Brain
} from "lucide-react";
import { fetchIncidents, createIncident } from "@/lib/api";

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New incident form state
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState("credential_compromise");
  const [newSeverity, setNewSeverity] = useState("high");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchIncidents({
        severity: filterSeverity || undefined,
        category: filterCategory || undefined,
      });
      setIncidents(data.incidents || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterSeverity, filterCategory]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createIncident({
        title: newTitle,
        description: newDesc,
        category: newCategory,
        severity: newSeverity,
      });
      setShowCreateModal(false);
      setNewTitle("");
      setNewDesc("");
      loadData();
    } catch (err) {
      alert("Error creating incident");
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border-[rgba(40,50,35,0.10)] bg-white/80">
        <div>
          <h1 className="text-2xl font-bold text-[#1D211C] flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-[#8A9A65]" /> SOC Incident Queue
          </h1>
          <p className="text-xs text-[#62685E]">
            Real-time cybersecurity alerts mapped to multi-agent investigation & Hindsight memory recall
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-xl bg-[#8A9A65] text-white font-bold text-xs shadow-xs hover:bg-[#788855] transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> Ingest Custom Alert
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 bg-white/80 border-[rgba(40,50,35,0.10)]">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-[#62685E]" />
          <span className="text-xs font-mono text-[#1D211C] font-semibold">Filters:</span>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-white border border-[rgba(40,50,35,0.12)] text-xs text-[#1D211C] rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#8A9A65] font-mono shadow-xs"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-white border border-[rgba(40,50,35,0.12)] text-xs text-[#1D211C] rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#8A9A65] font-mono shadow-xs"
          >
            <option value="">All Categories</option>
            <option value="credential_compromise">Credential Compromise</option>
            <option value="privilege_escalation">Privilege Escalation</option>
            <option value="brute_force">Brute Force</option>
            <option value="phishing">Phishing</option>
            <option value="malware">Malware / Ransomware</option>
            <option value="data_exfiltration">Data Exfiltration</option>
          </select>
        </div>

        <button
          onClick={loadData}
          className="text-xs text-[#62685E] hover:text-[#1D211C] flex items-center gap-1 cursor-pointer font-medium"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#8A9A65]" /> Refresh Queue
        </button>
      </div>

      {/* Incidents Table / List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-[#62685E] text-xs font-mono">
            Fetching incidents queue...
          </div>
        ) : incidents.length === 0 ? (
          <div className="p-12 text-center glass-panel rounded-2xl text-[#62685E] text-sm bg-white/80">
            No incidents match current filter criteria.
          </div>
        ) : (
          incidents.map((inc) => (
            <Link
              key={inc.id}
              href={`/incidents/${inc.id}`}
              className="block glass-panel p-5 rounded-xl glass-panel-hover border-[rgba(40,50,35,0.10)] space-y-3 group bg-white/80"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-[#1D211C] font-bold">{inc.id}</span>
                  <span className={`px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${
                    inc.severity === "critical" ? "bg-rose-100 text-rose-800" :
                    inc.severity === "high" ? "bg-amber-100 text-amber-900" :
                    inc.severity === "medium" ? "bg-blue-100 text-blue-900" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {inc.severity}
                  </span>
                  <span className="px-2.5 py-0.5 rounded text-xs font-mono bg-[#EDECEC] text-[#1D211C]">
                    {inc.status}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono text-[#62685E]">
                  <span>Host: <strong className="text-[#1D211C]">{inc.source_host || "N/A"}</strong></span>
                  <span>User: <strong className="text-[#1D211C]">{inc.user_account || "N/A"}</strong></span>
                  <span className="text-[#8A9A65] font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Investigate <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold text-[#1D211C] group-hover:text-[#8A9A65] transition-colors">
                  {inc.title}
                </h3>
                <p className="text-xs text-[#62685E] mt-1 leading-relaxed">
                  {inc.description}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1D211C]/40 backdrop-blur-md p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-lg w-full space-y-4 border border-[rgba(40,50,35,0.15)] bg-white">
            <h2 className="text-lg font-bold text-[#1D211C] flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#8A9A65]" /> Ingest Custom Telemetry Alert
            </h2>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#1D211C] font-semibold mb-1">Alert Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Suspicious Token impersonation on DC-01"
                  className="w-full bg-white border border-[rgba(40,50,35,0.15)] rounded-lg p-2.5 text-[#1D211C] focus:outline-none focus:border-[#8A9A65]"
                />
              </div>

              <div>
                <label className="block text-[#1D211C] font-semibold mb-1">Raw Description / Telemetry</label>
                <textarea
                  required
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Provide logs or alert details..."
                  className="w-full bg-white border border-[rgba(40,50,35,0.15)] rounded-lg p-2.5 text-[#1D211C] focus:outline-none focus:border-[#8A9A65]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#1D211C] font-semibold mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-white border border-[rgba(40,50,35,0.15)] rounded-lg p-2 text-[#1D211C] focus:outline-none focus:border-[#8A9A65] font-mono"
                  >
                    <option value="credential_compromise">Credential Compromise</option>
                    <option value="privilege_escalation">Privilege Escalation</option>
                    <option value="brute_force">Brute Force</option>
                    <option value="phishing">Phishing</option>
                    <option value="malware">Malware</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#1D211C] font-semibold mb-1">Initial Severity</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value)}
                    className="w-full bg-white border border-[rgba(40,50,35,0.15)] rounded-lg p-2 text-[#1D211C] focus:outline-none focus:border-[#8A9A65] font-mono"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-[#EDECEC] text-[#1D211C] hover:bg-gray-200 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#8A9A65] text-white font-bold text-xs hover:bg-[#788855] cursor-pointer"
                >
                  Submit Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
