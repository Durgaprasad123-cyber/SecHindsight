"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Brain, 
  Search, 
  Database, 
  Tag, 
  Sparkles, 
  Clock, 
  ArrowRight,
  Filter,
  ShieldCheck,
  RefreshCw,
  GitCommit,
  CheckCircle2
} from "lucide-react";
import { fetchMemories } from "@/lib/api";
import { HindsightMemory } from "@/lib/types";
import { LoadingSkeleton, ErrorState, EmptyState } from "@/components/ui/StateViews";

export default function MemoryExplorerPage() {
  const [memories, setMemories] = useState<HindsightMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [activeTab, setActiveTab] = useState<"explorer" | "timeline">("explorer");

  const loadMemories = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMemories(categoryFilter || undefined, searchQuery || undefined, 50);
      setMemories(data.memories || []);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to fetch Hindsight memories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemories();
  }, [categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadMemories();
  };

  return (
    <div className="space-y-6 max-w-[1700px] mx-auto pb-12">
      
      {/* Header */}
      <div className="soc-card p-6 border-slate-800 bg-[#1A1A1A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[#0F722A]/20 text-[#10B981] text-xs font-mono font-bold border border-[#0F722A]/40 flex items-center gap-1.5 uppercase">
              <Brain className="w-3.5 h-3.5 text-[#10B981]" /> Organizational Memory Engine
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white font-mono tracking-tight">
            Hindsight Memory Explorer & Learning Timeline
          </h1>
          <p className="text-xs text-slate-400">
            Persistent memory bank <span className="font-mono text-slate-200 font-bold">sechindsight</span> retaining incident experiences, analyst decisions, and lessons learned to optimize copilot triage.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-[#242424] px-3.5 py-2 rounded border border-slate-800 shrink-0">
          <Database className="w-4 h-4 text-[#10B981]" />
          <span className="text-slate-400">Bank ID:</span>
          <span className="text-white font-bold">sechindsight</span>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="soc-card p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#1A1A1A] border-slate-800">
        
        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={() => setActiveTab("explorer")}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
              activeTab === "explorer"
                ? "bg-[#0F722A] text-white font-bold"
                : "bg-[#242424] text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            Memory Explorer
          </button>
          <button
            onClick={() => setActiveTab("timeline")}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
              activeTab === "timeline"
                ? "bg-[#0F722A] text-white font-bold"
                : "bg-[#242424] text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            Learning Timeline
          </button>
        </div>

        {activeTab === "explorer" && (
          <form onSubmit={handleSearchSubmit} className="flex-1 w-full sm:max-w-md flex items-center gap-2 font-mono">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Recall query (e.g. privilege escalation, VPN, unknown device)..."
                className="w-full bg-[#242424] border border-slate-800 rounded pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#0F722A]"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded bg-[#0F722A] hover:bg-[#0B561F] text-white font-bold text-xs cursor-pointer"
            >
              Recall
            </button>
          </form>
        )}

        <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#242424] border border-slate-800 text-xs text-slate-200 rounded px-3 py-1.5 focus:outline-none focus:border-[#0F722A]"
          >
            <option value="">All Categories</option>
            <option value="credential_compromise">Credential Compromise</option>
            <option value="privilege_escalation">Privilege Escalation</option>
            <option value="brute_force">Brute Force</option>
            <option value="phishing">Phishing</option>
            <option value="malware">Malware</option>
          </select>
        </div>

      </div>

      {/* Main Content View */}
      {loading ? (
        <LoadingSkeleton message="Querying Hindsight Cloud memory bank 'sechindsight'..." />
      ) : error ? (
        <ErrorState description={error} onRetry={loadMemories} />
      ) : memories.length === 0 ? (
        <EmptyState
          icon={Brain}
          title="No organizational memories found"
          description="Try resetting your recall query or category filter."
        />
      ) : activeTab === "explorer" ? (
        
        /* MEMORY EXPLORER GRID */
        <div className="space-y-4">
          {memories.map((mem) => {
            const isNewlyRetained = mem.incident_id === "INC-1003";

            return (
              <div
                key={mem.id}
                className={`soc-card p-6 border-slate-800 space-y-4 bg-[#1A1A1A] soc-card-hover ${
                  isNewlyRetained ? "border-[#0F722A] ring-1 ring-[#0F722A]/40" : ""
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3 font-mono">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-100">Source Incident: {mem.incident_id}</span>
                    {mem.similarity_score && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0F722A]/20 text-[#10B981] border border-[#0F722A]/40">
                        SIMILARITY: {mem.similarity_score}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300">
                      {mem.category}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/15 text-emerald-400">
                      {mem.outcome}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#10B981]" /> Retained: {mem.retained_at ? new Date(mem.retained_at).toLocaleDateString() : "Just now"}
                  </div>
                </div>

                {/* Evidence & Decision Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="space-y-1">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">HISTORICAL EVIDENCE SUMMARY:</span>
                    <p className="text-slate-200 leading-relaxed bg-[#242424] p-3 rounded border border-slate-800">
                      {mem.evidence_summary}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">ANALYST DECISION & RESPONSE ACTION:</span>
                    <p className="text-slate-200 leading-relaxed bg-[#242424] p-3 rounded border border-slate-800">
                      Decision: <strong className="text-white">{mem.analyst_decision}</strong> | Response: <strong className="text-teal-400">{mem.response_taken}</strong>
                    </p>
                  </div>
                </div>

                {/* Organizational Lesson Learned */}
                <div className="p-3.5 rounded bg-[#0F722A]/15 border border-[#0F722A]/40 text-xs text-slate-200 flex items-start gap-2.5 font-mono">
                  <Sparkles className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white font-bold block uppercase text-[10px]">ORGANIZATIONAL LESSON LEARNED:</strong>
                    <span>"{mem.lesson_learned}"</span>
                  </div>
                </div>

                {/* Tags */}
                {mem.tags && mem.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 pt-1 font-mono">
                    <Tag className="w-3.5 h-3.5 text-slate-500" />
                    {mem.tags.map((t: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

              </div>
            );
          })}
        </div>

      ) : (

        /* LEARNING TIMELINE VIEW */
        <div className="soc-card p-6 border-slate-800 bg-[#1A1A1A] space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <GitCommit className="w-4.5 h-4.5 text-[#10B981]" /> ORGANIZATIONAL LEARNING TIMELINE
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Chronological sequence of security incidents and their cumulative influence on SecHindsight intelligence.
            </p>
          </div>

          <div className="relative pl-6 space-y-8 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800 font-mono">
            {memories.map((mem, idx) => (
              <div key={mem.id} className="relative space-y-2 group">
                <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-[#0F722A] border-2 border-[#1A1A1A] flex items-center justify-center text-white text-[8px]" />

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[#10B981]">{mem.incident_id}</span>
                  <span className="text-[10px] text-slate-400 uppercase bg-slate-800 px-2 py-0.5 rounded">{mem.category}</span>
                  <span className="text-[10px] font-bold text-emerald-400">{mem.outcome}</span>
                </div>

                <div className="p-3.5 rounded bg-[#242424] border border-slate-800 text-xs space-y-1 max-w-3xl">
                  <div className="text-slate-300 font-sans font-medium">{mem.evidence_summary}</div>
                  <div className="text-[11px] text-teal-400">Lesson: "{mem.lesson_learned}"</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      )}

    </div>
  );
}
