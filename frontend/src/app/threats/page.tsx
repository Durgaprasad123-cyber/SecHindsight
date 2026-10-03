"use client";

import React, { useEffect, useState } from "react";
import { 
  ShieldAlert, 
  Search, 
  BookOpen, 
  ShieldCheck, 
  ExternalLink,
  Cpu,
  Filter,
  RefreshCw
} from "lucide-react";
import { fetchThreats } from "@/lib/api";
import { MitreTechnique } from "@/lib/types";
import { LoadingSkeleton, ErrorState, EmptyState } from "@/components/ui/StateViews";

export default function ThreatsPage() {
  const [techniques, setTechniques] = useState<MitreTechnique[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [search, setSearch] = useState("");
  const [tacticFilter, setTacticFilter] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchThreats();
      setTechniques(res.techniques || []);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to load MITRE ATT&CK threat intelligence.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = techniques.filter((t) => {
    const matchesSearch =
      !search.trim() ||
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.tactic.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());

    const matchesTactic = !tacticFilter || t.tactic.toLowerCase() === tacticFilter.toLowerCase();
    return matchesSearch && matchesTactic;
  });

  const tactics = Array.from(new Set(techniques.map(t => t.tactic)));

  return (
    <div className="space-y-6 max-w-[1700px] mx-auto pb-12">
      
      {/* Header */}
      <div className="soc-card p-6 border-slate-800 bg-[#1A1A1A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-[#0F722A]/20 text-[#10B981] text-xs font-mono font-bold border border-[#0F722A]/40 uppercase">
              Threat Intelligence Library
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white font-mono flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-400" /> MITRE ATT&CK Threat Knowledge Base
          </h1>
          <p className="text-xs text-slate-400">
            Adversarial tactics, techniques, detection strategy telemetry, and defensive mitigations.
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2.5 rounded bg-[#242424] text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors"
          title="Refresh Threat Matrix"
        >
          <RefreshCw className={`w-4 h-4 text-[#10B981] ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="soc-card p-4 rounded-lg flex flex-wrap items-center justify-between gap-4 bg-[#1A1A1A] border-slate-800">
        
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[240px] flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search MITRE techniques (e.g. T1068, Privilege Escalation)..."
              className="w-full bg-[#242424] border border-slate-800 rounded pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#0F722A] font-mono"
            />
          </div>

          <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />

          <select
            value={tacticFilter}
            onChange={(e) => setTacticFilter(e.target.value)}
            className="bg-[#242424] border border-slate-800 text-xs text-slate-200 rounded px-3 py-1.5 focus:outline-none focus:border-[#0F722A] font-mono"
          >
            <option value="">All Tactics</option>
            {tactics.map(tac => (
              <option key={tac} value={tac}>{tac}</option>
            ))}
          </select>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Showing <span className="text-white font-bold">{filtered.length}</span> of {techniques.length} techniques
        </div>
      </div>

      {/* Techniques Grid */}
      {loading ? (
        <LoadingSkeleton message="Fetching MITRE ATT&CK database..." />
      ) : error ? (
        <ErrorState description={error} onRetry={loadData} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="No techniques found"
          description="Try clearing your search query or tactic filter."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((tech) => (
            <div key={tech.id} className="soc-card p-5 border-slate-800 space-y-3 bg-[#1A1A1A] soc-card-hover font-mono">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-red-400 bg-red-500/15 border border-red-500/30 px-2.5 py-1 rounded">
                    {tech.id}
                  </span>
                  <h2 className="text-sm font-bold text-white font-sans">{tech.name}</h2>
                </div>
                <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded border border-slate-700">
                  {tech.tactic}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {tech.description}
              </p>

              <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                <div className="p-3 rounded bg-[#242424] border border-slate-800">
                  <strong className="text-[#10B981] block mb-1 uppercase text-[10px]">Detection Strategy:</strong>
                  <span className="text-slate-300 font-sans text-xs">{tech.detection}</span>
                </div>
                <div className="p-3 rounded bg-[#242424] border border-slate-800">
                  <strong className="text-emerald-400 block mb-1 uppercase text-[10px]">Defensive Mitigation:</strong>
                  <span className="text-slate-300 font-sans text-xs">{tech.mitigation}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
