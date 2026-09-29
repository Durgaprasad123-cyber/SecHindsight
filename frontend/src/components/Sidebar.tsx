"use client";

import React from "react";
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
  Radio
} from "lucide-react";

interface NavGroup {
  group: string;
  items: {
    name: string;
    path: string;
    icon: React.ElementType;
    highlight?: boolean;
  }[];
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
      { name: "Incidents", path: "/incidents", icon: AlertTriangle }
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
    group: "RESPONSE",
    items: [
      { name: "Response Center", path: "/responses", icon: Zap }
    ]
  },
  {
    group: "ANALYSIS",
    items: [
      { name: "SOC Analytics", path: "/analytics", icon: BarChart3 },
      { name: "Audit Log", path: "/audit-log", icon: FileText }
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

  return (
    <aside className="w-[230px] glass-panel border-r border-[rgba(40,50,35,0.10)] min-h-[calc(100vh-57px)] p-3 flex flex-col justify-between shrink-0 bg-white/60">
      <nav className="space-y-4">
        {NAV_GROUPS.map((g) => (
          <div key={g.group} className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-widest text-[#62685E]/80">
              {g.group}
            </div>
            {g.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path));

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all relative ${
                    isActive
                      ? "bg-[#E0E7D7] text-[#1D211C] font-semibold shadow-xs border-l-4 border-[#8A9A65]"
                      : item.highlight
                      ? "text-[#8A9A65] hover:bg-[#E0E7D7]/50 font-semibold border border-[#B7C396]/30"
                      : "text-[#62685E] hover:text-[#1D211C] hover:bg-white/70"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#8A9A65]" : item.highlight ? "text-[#8A9A65]" : "text-[#62685E]"}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Hindsight Organizational Memory Footer */}
      <div className="p-3 rounded-xl bg-[#E0E7D7]/50 border border-[#B7C396]/40 space-y-1.5">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-[#8A9A65]" />
          <span className="text-xs font-bold text-[#1D211C]">Hindsight Memory</span>
        </div>
        <p className="text-[11px] text-[#62685E] leading-tight">
          Retaining incident outcomes to make future SOC investigations smarter.
        </p>
      </div>
    </aside>
  );
}
