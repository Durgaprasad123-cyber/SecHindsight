"use client";

import React, { useEffect, useState } from "react";
import { 
  Brain, 
  Search, 
  Database, 
  Tag, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  ArrowRight,
  Filter,
  ShieldCheck
} from "lucide-react";
import { fetchMemories } from "@/lib/api";

export default function MemoryExplorerPage() {
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const loadMemories = async () => {
    setLoading(true);
    try {
      const data = await fetchMemories(categoryFilter || undefined, searchQuery || undefined);
      setMemories(data.memories || []);
    } catch (e) {
      console.error(e);
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
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border-[rgba(40,50,35,0.10)] bg-white/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-[#E0E7D7] text-[#1D211C] text-xs font-semibold border border-[#B7C396]/40 flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-[#8A9A65]" /> Organizational Hindsight Memory Layer
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#1D211C] tracking-tight">
            Hindsight Memory Explorer
          </h1>
          <p className="text-xs text-[#62685E]">
            Persistent organizational memory bank <span className="font-mono font-semibold text-[#1D211C]">sechindsight</span> retaining historical incident experiences, lessons learned, and analyst choices.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-white/90 px-3 py-2 rounded-xl border border-[rgba(40,50,35,0.10)] shrink-0 shadow-xs">
          <Database className="w-4 h-4 text-[#8A9A65]" />
          <span className="text-[#62685E]">Bank ID:</span>
          <span className="text-[#1D211C] font-bold">sechindsight</span>
        </div>
      </div>

      {/* Search & Filter controls */}
      <div className="glass-panel p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/80 border-[rgba(40,50,35,0.10)]">
        
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#62685E] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search organizational memories (e.g. privilege escalation, VPN, unknown device)..."
              className="w-full bg-white border border-[rgba(40,50,35,0.12)] rounded-xl pl-9 pr-4 py-2 text-xs text-[#1D211C] focus:outline-none focus:border-[#8A9A65] shadow-xs"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-[#8A9A65] text-white font-bold text-xs hover:bg-[#788855] cursor-pointer shrink-0"
          >
            Recall Query
          </button>
        </form>

        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-3.5 h-3.5 text-[#62685E]" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white border border-[rgba(40,50,35,0.12)] text-xs text-[#1D211C] rounded-xl px-3 py-2 focus:outline-none focus:border-[#8A9A65] font-mono shadow-xs"
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

      {/* Memory Cards Grid / List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-[#62685E] font-mono text-xs">
            Querying Hindsight Cloud Memory bank...
          </div>
        ) : memories.length === 0 ? (
          <div className="p-12 text-center glass-panel rounded-2xl text-[#62685E] text-sm bg-white/80">
            No memories match the specified query criteria.
          </div>
        ) : (
          memories.map((mem) => {
            const isINC1003 = mem.incident_id === "INC-1003";

            return (
              <div
                key={mem.id}
                className={`glass-panel p-6 rounded-2xl space-y-3 glass-panel-hover bg-white/80 border-[rgba(40,50,35,0.12)] ${
                  isINC1003 ? "ring-2 ring-[#8A9A65]/50 bg-gradient-to-r from-white via-white to-[#E0E7D7]/30" : ""
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[rgba(40,50,35,0.08)] pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm text-[#1D211C] font-bold">Source Incident: {mem.incident_id}</span>
                    {isINC1003 && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E0E7D7] text-[#1D211C] border border-[#B7C396]/50">
                        NEWLY RETAINED IN DEMO
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 rounded text-xs font-mono bg-[#EDECEC] text-[#1D211C]">
                      {mem.category}
                    </span>
                    <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-emerald-100 text-emerald-800">
                      {mem.outcome}
                    </span>
                  </div>

                  <div className="text-[11px] font-mono text-[#62685E] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#8A9A65]" /> Retained: {mem.retained_at ? new Date(mem.retained_at).toLocaleDateString() : "Just now"}
                  </div>
                </div>

                {/* Evidence & Decision Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-[#62685E] font-medium block">Historical Evidence Summary:</span>
                    <p className="text-[#1D211C] leading-relaxed bg-white/90 p-3 rounded-xl border border-[rgba(40,50,35,0.08)] font-mono">
                      {mem.evidence_summary}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[#62685E] font-medium block">Analyst Decision & Response Action:</span>
                    <p className="text-[#1D211C] leading-relaxed bg-white/90 p-3 rounded-xl border border-[rgba(40,50,35,0.08)] font-mono">
                      Decision: <strong>{mem.analyst_decision}</strong> | Response: <strong>{mem.response_taken}</strong>
                    </p>
                  </div>
                </div>

                {/* Organizational Lesson Learned */}
                <div className="p-3.5 rounded-xl bg-[#E0E7D7]/50 border border-[#B7C396]/40 text-xs text-[#1D211C] flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-[#8A9A65] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#1D211C] font-semibold block">Organizational Lesson Learned:</strong>
                    <span>"{mem.lesson_learned}"</span>
                  </div>
                </div>

                {/* Tags */}
                {mem.tags && mem.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <Tag className="w-3.5 h-3.5 text-[#62685E]" />
                    {mem.tags.map((t: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#EDECEC] text-[#1D211C]">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
