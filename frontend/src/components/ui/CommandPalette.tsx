"use client";

import React, { useState, useEffect, useRef } from "react";
import useRouter from "next/navigation";
import { useRouter as useNextRouter } from "next/navigation";
import { Search, AlertTriangle, Brain, ShieldAlert, X, ArrowRight, CornerDownLeft } from "lucide-react";
import { fetchIncidents, fetchMemories, fetchThreats } from "@/lib/api";
import { Incident, HindsightMemory, MitreTechnique } from "@/lib/types";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useNextRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [memories, setMemories] = useState<HindsightMemory[]>([]);
  const [techniques, setTechniques] = useState<MitreTechnique[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setIncidents([]);
      setMemories([]);
      setTechniques([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const q = query.trim().toLowerCase();
        const [incRes, memRes, threatRes] = await Promise.all([
          fetchIncidents({ limit: 50 }),
          fetchMemories(undefined, q, 10),
          fetchThreats()
        ]);

        // Filter incidents locally
        const matchedInc = (incRes.incidents || []).filter(i => 
          i.id.toLowerCase().includes(q) ||
          i.title.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          (i.source_host && i.source_host.toLowerCase().includes(q)) ||
          (i.user_account && i.user_account.toLowerCase().includes(q)) ||
          (i.ip_address && i.ip_address.toLowerCase().includes(q))
        );

        // Filter techniques locally
        const matchedTech = (threatRes.techniques || []).filter(t => 
          t.id.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q) ||
          t.tactic.toLowerCase().includes(q)
        );

        setIncidents(matchedInc.slice(0, 5));
        setMemories((memRes.memories || []).slice(0, 5));
        setTechniques(matchedTech.slice(0, 5));
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const navigateTo = (url: string) => {
    onClose();
    router.push(url);
  };

  const hasResults = incidents.length > 0 || memories.length > 0 || techniques.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-[#121212]/85 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="soc-card w-full max-w-2xl bg-[#1A1A1A] border-slate-700 shadow-2xl overflow-hidden rounded-xl border">
        
        {/* Search input bar */}
        <div className="p-3.5 border-b border-slate-800 flex items-center gap-3 bg-[#242424]">
          <Search className="w-4 h-4 text-[#10B981]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search incident ID, IP, user, host, category, technique (e.g. INC-1003, jdoe, 192.168.1.105, T1068)..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-slate-500 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800 rounded border border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {loading && (
            <div className="p-6 text-center text-xs font-mono text-slate-400">
              Searching SecHindsight SOC repository...
            </div>
          )}

          {!loading && !query && (
            <div className="p-8 text-center space-y-2">
              <div className="text-xs text-slate-400 font-mono">Quick Search Hints:</div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {["INC-1003", "jdoe", "192.168.1.105", "WORKSTATION-042", "privilege_escalation", "T1068"].map(hint => (
                  <button
                    key={hint}
                    onClick={() => setQuery(hint)}
                    className="px-2.5 py-1 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-[#10B981] rounded border border-slate-700 cursor-pointer"
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loading && query && !hasResults && (
            <div className="p-8 text-center text-xs font-mono text-slate-400">
              No matching incidents, memories, or techniques found for "{query}".
            </div>
          )}

          {!loading && hasResults && (
            <>
              {/* Incidents Group */}
              {incidents.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 px-2">
                    <AlertTriangle className="w-3 h-3 text-[#10B981]" /> Incidents ({incidents.length})
                  </div>
                  {incidents.map((inc) => (
                    <div
                      key={inc.id}
                      onClick={() => navigateTo(`/incidents/${inc.id}`)}
                      className="p-3 rounded-lg bg-[#242424] hover:bg-[#2A2A2A] border border-slate-800 hover:border-[#0F722A]/40 cursor-pointer flex items-center justify-between group transition-all"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span className="font-bold text-slate-100">{inc.id}</span>
                          <span className="text-[10px] uppercase font-bold text-amber-400 px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/20">
                            {inc.severity}
                          </span>
                          <span className="text-slate-400">{inc.category}</span>
                        </div>
                        <p className="text-xs text-slate-300 font-medium">{inc.title}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-[#10B981] group-hover:translate-x-1 transition-all" />
                    </div>
                  ))}
                </div>
              )}

              {/* Hindsight Memory Group */}
              {memories.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 px-2">
                    <Brain className="w-3 h-3 text-[#10B981]" /> Retained Hindsight Memories ({memories.length})
                  </div>
                  {memories.map((mem) => (
                    <div
                      key={mem.id}
                      onClick={() => navigateTo("/memory")}
                      className="p-3 rounded-lg bg-[#242424] hover:bg-[#2A2A2A] border border-slate-800 hover:border-[#0F722A]/40 cursor-pointer flex items-center justify-between group transition-all"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span className="font-bold text-[#10B981]">Source: {mem.incident_id}</span>
                          <span className="text-slate-400">{mem.category}</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-snug">"{mem.lesson_learned}"</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-[#10B981] group-hover:translate-x-1 transition-all" />
                    </div>
                  ))}
                </div>
              )}

              {/* MITRE ATT&CK Group */}
              {techniques.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 px-2">
                    <ShieldAlert className="w-3 h-3 text-[#10B981]" /> MITRE ATT&CK Techniques ({techniques.length})
                  </div>
                  {techniques.map((tech) => (
                    <div
                      key={tech.id}
                      onClick={() => navigateTo("/threats")}
                      className="p-3 rounded-lg bg-[#242424] hover:bg-[#2A2A2A] border border-slate-800 hover:border-[#0F722A]/40 cursor-pointer flex items-center justify-between group transition-all"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span className="font-bold text-red-400">{tech.id}</span>
                          <span className="text-slate-200 font-bold">{tech.name}</span>
                        </div>
                        <p className="text-xs text-slate-400">{tech.tactic}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-[#10B981] group-hover:translate-x-1 transition-all" />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-3 bg-[#121212] border-t border-slate-800 text-[11px] font-mono text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <CornerDownLeft className="w-3 h-3 text-slate-400" />
            <span>Select item to navigate</span>
          </div>
          <span>Press ESC to dismiss</span>
        </div>

      </div>
    </div>
  );
}
