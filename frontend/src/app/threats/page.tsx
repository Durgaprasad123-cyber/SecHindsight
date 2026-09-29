"use client";

import React, { useEffect, useState } from "react";
import { 
  ShieldAlert, 
  Search, 
  BookOpen, 
  ShieldCheck, 
  ExternalLink,
  Cpu
} from "lucide-react";
import { fetchThreats } from "@/lib/api";

export default function ThreatsPage() {
  const [techniques, setTechniques] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchThreats()
      .then((res) => setTechniques(res.techniques || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = techniques.filter(
    (t) =>
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.tactic.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border-[rgba(40,50,35,0.10)] bg-white/80">
        <div className="space-y-1">
          <span className="px-2.5 py-0.5 rounded-md bg-[#E0E7D7] text-[#1D211C] text-xs font-semibold border border-[#B7C396]/40 font-mono">
            Cybersecurity Knowledge Base
          </span>
          <h1 className="text-2xl font-bold text-[#1D211C] flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-700" /> MITRE ATT&CK Threat Intelligence
          </h1>
          <p className="text-xs text-[#62685E]">
            Verified adversarial tactics, techniques, detection telemetry, and defensive mitigations.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-[#62685E] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search MITRE techniques..."
            className="w-full bg-white border border-[rgba(40,50,35,0.12)] rounded-xl pl-9 pr-4 py-2 text-xs text-[#1D211C] focus:outline-none focus:border-[#8A9A65] font-mono shadow-xs"
          />
        </div>
      </div>

      {/* Grid of Techniques */}
      {loading ? (
        <div className="p-12 text-center text-[#62685E] font-mono text-xs">
          Loading MITRE ATT&CK Database...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((tech) => (
            <div key={tech.id} className="glass-panel p-6 rounded-2xl border-[rgba(40,50,35,0.10)] space-y-3 glass-panel-hover bg-white/80">
              <div className="flex items-center justify-between border-b border-[rgba(40,50,35,0.08)] pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-rose-800 bg-rose-100 px-2.5 py-1 rounded">
                    {tech.id}
                  </span>
                  <h2 className="text-sm font-bold text-[#1D211C]">{tech.name}</h2>
                </div>
                <span className="text-xs font-mono text-[#62685E] bg-[#EDECEC] px-2.5 py-1 rounded">
                  {tech.tactic}
                </span>
              </div>

              <p className="text-xs text-[#1D211C] leading-relaxed">
                {tech.description}
              </p>

              <div className="space-y-2 pt-2 border-t border-[rgba(40,50,35,0.08)] text-xs font-mono">
                <div className="p-3 rounded-xl bg-white border border-[rgba(40,50,35,0.10)]">
                  <strong className="text-[#8A9A65] block mb-1">Detection Strategy:</strong>
                  <span className="text-[#1D211C] font-sans text-xs">{tech.detection}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#E0E7D7]/40 border border-[#B7C396]/40">
                  <strong className="text-emerald-800 block mb-1">Defensive Mitigation:</strong>
                  <span className="text-[#1D211C] font-sans text-xs">{tech.mitigation}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
