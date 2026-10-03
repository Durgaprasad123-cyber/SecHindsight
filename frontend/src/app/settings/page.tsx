"use client";

import React, { useEffect, useState } from "react";
import { 
  Settings, 
  Brain, 
  Sparkles, 
  ShieldCheck, 
  Lock, 
  Activity, 
  Eye, 
  EyeOff,
  CheckCircle2,
  Server
} from "lucide-react";
import { fetchAiProvider, fetchHealth } from "@/lib/api";
import { AiProviderInfo, HealthData } from "@/lib/types";
import { LoadingSkeleton, ErrorState } from "@/components/ui/StateViews";

export default function SettingsPage() {
  const [aiInfo, setAiInfo] = useState<AiProviderInfo | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [aiRes, healthRes] = await Promise.all([
        fetchAiProvider(),
        fetchHealth()
      ]);
      setAiInfo(aiRes);
      setHealth(healthRes);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to load provider configuration.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return <LoadingSkeleton message="Fetching system settings & AI provider status..." />;
  }

  if (error || !aiInfo) {
    return <ErrorState description={error || "Settings unavailable."} onRetry={loadData} />;
  }

  return (
    <div className="space-y-6 max-w-[1700px] mx-auto pb-12">
      
      {/* Header */}
      <div className="soc-card p-6 border-slate-800 bg-[#1A1A1A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-[#0F722A]/20 text-[#10B981] text-xs font-mono font-bold border border-[#0F722A]/40 uppercase">
              System Configuration
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white font-mono flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#10B981]" /> Platform Settings & Provider Configuration
          </h1>
          <p className="text-xs text-slate-400">
            Configure active AI reasoning providers (Gemini/Groq), Hindsight memory bank parameters, and security policies.
          </p>
        </div>
      </div>

      {/* Grid: AI Provider & Hindsight Memory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-mono text-xs">
        
        {/* AI Provider Configuration */}
        <div className="soc-card p-6 border-slate-800 space-y-4 bg-[#1A1A1A]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white uppercase flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#10B981]" /> AI Reasoning Provider
            </h2>
            <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">
              CONFIGURED
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded bg-[#242424] border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase block">ACTIVE AI PROVIDER</span>
              <div className="text-sm font-bold text-white uppercase">{aiInfo.provider}</div>
            </div>

            <div className="p-3.5 rounded bg-[#242424] border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase block">ACTIVE REASONING MODEL</span>
              <div className="text-sm font-bold text-[#10B981]">{aiInfo.model}</div>
            </div>

            <div className="p-3.5 rounded bg-[#242424] border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase block">SUPPORTED PROVIDERS</span>
              <div className="text-slate-200">
                {aiInfo.supported_providers?.join(", ") || "Gemini, Groq"}
              </div>
            </div>

            <div className="p-3.5 rounded bg-[#242424] border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase block">API KEY SECURITY</span>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold">••••••••••••••••••••••••</span>
                <span className="text-emerald-400 text-[10px] font-bold">SECURE (BACKEND ONLY)</span>
              </div>
              <p className="text-[10px] text-slate-500 font-sans mt-1">
                API keys are strictly processed server-side in Python FastAPI environment. Never exposed to browser.
              </p>
            </div>
          </div>
        </div>

        {/* Hindsight Organizational Memory Configuration */}
        <div className="soc-card p-6 border-slate-800 space-y-4 bg-[#1A1A1A]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white uppercase flex items-center gap-2">
              <Brain className="w-4 h-4 text-[#10B981]" /> Hindsight Organizational Memory Layer
            </h2>
            <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">
              ACTIVE & CONNECTED
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded bg-[#242424] border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase block">ORGANIZATIONAL BANK ID</span>
              <div className="text-sm font-bold text-white">sechindsight</div>
            </div>

            <div className="p-3.5 rounded bg-[#242424] border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase block">HINDSIGHT ENDPOINT</span>
              <div className="text-slate-200 text-[11px] truncate">https://api.hindsight.vectorize.io</div>
            </div>

            <div className="p-3.5 rounded bg-[#242424] border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase block">MEMORY PRIMITIVES ENABLED</span>
              <div className="text-slate-200 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#0F722A]/20 text-[#10B981] font-bold">RECALL</span>
                <span className="px-2 py-0.5 rounded bg-[#0F722A]/20 text-[#10B981] font-bold">REFLECT</span>
                <span className="px-2 py-0.5 rounded bg-[#0F722A]/20 text-[#10B981] font-bold">RETAIN</span>
              </div>
            </div>

            <div className="p-3.5 rounded bg-[#242424] border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase block">DATABASE PERSISTENCE MIRROR</span>
              <div className="text-slate-200 font-bold">
                {health?.integrations?.database?.url_type?.toUpperCase() || "SQLITE / SUPABASE POSTGRESQL"}
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
