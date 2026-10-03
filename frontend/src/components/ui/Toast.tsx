import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  description?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto soc-card p-3.5 rounded-lg border flex items-start gap-3 shadow-2xl transition-all animate-in slide-in-from-bottom-2 ${
            t.type === "success"
              ? "bg-[#1A1A1A] border-emerald-500/40 text-emerald-400"
              : t.type === "error"
              ? "bg-[#1A1A1A] border-red-500/40 text-red-400"
              : "bg-[#1A1A1A] border-[#0F722A]/40 text-[#10B981]"
          }`}
        >
          {t.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
          {t.type === "error" && <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
          {t.type === "info" && <Info className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" />}

          <div className="flex-1 space-y-0.5">
            <h4 className="text-xs font-bold text-slate-100">{t.title}</h4>
            {t.description && <p className="text-[11px] text-slate-300 leading-snug">{t.description}</p>}
          </div>

          <button
            onClick={() => onDismiss(t.id)}
            className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
