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
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { fetchHealth, seedDemoData } from "@/lib/api";

export function Navbar() {
  const [health, setHealth] = useState<any>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch(() => setHealth({ status: "offline", hindsight: { bank_id: "sechindsight" } }));

    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSeedDemo = async () => {
    setIsSeeding(true);
    try {
      await seedDemoData();
      window.location.href = "/demo";
    } catch (e) {
      console.error(e);
      alert("Failed to seed demo data. Please verify the backend is running.");
    } finally {
      setIsSeeding(false);
    }
  };

  const bankId = health?.hindsight?.bank_id || "sechindsight";
  const groqModel = health?.groq?.model || "openai/gpt-oss-120b";
  const isHealthy = health?.status === "healthy" || health?.database?.status === "online";

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-[rgba(40,50,35,0.10)] bg-white/75 backdrop-blur-xl px-6 py-3">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
        
        {/* Left: Brand & SOC Title */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="w-9 h-9 rounded-xl bg-[#8A9A65] p-0.5 shadow-sm group-hover:bg-[#B7C396] transition-all flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-[#1D211C]">
                SEC HINDSIGHT
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-[#E0E7D7] text-[#1D211C] border border-[#B7C396]/40">
                Enterprise SOC
              </span>
            </div>
            <p className="text-[11px] text-[#62685E] flex items-center gap-1 font-medium">
              Security Operations Center & Memory Layer
            </p>
          </div>
        </Link>

        {/* Center: Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-[#62685E] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search incident ID, user, IP, device..."
              className="w-full bg-white/80 border border-[rgba(40,50,35,0.12)] rounded-xl pl-9 pr-4 py-1.5 text-xs text-[#1D211C] placeholder-[#62685E]/60 focus:outline-none focus:border-[#8A9A65] shadow-xs"
            />
          </div>
        </div>

        {/* Right: Health Badges & Live Status Controls */}
        <div className="flex items-center gap-3 shrink-0">
          
          {/* Hindsight Bank Status */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/60 border border-[rgba(40,50,35,0.10)] text-[11px]">
            <Brain className="w-3.5 h-3.5 text-[#8A9A65]" />
            <span className="text-[#62685E]">Hindsight:</span>
            <span className="font-mono text-[#1D211C] font-semibold">{bankId}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-1" />
          </div>

          {/* Groq Model Badge */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/60 border border-[rgba(40,50,35,0.10)] text-[11px]">
            <span className="text-[#62685E]">Groq:</span>
            <span className="font-mono text-[#1D211C] font-semibold truncate max-w-[120px]">{groqModel}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-1" />
          </div>

          {/* System API Health Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/60 border border-[rgba(40,50,35,0.10)] text-[11px]">
            <Activity className="w-3.5 h-3.5 text-[#8A9A65]" />
            <span className="text-[#62685E]">API:</span>
            <span className={`font-semibold ${isHealthy ? "text-emerald-700" : "text-amber-700"}`}>
              {isHealthy ? "HEALTHY" : "CONNECTING"}
            </span>
          </div>

          {/* Analyst Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E0E7D7]/70 text-[11px] text-[#1D211C] font-semibold border border-[#B7C396]/40">
            <UserCheck className="w-3.5 h-3.5 text-[#8A9A65]" />
            <span>SOC Lead Analyst</span>
          </div>

          {/* Clock */}
          <div className="hidden lg:flex items-center gap-1 font-mono text-[11px] text-[#62685E] px-2 py-1 bg-white/50 rounded-lg border border-[rgba(40,50,35,0.08)]">
            <Clock className="w-3 h-3 text-[#8A9A65]" />
            <span>{currentTime || "UTC"}</span>
          </div>

          {/* Master Demo Action Button */}
          <button
            onClick={handleSeedDemo}
            disabled={isSeeding}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#8A9A65] text-white font-semibold text-xs shadow-xs hover:bg-[#788855] transition-all cursor-pointer disabled:opacity-50"
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
