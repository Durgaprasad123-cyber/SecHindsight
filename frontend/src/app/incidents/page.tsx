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
  Brain,
  X,
  PlusCircle
} from "lucide-react";
import { fetchIncidents, createIncident } from "@/lib/api";
import { Incident, IncidentSeverity, IncidentStatus } from "@/lib/types";
import { StatusBadge, SeverityBadge } from "@/components/ui/StatusBadge";
import { LoadingSkeleton, ErrorState, EmptyState } from "@/components/ui/StateViews";

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filterSeverity, setFilterSeverity] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New incident form state
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState("credential_compromise");
  const [newSeverity, setNewSeverity] = useState<IncidentSeverity>("high");
  const [newHost, setNewHost] = useState("WORKSTATION-042");
  const [newUser, setNewUser] = useState("jdoe");
  const [newIp, setNewIp] = useState("192.168.1.105");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchIncidents({
        severity: filterSeverity || undefined,
        category: filterCategory || undefined,
        status: filterStatus || undefined,
        limit: 100,
      });
      setIncidents(data.incidents || []);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to load incidents queue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterSeverity, filterCategory, filterStatus]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createIncident({
        title: newTitle,
        description: newDesc,
        category: newCategory,
        severity: newSeverity,
        source_host: newHost,
        user_account: newUser,
        ip_address: newIp,
      });
      setShowCreateModal(false);
      setNewTitle("");
      setNewDesc("");
      loadData();
    } catch (err: any) {
      alert(err?.message || "Error ingesting alert.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredIncidents = incidents.filter((inc) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      inc.id.toLowerCase().includes(q) ||
      inc.title.toLowerCase().includes(q) ||
      inc.category.toLowerCase().includes(q) ||
      (inc.source_host && inc.source_host.toLowerCase().includes(q)) ||
      (inc.user_account && inc.user_account.toLowerCase().includes(q)) ||
      (inc.ip_address && inc.ip_address.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-[1700px] mx-auto pb-12">
      
      {/* Page Header */}
      <div className="soc-card p-6 border-slate-800 bg-[#1A1A1A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-[#0F722A]/20 text-[#10B981] text-xs font-mono font-bold border border-[#0F722A]/40 uppercase">
              Operations Workstation
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white font-mono flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-[#10B981]" /> Incident Queue & Operations Console
          </h1>
          <p className="text-xs text-slate-400">
            Real-time cybersecurity alert ingestion mapped to multi-agent investigation & Hindsight memory recall.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded bg-[#0F722A] hover:bg-[#0B561F] text-white font-mono font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0 border border-[#0F722A]"
        >
          <PlusCircle className="w-4 h-4 text-white" /> Ingest Custom Alert
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="soc-card p-4 rounded-lg flex flex-wrap items-center justify-between gap-4 bg-[#1A1A1A] border-slate-800">
        
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Text Search */}
          <div className="relative min-w-[240px] flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID, title, host, user, IP..."
              className="w-full bg-[#242424] border border-slate-800 rounded pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#0F722A] font-mono"
            />
          </div>

          <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />

          {/* Severity Filter */}
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-[#242424] border border-slate-800 text-xs text-slate-200 rounded px-3 py-1.5 focus:outline-none focus:border-[#0F722A] font-mono"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-[#242424] border border-slate-800 text-xs text-slate-200 rounded px-3 py-1.5 focus:outline-none focus:border-[#0F722A] font-mono"
          >
            <option value="">All Categories</option>
            <option value="credential_compromise">Credential Compromise</option>
            <option value="privilege_escalation">Privilege Escalation</option>
            <option value="brute_force">Brute Force</option>
            <option value="phishing">Phishing</option>
            <option value="malware">Malware</option>
            <option value="data_exfiltration">Data Exfiltration</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#242424] border border-slate-800 text-xs text-slate-200 rounded px-3 py-1.5 focus:outline-none focus:border-[#0F722A] font-mono"
          >
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="AWAITING_APPROVAL">Awaiting Approval</option>
            <option value="CONTAINED">Contained</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <button
          onClick={loadData}
          className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#10B981] ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Incidents Data Table */}
      {loading ? (
        <LoadingSkeleton message="Fetching incidents queue telemetry..." />
      ) : error ? (
        <ErrorState description={error} onRetry={loadData} />
      ) : filteredIncidents.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="No incidents match filter"
          description="Try resetting your filters or search query."
          actionLabel="Clear Filters"
          onAction={() => {
            setFilterSeverity("");
            setFilterCategory("");
            setFilterStatus("");
            setSearchQuery("");
          }}
        />
      ) : (
        <div className="soc-card p-5 border-slate-800 bg-[#1A1A1A]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-3">Severity</th>
                  <th className="py-3 px-3">Incident ID</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Title / Summary</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Host / User</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredIncidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-[#242424] transition-colors group">
                    <td className="py-3.5 px-3">
                      <SeverityBadge severity={inc.severity} />
                    </td>
                    <td className="py-3.5 px-3 font-bold text-slate-100">
                      <Link href={`/incidents/${inc.id}`} className="hover:text-[#10B981] transition-colors">
                        {inc.id}
                      </Link>
                    </td>
                    <td className="py-3.5 px-3 text-slate-300">
                      {inc.category}
                    </td>
                    <td className="py-3.5 px-3 text-slate-200 font-sans max-w-md truncate">
                      <span className="font-semibold text-slate-100 group-hover:text-[#10B981] transition-colors">
                        {inc.title}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <StatusBadge status={inc.status} />
                    </td>
                    <td className="py-3.5 px-3 text-slate-300">
                      {inc.source_host || inc.user_account || "N/A"}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <Link
                        href={`/incidents/${inc.id}`}
                        className="px-3 py-1.5 rounded bg-[#0F722A] hover:bg-[#0B561F] text-white font-bold text-xs inline-flex items-center gap-1 transition-colors"
                      >
                        <span>Investigate</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ingest Alert Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#121212]/85 backdrop-blur-sm p-4">
          <div className="soc-card p-6 max-w-lg w-full space-y-4 border-slate-700 bg-[#1A1A1A] shadow-2xl relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-[#10B981]" /> Ingest Custom Telemetry Alert
            </h2>

            <form onSubmit={handleCreate} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Alert Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Suspicious Token impersonation on DC-01"
                  className="w-full bg-[#242424] border border-slate-700 rounded p-2.5 text-slate-100 focus:outline-none focus:border-[#0F722A]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Alert Description / Raw Telemetry</label>
                <textarea
                  required
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Provide raw logs or alert telemetry details..."
                  className="w-full bg-[#242424] border border-slate-700 rounded p-2.5 text-slate-100 focus:outline-none focus:border-[#0F722A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-[#242424] border border-slate-700 rounded p-2 text-slate-100 focus:outline-none focus:border-[#0F722A]"
                  >
                    <option value="credential_compromise">Credential Compromise</option>
                    <option value="privilege_escalation">Privilege Escalation</option>
                    <option value="brute_force">Brute Force</option>
                    <option value="phishing">Phishing</option>
                    <option value="malware">Malware</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Severity</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as IncidentSeverity)}
                    className="w-full bg-[#242424] border border-slate-700 rounded p-2 text-slate-100 focus:outline-none focus:border-[#0F722A]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 text-[10px] mb-1">Host</label>
                  <input
                    type="text"
                    value={newHost}
                    onChange={(e) => setNewHost(e.target.value)}
                    className="w-full bg-[#242424] border border-slate-700 rounded p-2 text-slate-100 focus:outline-none focus:border-[#0F722A]"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] mb-1">User</label>
                  <input
                    type="text"
                    value={newUser}
                    onChange={(e) => setNewUser(e.target.value)}
                    className="w-full bg-[#242424] border border-slate-700 rounded p-2 text-slate-100 focus:outline-none focus:border-[#0F722A]"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] mb-1">IP</label>
                  <input
                    type="text"
                    value={newIp}
                    onChange={(e) => setNewIp(e.target.value)}
                    className="w-full bg-[#242424] border border-slate-700 rounded p-2 text-slate-100 focus:outline-none focus:border-[#0F722A]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded bg-[#0F722A] hover:bg-[#0B561F] text-white font-bold text-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Ingesting..." : "Submit Alert"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
