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
  Play,
  ShieldCheck,
  RefreshCw,
  Cpu
} from "lucide-react";
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip 
} from "recharts";
import { fetchAnalytics, fetchIncidents, fetchMemories, seedDemoData } from "@/lib/api";
import { AnalyticsData, Incident, HindsightMemory } from "@/lib/types";
import { StatusBadge, SeverityBadge } from "@/components/ui/StatusBadge";
import { LoadingSkeleton, ErrorState, EmptyState } from "@/components/ui/StateViews";

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [memories, setMemories] = useState<HindsightMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [anData, incData, memData] = await Promise.all([
        fetchAnalytics(),
        fetchIncidents({ limit: 10 }),
        fetchMemories(undefined, undefined, 5)
      ]);
      setAnalytics(anData);
      setIncidents(incData.incidents || []);
      setMemories(memData.memories || []);
    } catch (err: any) {
      console.error("Dashboard error:", err);
      setError(err?.message || "Failed to connect to SecHindsight SOC backend.");
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
    } catch (e: any) {
      console.error(e);
      setError("Failed to seed demo data. Verify backend endpoint /api/v1/seed.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton message="Initializing SecHindsight SOC Telemetry & Organizational Memory..." />;
  }

  if (error) {
    return <ErrorState title="SOC Backend Unavailable" description={error} onRetry={loadData} />;
  }

  const criticalIncidents = incidents.filter(i => i.severity === "high" || i.severity === "critical");
  const pendingApprovals = incidents.filter(i => i.status === "AWAITING_APPROVAL");
  const metrics = analytics?.metrics;

  const chartColors = ["#EF4444", "#F97316", "#F59E0B", "#3B82F6"];

  return (
    <div className="space-y-6 max-w-[1700px] mx-auto pb-12">
      
      {/* Top Banner Header */}
      <div className="soc-card p-6 border-slate-800 bg-[#1A1A1A] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[#0F722A]/20 text-[#10B981] text-xs font-mono font-bold border border-[#0F722A]/40 flex items-center gap-1.5 uppercase">
              <Radio className="w-3 h-3 text-[#10B981] animate-pulse" /> Live SOC Command Center
            </span>
            <span className="text-xs text-slate-400 font-mono">Memory Bank: sechindsight</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Security Operations Center & Memory Engine
          </h1>
          <p className="text-xs text-slate-400 max-w-3xl">
            Monitor, investigate, and learn from every incident. Persistent organizational memory retains outcomes to elevate future triage accuracy.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={loadData}
            className="p-2.5 rounded bg-[#242424] text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors"
            title="Refresh Telemetry"
          >
            <RefreshCw className="w-4 h-4 text-[#10B981]" />
          </button>
          
          {incidents.length === 0 ? (
            <button
              onClick={handleInitialSeed}
              className="px-4 py-2 rounded bg-[#0F722A] hover:bg-[#0B561F] text-white font-mono font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-white" /> Seed Telemetry Data
            </button>
          ) : (
            <Link
              href="/demo"
              className="px-4 py-2 rounded bg-[#0F722A] hover:bg-[#0B561F] text-white font-mono font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-white text-white" /> Launch Master Demo
            </Link>
          )}
        </div>
      </div>

      {/* 6 Real API KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        
        <div className="soc-card p-4 space-y-1">
          <span className="text-[11px] font-mono text-slate-400 block uppercase">Active Incidents</span>
          <div className="text-2xl font-bold font-mono text-white">
            {metrics ? metrics.total_incidents : incidents.length}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">Live Ingestion</div>
        </div>

        <div className="soc-card p-4 space-y-1 border-red-500/30">
          <span className="text-[11px] font-mono text-slate-400 block uppercase">Critical / High</span>
          <div className="text-2xl font-bold font-mono text-red-400">
            {criticalIncidents.length}
          </div>
          <div className="text-[10px] text-red-400/80 font-mono">Immediate Review</div>
        </div>

        <div className="soc-card p-4 space-y-1 border-amber-500/30">
          <span className="text-[11px] font-mono text-slate-400 block uppercase">Awaiting Approval</span>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {metrics ? metrics.awaiting_approval : pendingApprovals.length}
          </div>
          <div className="text-[10px] text-amber-400/80 font-mono">Response Queued</div>
        </div>

        <div className="soc-card p-4 space-y-1 border-[#0F722A]/40">
          <span className="text-[11px] font-mono text-slate-400 block uppercase">Hindsight Memories</span>
          <div className="text-2xl font-bold font-mono text-[#10B981]">
            {metrics ? metrics.retained_memories : memories.length}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">Retained Lessons</div>
        </div>

        <div className="soc-card p-4 space-y-1">
          <span className="text-[11px] font-mono text-slate-400 block uppercase">Contained Cases</span>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {metrics ? metrics.contained_incidents : 0}
          </div>
          <div className="text-[10px] text-emerald-500/80 font-mono">Threat Contained</div>
        </div>

        <div className="soc-card p-4 space-y-1">
          <span className="text-[11px] font-mono text-slate-400 block uppercase">Executed Actions</span>
          <div className="text-2xl font-bold font-mono text-teal-400">
            {metrics ? metrics.response_actions_executed : 0}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">Simulated Isolation</div>
        </div>

      </div>

      {/* Grid: Active Incidents Table & Hindsight Memory Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 8 Cols: Incident Queue Table */}
        <div className="lg:col-span-8 soc-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#10B981]" /> ACTIVE INCIDENT QUEUE
              </h2>
              <p className="text-xs text-slate-400">Select an incident to launch multi-agent investigation & memory recall</p>
            </div>
            <Link href="/incidents" className="text-xs text-[#10B981] font-mono hover:underline flex items-center gap-1">
              View Queue <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Incident ID</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Host / User</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {incidents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs font-mono">
                      No active incidents ingested. Click "Seed Telemetry Data" above.
                    </td>
                  </tr>
                ) : (
                  incidents.map((inc) => (
                    <tr key={inc.id} className="hover:bg-[#242424] transition-colors">
                      <td className="py-3 px-3">
                        <SeverityBadge severity={inc.severity} />
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-100">
                        <Link href={`/incidents/${inc.id}`} className="hover:text-[#10B981] transition-colors">
                          {inc.id}
                        </Link>
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {inc.category}
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={inc.status} />
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {inc.source_host || inc.user_account || "N/A"}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          href={`/incidents/${inc.id}`}
                          className="px-2.5 py-1 rounded bg-[#0F722A] hover:bg-[#0B561F] text-white font-bold text-[11px] inline-block transition-colors"
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

        {/* Right 4 Cols: Hindsight Memory Stream */}
        <div className="lg:col-span-4 soc-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Brain className="w-4 h-4 text-[#10B981]" /> HINDSIGHT MEMORY PULSE
            </h2>
            <Link href="/memory" className="text-xs text-[#10B981] font-mono hover:underline flex items-center gap-1">
              Explorer <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <p className="text-xs text-slate-400">
            Retained organizational memory outcomes in bank <span className="font-mono text-slate-200">sechindsight</span>.
          </p>

          <div className="space-y-3">
            {memories.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs font-mono bg-[#242424] rounded border border-dashed border-slate-800">
                Memory bank initializing...
              </div>
            ) : (
              memories.slice(0, 4).map((mem) => (
                <div key={mem.id} className="p-3.5 rounded bg-[#242424] border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-[#10B981] font-bold">Source: {mem.incident_id}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">
                      {mem.outcome}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 font-medium leading-snug">
                    "{mem.lesson_learned}"
                  </p>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Category: {mem.category}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Analytics Breakdown Row: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Severity Breakdown */}
        <div className="soc-card p-5 space-y-3">
          <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#10B981]" /> Incident Severity Distribution
          </h3>
          <div className="h-48">
            {analytics?.severity_breakdown ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.severity_breakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={65}
                    innerRadius={40}
                    paddingAngle={4}
                  >
                    {analytics.severity_breakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1A1A1A", borderColor: "#334155", borderRadius: "6px", fontSize: "12px", color: "#FFFFFF" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs font-mono text-slate-500">Unavailable</div>
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="soc-card p-5 space-y-3">
          <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#10B981]" /> Threat Category Distribution
          </h3>
          <div className="h-48">
            {analytics?.category_breakdown ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.category_breakdown}>
                  <XAxis dataKey="category" stroke="#64748B" fontSize={10} />
                  <YAxis stroke="#64748B" fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1A1A1A", borderColor: "#334155", borderRadius: "6px", fontSize: "12px", color: "#FFFFFF" }}
                  />
                  <Bar dataKey="count" fill="#0F722A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs font-mono text-slate-500">Unavailable</div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
