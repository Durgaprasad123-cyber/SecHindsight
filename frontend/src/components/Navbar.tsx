"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  Brain, 
  Search, 
  Activity, 
  Play, 
  RefreshCw,
  Clock,
  UserCheck,
  Cpu,
  Sparkles
} from "lucide-react";
import { fetchHealth, seedDemoData } from "@/lib/api";
import { HealthData } from "@/lib/types";

interface NavbarProps {
  onOpenSearch: () => void;
  onShowToast: (title: string, desc?: string, type?: "success" | "error" | "info") => void;
}

export function Navbar({ onOpenSearch, onShowToast }: NavbarProps) {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch(() => setHealth(null));

    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-US", { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSeedDemo = async () => {
    setIsSeeding(true);
    try {
      await seedDemoData();
      onShowToast("Demo Reset Successful", "Master 4-Incident scenario and Hindsight memory bank re-seeded.", "success");
      window.location.href = "/demo";
    } catch (e: any) {
      console.error(e);
      onShowToast("Demo Seeding Failed", e?.message || "Verify FastAPI backend is running.", "error");
    } finally {
      setIsSeeding(false);
    }
  };

  const bankId = health?.integrations?.hindsight_memory?.bank_id || "sechindsight";
  const activeProvider = health?.ai_provider?.active_provider || "gemini";
  const activeModel = health?.ai_provider?.active_model || "gemini-2.5-flash";
  const isHealthy = health?.status === "healthy" || health?.integrations?.database?.status === "online";

  return (
    <header className="sticky top-0 z-40 bg-[#1A1A1A]/95 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-6 py-2.5">
      <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-4">
        
        {/* Left: Brand Identity */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[#0F722A] p-1 shadow-md shadow-[#0F722A]/30 group-hover:bg-[#0B561F] transition-all flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white font-mono">
                SEC HINDSIGHT
              </span>
              <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded bg-[#0F722A]/20 text-[#10B981] border border-[#0F722A]/40 uppercase">
                SOC Copilot
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
              Organizational Memory & Defensive AI
            </p>
          </div>
        </Link>

        {/* Center: Global Search Trigger */}
        <button
          onClick={onOpenSearch}
          className="hidden md:flex items-center justify-between flex-1 max-w-md mx-4 bg-[#242424] border border-slate-800 hover:border-[#0F722A]/50 rounded-lg px-3 py-1.5 text-xs text-slate-400 cursor-pointer transition-all shadow-inner group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-[#10B981] group-hover:text-white transition-colors" />
            <span className="text-slate-400 group-hover:text-slate-300">Search incident ID, IP, user, host, technique...</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-[#121212] rounded border border-slate-700">
            Ctrl K
          </kbd>
        </button>

        {/* Right: Operational Status Badges & Demo Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          
          {/* Hindsight Bank Status */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#242424] border border-slate-800 text-[11px] font-mono">
            <Brain className="w-3.5 h-3.5 text-[#10B981]" />
            <span className="text-slate-400">Hindsight:</span>
            <span className="text-slate-200 font-bold">{bankId}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
          </div>

          {/* AI Reasoning Provider */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#242424] border border-slate-800 text-[11px] font-mono">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-slate-400">AI:</span>
            <span className="text-slate-200 font-bold uppercase">{activeProvider}</span>
            <span className="text-[9px] text-slate-500 font-mono">({activeModel})</span>
          </div>

          {/* System API Health Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#242424] border border-slate-800 text-[11px] font-mono">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400">API:</span>
            <span className={`font-bold ${isHealthy ? "text-emerald-400" : "text-amber-400"}`}>
              {isHealthy ? "HEALTHY" : "OFFLINE"}
            </span>
          </div>

          {/* Analyst Indicator */}
          <div className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0F722A]/15 border border-[#0F722A]/30 text-[11px] font-mono text-slate-200 font-semibold">
            <UserCheck className="w-3.5 h-3.5 text-[#10B981]" />
            <span>SOC Lead Analyst</span>
          </div>

          {/* Time Clock */}
          <div className="hidden md:flex items-center gap-1 font-mono text-[11px] text-slate-400 px-2.5 py-1 bg-[#242424] rounded border border-slate-800">
            <Clock className="w-3 h-3 text-[#10B981]" />
            <span>{currentTime || "UTC"}</span>
          </div>

          {/* Master Demo Action Button */}
          <button
            onClick={handleSeedDemo}
            disabled={isSeeding}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#0F722A] hover:bg-[#0B561F] text-white font-mono font-bold text-xs shadow-md shadow-[#0F722A]/20 transition-all cursor-pointer disabled:opacity-50 shrink-0 border border-[#0F722A]"
          >
            {isSeeding ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-white text-white" />
            )}
            <span>Master Demo</span>
          </button>

        </div>

      </div>
    </header>
  );
}
