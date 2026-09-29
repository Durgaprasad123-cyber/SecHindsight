"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  AlertTriangle, 
  ShieldAlert, 
  Brain, 
  CheckCircle2, 
  Zap, 
  ArrowRight, 
  Activity, 
  Search,
  ChevronRight,
  TrendingUp,
  Clock,
  Radio,
  Play
} from "lucide-react";
import { fetchAnalytics, fetchIncidents, fetchMemories, seedDemoData } from "@/lib/api";

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [anData, incData, memData] = await Promise.all([
        fetchAnalytics(),
        fetchIncidents({ limit: 10 }),
        fetchMemories(undefined, undefined)
      ]);
      setAnalytics(anData);
      setIncidents(incData.incidents || []);
      setMemories(memData.memories || []);
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInitialSeed = async () => {
    setLoading(true);
    try {
      await seedDemoData();
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Activity className="w-8 h-8 text-[#8A9A65] animate-spin" />
        <p className="text-xs font-mono text-[#62685E]">Loading SecHindsight SOC Telemetry...</p>
      </div>
    );
  }

  const criticalIncidents = incidents.filter(i => i.severity === "high" || i.severity === "critical");
  const pendingApprovals = incidents.filter(i => i.status === "AWAITING_APPROVAL");

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      
      {/* Top Banner & Hero Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border-[rgba(40,50,35,0.10)] relative overflow-hidden bg-white/80">
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-[#E0E7D7] text-[#1D211C] text-xs font-semibold border border-[#B7C396]/40 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-[#8A9A65] animate-pulse" /> Live SOC Operations
            </span>
            <span className="text-xs text-[#62685E] font-mono">Hindsight Bank: sechindsight</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1D211C] tracking-tight">
            Security Operations & Organizational Memory Dashboard
          </h1>
          <p className="text-xs text-[#62685E] max-w-3xl">
            Defensive AI copilot retaining every incident outcome to refine future triage, threat analysis, and automated response decisions.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10 shrink-0">
          {incidents.length === 0 ? (
            <button
              onClick={handleInitialSeed}
              className="px-4 py-2 rounded-xl bg-[#8A9A65] text-white font-bold text-xs shadow-xs hover:bg-[#788855] transition-all flex items-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-white text-white" /> Seed SOC Telemetry
            </button>
          ) : (
            <Link
              href="/demo"
              className="px-4 py-2 rounded-xl bg-[#1D211C] text-white font-bold text-xs shadow-xs hover:bg-[#283029] transition-all flex items-center gap-2"
            >
              <Play className="w-4 h-4 text-white fill-white" /> Master Demo (4 Incidents)
            </Link>
          )}
        </div>
      </div>

      {/* Compact Bento Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="glass-panel p-4 rounded-2xl glass-panel-hover space-y-1.5 bg-white/80">
          <div className="flex items-center justify-between text-[#62685E] text-xs font-semibold">
            <span>Total Active Incidents</span>
            <AlertTriangle className="w-4 h-4 text-[#8A9A65]" />
          </div>
          <div className="text-2xl font-bold text-[#1D211C] font-mono">{analytics?.metrics?.total_incidents || incidents.length || 0}</div>
          <div className="text-[11px] text-[#62685E] flex items-center gap-1 font-mono">
            <TrendingUp className="w-3 h-3 text-[#8A9A65]" /> Real-time Ingestion
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl glass-panel-hover space-y-1.5 bg-white/80 border-rose-200">
          <div className="flex items-center justify-between text-[#62685E] text-xs font-semibold">
            <span>Critical / High Alerts</span>
            <ShieldAlert className="w-4 h-4 text-rose-700" />
          </div>
          <div className="text-2xl font-bold text-rose-800 font-mono">{criticalIncidents.length}</div>
          <div className="text-[11px] text-rose-900/80">Requires Analyst Review</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl glass-panel-hover space-y-1.5 bg-white/80 border-amber-200">
          <div className="flex items-center justify-between text-[#62685E] text-xs font-semibold">
            <span>Awaiting Human Approval</span>
            <Zap className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-2xl font-bold text-amber-800 font-mono">{pendingApprovals.length}</div>
          <div className="text-[11px] text-amber-900/80">Defensive Response Queued</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl glass-panel-hover space-y-1.5 bg-white/80 border-[#B7C396]/50">
          <div className="flex items-center justify-between text-[#62685E] text-xs font-semibold">
            <span>Hindsight Memories</span>
            <Brain className="w-4 h-4 text-[#8A9A65]" />
          </div>
          <div className="text-2xl font-bold text-[#1D211C] font-mono">{memories.length}</div>
          <div className="text-[11px] text-[#62685E]">Retained Incident Experiences</div>
        </div>

      </div>

      {/* Main Grid: Incident Queue Table & Retained Hindsight Memories */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 8 Cols: Incident Queue Table */}
        <div className="lg:col-span-8 glass-panel p-5 rounded-2xl space-y-4 bg-white/80 border-[rgba(40,50,35,0.10)]">
          <div className="flex items-center justify-between border-b border-[rgba(40,50,35,0.08)] pb-3">
            <div>
              <h2 className="text-base font-bold text-[#1D211C] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#8A9A65]" /> Active Incident Queue
              </h2>
              <p className="text-xs text-[#62685E]">Select an incident to launch investigation & Hindsight memory recall</p>
            </div>
            <Link href="/incidents" className="text-xs text-[#8A9A65] font-semibold hover:underline flex items-center gap-1">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[rgba(40,50,35,0.08)] text-[#62685E] font-mono uppercase text-[10px]">
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Incident ID</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Target Host</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(40,50,35,0.05)]">
                {incidents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#62685E] font-mono text-xs">
                      No incidents loaded. Click "Seed SOC Telemetry" above to seed demo incidents.
                    </td>
                  </tr>
                ) : (
                  incidents.map((inc) => (
                    <tr key={inc.id} className="hover:bg-[#E0E7D7]/30 transition-colors">
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          inc.severity === "critical" ? "bg-rose-100 text-rose-800" :
                          inc.severity === "high" ? "bg-amber-100 text-amber-900" :
                          inc.severity === "medium" ? "bg-blue-100 text-blue-900" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {inc.severity}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-[#1D211C]">
                        <Link href={`/incidents/${inc.id}`} className="hover:underline">
                          {inc.id}
                        </Link>
                      </td>
                      <td className="py-3 px-3 font-mono text-[#62685E]">
                        {inc.category}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white border border-[rgba(40,50,35,0.12)] text-[#1D211C]">
                          {inc.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[#62685E]">
                        {inc.source_host || inc.user_account || "N/A"}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          href={`/incidents/${inc.id}`}
                          className="px-2.5 py-1 rounded-lg bg-[#8A9A65] text-white font-semibold text-[11px] hover:bg-[#788855] inline-block"
                        >
                          Investigate
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 4 Cols: Retained Hindsight Memory Activity */}
        <div className="lg:col-span-4 glass-panel p-5 rounded-2xl space-y-4 bg-white/80 border-[rgba(40,50,35,0.10)]">
          <div className="flex items-center justify-between border-b border-[rgba(40,50,35,0.08)] pb-3">
            <h2 className="text-base font-bold text-[#1D211C] flex items-center gap-2">
              <Brain className="w-4 h-4 text-[#8A9A65]" /> Hindsight Memory Pulse
            </h2>
            <Link href="/memory" className="text-xs text-[#8A9A65] font-semibold hover:underline flex items-center gap-1">
              Explorer <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <p className="text-xs text-[#62685E]">
            Recent outcomes retained in organizational memory bank <span className="font-mono text-[#1D211C]">sechindsight</span>.
          </p>

          <div className="space-y-3">
            {memories.length === 0 ? (
              <div className="p-6 text-center text-[#62685E] text-xs font-mono bg-white/50 rounded-xl border border-dashed border-[rgba(40,50,35,0.12)]">
                Memory bank initializing...
              </div>
            ) : (
              memories.slice(0, 4).map((mem) => (
                <div key={mem.id} className="p-3.5 rounded-xl bg-white border border-[rgba(40,50,35,0.10)] space-y-1.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-[#8A9A65] font-bold">Source: {mem.incident_id}</span>
                    <span className="px-2 py-0.5 text-[10px] rounded bg-[#E0E7D7] text-[#1D211C] font-mono font-bold">
                      {mem.outcome}
                    </span>
                  </div>
                  <p className="text-xs text-[#1D211C] font-medium leading-snug">
                    "{mem.lesson_learned}"
                  </p>
                  <div className="text-[10px] text-[#62685E] font-mono">
                    Category: {mem.category}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
