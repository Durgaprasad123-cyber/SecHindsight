import React from "react";
import { AlertTriangle, RefreshCw, Database, SearchX, ShieldAlert } from "lucide-react";

export function LoadingSkeleton({ message = "Loading SecHindsight telemetry..." }: { message?: string }) {
  return (
    <div className="soc-card p-10 flex flex-col items-center justify-center text-center space-y-3">
      <div className="w-9 h-9 rounded-lg border-2 border-[#10B981] border-t-transparent animate-spin flex items-center justify-center" />
      <p className="text-xs font-mono text-slate-400 animate-pulse">{message}</p>
    </div>
  );
}

export function ErrorState({
  title = "Failed to load data",
  description = "An error occurred while communicating with SecHindsight backend service.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="soc-card p-8 text-center space-y-4 border-red-500/30 bg-red-950/10">
      <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-bold text-slate-100">{title}</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">{description}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium cursor-pointer transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#10B981]" />
          <span>Retry Operation</span>
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  icon: Icon = SearchX,
  title = "No records found",
  description = "No items match your specified filter or query criteria.",
  actionLabel,
  onAction,
}: {
  icon?: React.ElementType;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="soc-card p-10 text-center space-y-4">
      <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
        <Icon className="w-6 h-6 text-[#10B981]" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-slate-200">{title}</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">{description}</p>
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#0F722A] hover:bg-[#0B561F] text-white text-xs font-semibold cursor-pointer transition-colors shadow-sm"
        >
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}
