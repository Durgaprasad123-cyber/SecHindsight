"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  AlertTriangle, 
  Brain, 
  ShieldAlert, 
  Zap, 
  BarChart3, 
  PlayCircle,
  FileText,
  Settings,
  Activity,
  ChevronLeft,
  ChevronRight,
  Shield
} from "lucide-react";

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  highlight?: boolean;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    group: "COMMAND",
    items: [
      { name: "Command Center", path: "/", icon: LayoutDashboard }
    ]
  },
  {
    group: "OPERATIONS",
    items: [
      { name: "Incident Queue", path: "/incidents", icon: AlertTriangle },
      { name: "Response Center", path: "/responses", icon: Zap }
    ]
  },
  {
    group: "INTELLIGENCE",
    items: [
      { name: "Hindsight Memory", path: "/memory", icon: Brain },
      { name: "Threat Intelligence", path: "/threats", icon: ShieldAlert }
    ]
  },
  {
    group: "ANALYTICS",
    items: [
      { name: "SOC Analytics", path: "/analytics", icon: BarChart3 },
      { name: "Audit Log", path: "/audit-log", icon: FileText }
    ]
  },
  {
    group: "SYSTEM",
    items: [
      { name: "System Settings", path: "/settings", icon: Settings },
      { name: "System Health", path: "/health", icon: Activity }
    ]
  },
  {
    group: "DEMO",
    items: [
      { name: "Master Demo", path: "/demo", icon: PlayCircle, highlight: true }
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`bg-[#1A1A1A] border-r border-slate-800/80 min-h-[calc(100vh-57px)] transition-all duration-200 flex flex-col justify-between shrink-0 z-30 ${
        collapsed ? "w-16 p-2" : "w-[240px] p-3"
      }`}
    >
      <div className="space-y-5">
        
        {/* Toggle Collapse Header */}
        <div className="flex items-center justify-between px-2 pt-1">
          {!collapsed && (
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
              Navigation
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded bg-[#242424] text-slate-400 hover:text-white hover:bg-[#2A2A2A] cursor-pointer transition-colors border border-slate-800"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Nav Groups */}
        <nav className="space-y-4">
          {NAV_GROUPS.map((g) => (
            <div key={g.group} className="space-y-1">
              {!collapsed && (
                <div className="px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-widest text-[#10B981]">
                  {g.group}
                </div>
              )}
              {g.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path));

                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    title={collapsed ? item.name : undefined}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-mono transition-all relative ${
                      isActive
                        ? "bg-[#0F722A] text-white font-bold shadow-md shadow-[#0F722A]/20"
                        : item.highlight
                        ? "text-[#10B981] hover:bg-[#0F722A]/15 font-bold border border-[#0F722A]/40"
                        : "text-slate-400 hover:text-slate-100 hover:bg-[#242424]"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : item.highlight ? "text-[#10B981]" : "text-slate-400"}`} />
                    {!collapsed && <span>{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Persistent Hindsight Memory Footer info */}
      {!collapsed && (
        <div className="p-3 rounded-lg bg-[#242424] border border-slate-800 space-y-1 text-xs">
          <div className="flex items-center gap-2 text-slate-200 font-bold font-mono">
            <Brain className="w-4 h-4 text-[#10B981]" />
            <span>Hindsight Memory</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Retaining incident outcomes to optimize future SOC copilot triage.
          </p>
        </div>
      )}
    </aside>
  );
}
