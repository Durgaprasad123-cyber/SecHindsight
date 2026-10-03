"use client";

import React, { useEffect, useState } from "react";
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Server, 
  Brain, 
  Sparkles, 
  Database,
  RefreshCw,
  ShieldCheck
} from "lucide-react";
import { fetchHealth } from "@/lib/api";
import { HealthData } from "@/lib/types";
import { LoadingSkeleton, ErrorState } from "@/components/ui/StateViews";

export default function SystemHealthPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchHealth();
      setHealth(res);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to load system health status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return <LoadingSkeleton message="Polling live system component health endpoints..." />;
  }

  if (error || !health) {
    return <ErrorState description={error || "Health check failed."} onRetry={loadData} />;
  }

  const integrations = health.integrations || {};

  const services = [
    {
      name: "FastAPI Backend Core",
      status: health.status === "healthy" ? "CONNECTED" : "DEGRADED",
      details: `Version ${health.version || "1.0.0"} - Running Python async framework`,
      icon: Server,
    },
    {
      name: "Hindsight Organizational Memory Engine",
      status: integrations.hindsight_memory?.status === "offline" ? "DEGRADED" : "CONNECTED",
      details: `Bank ID: ${integrations.hindsight_memory?.bank_id || "sechindsight"}`,
      icon: Brain,
    },
    {
      name: "Gemini AI Provider",
      status: integrations.gemini_llm?.status === "online" ? "CONNECTED" : "DEGRADED",
      details: `Model: ${integrations.gemini_llm?.model || "gemini-2.5-flash"}`,
      icon: Sparkles,
    },
    {
      name: "Groq LLM Provider",
      status: integrations.groq_llm?.status === "online" ? "CONNECTED" : "DEGRADED",
      details: `Model: ${integrations.groq_llm?.model || "llama-3.3-70b-versatile"}`,
      icon: Sparkles,
    },
    {
      name: "Application Database / Supabase",
      status: integrations.database?.status === "online" ? "CONNECTED" : "DEGRADED",
      details: `Engine: ${integrations.database?.url_type?.toUpperCase() || "POSTGRESQL"}`,
      icon: Database,
    },
    {
      name: "MITRE ATT&CK Threat Knowledge Base",
      status: "CONNECTED",
      details: "Structured v15.1 Threat Matrix catalog",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="space-y-6 max-w-[1700px] mx-auto pb-12 font-mono">
      
      {/* Header */}
      <div className="soc-card p-6 border-slate-800 bg-[#1A1A1A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/40 uppercase">
              System Health & Status
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-400" /> System Diagnostics & Component Health
          </h1>
          <p className="text-xs text-slate-400 font-sans">
            Real-time status of backend services, AI providers, memory engines, and database connections.
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2.5 rounded bg-[#242424] text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors"
          title="Re-check System Status"
        >
          <RefreshCw className="w-4 h-4 text-[#10B981]" />
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((srv, idx) => {
          const Icon = srv.icon;
          const isOk = srv.status === "CONNECTED";

          return (
            <div key={idx} className="soc-card p-5 border-slate-800 space-y-3 bg-[#1A1A1A]">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded bg-[#242424] border border-slate-800 flex items-center justify-center text-[#10B981]">
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                  isOk ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                }`}>
                  {srv.status}
                </span>
              </div>

              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-100">{srv.name}</h3>
                <p className="text-xs text-slate-400 font-sans">{srv.details}</p>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
