import React from "react";
import { IncidentSeverity, IncidentStatus } from "@/lib/types";
import { AlertOctagon, AlertTriangle, Info, ShieldCheck, CheckCircle2, Clock, XCircle, Activity } from "lucide-react";

interface SeverityBadgeProps {
  severity: IncidentSeverity | string;
  size?: "sm" | "md" | "lg";
}

export function SeverityBadge({ severity, size = "sm" }: SeverityBadgeProps) {
  const sev = (severity || "low").toLowerCase();
  
  let styles = "bg-blue-500/10 text-blue-400 border-blue-500/20";
  let icon = <Info className="w-3 h-3" />;
  
  if (sev === "critical") {
    styles = "bg-red-500/15 text-red-400 border-red-500/30 font-bold";
    icon = <AlertOctagon className="w-3.5 h-3.5 text-red-400" />;
  } else if (sev === "high") {
    styles = "bg-orange-500/15 text-orange-400 border-orange-500/30 font-semibold";
    icon = <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />;
  } else if (sev === "medium") {
    styles = "bg-amber-500/15 text-amber-400 border-amber-500/30 font-medium";
    icon = <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
  }

  const sizeStyles = size === "lg" 
    ? "px-3 py-1 text-xs gap-1.5" 
    : size === "md" 
    ? "px-2.5 py-0.5 text-xs gap-1" 
    : "px-2 py-0.5 text-[10px] gap-1";

  return (
    <span className={`inline-flex items-center rounded border font-mono uppercase tracking-wider ${styles} ${sizeStyles}`}>
      {icon}
      <span>{sev}</span>
    </span>
  );
}

interface StatusBadgeProps {
  status: IncidentStatus | string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const st = (status || "NEW").toUpperCase();
  
  let styles = "bg-slate-800 text-slate-300 border-slate-700";
  let icon = <Clock className="w-3 h-3" />;

  if (st === "CONTAINED" || st === "CLOSED" || st === "APPROVED" || st === "EXECUTED") {
    styles = "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-semibold";
    icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
  } else if (st === "AWAITING_APPROVAL" || st === "RESPONSE_RECOMMENDED") {
    styles = "bg-amber-500/15 text-amber-400 border-amber-500/30 font-semibold";
    icon = <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
  } else if (st === "TRIAGING" || st === "INVESTIGATING" || st === "THREAT_ANALYSIS") {
    styles = "bg-indigo-500/15 text-indigo-400 border-indigo-500/30 font-medium";
    icon = <Activity className="w-3.5 h-3.5 text-indigo-400 animate-spin" />;
  } else if (st === "REJECTED" || st === "FAILED") {
    styles = "bg-red-500/15 text-red-400 border-red-500/30";
    icon = <XCircle className="w-3.5 h-3.5 text-red-400" />;
  }

  const sizeStyles = size === "md" ? "px-2.5 py-1 text-xs gap-1.5" : "px-2 py-0.5 text-[10px] gap-1";

  return (
    <span className={`inline-flex items-center rounded border font-mono font-medium ${styles} ${sizeStyles}`}>
      {icon}
      <span>{st}</span>
    </span>
  );
}

export function ConfidenceBar({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  let color = "bg-blue-500";
  if (pct >= 85) color = "bg-red-500";
  else if (pct >= 70) color = "bg-amber-500";

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden border border-slate-700">
        <div className={`h-full ${color} transition-all duration-300`} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-[11px] text-slate-300 font-semibold">{pct}%</span>
    </div>
  );
}
