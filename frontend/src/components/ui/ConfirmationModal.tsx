import React from "react";
import { AlertTriangle, ShieldCheck, X } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "brand" | "warning";
  isLoading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Approve Action",
  cancelText = "Cancel",
  variant = "brand",
  isLoading = false,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  let btnColor = "bg-[#0F722A] hover:bg-[#0B561F] text-white";
  if (variant === "danger") btnColor = "bg-red-600 hover:bg-red-700 text-white";
  if (variant === "warning") btnColor = "bg-amber-600 hover:bg-amber-700 text-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#121212]/85 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="soc-card p-6 max-w-md w-full space-y-4 border-slate-700 bg-[#1A1A1A] shadow-2xl relative">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#0F722A]/15 border border-[#0F722A]/30 flex items-center justify-center text-[#10B981]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">{title}</h3>
            <p className="text-[11px] text-slate-400 font-mono">SOC Action Confirmation</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed bg-[#242424] p-3 rounded border border-slate-800">
          {description}
        </p>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white text-xs font-semibold cursor-pointer border border-slate-700 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded text-xs font-semibold cursor-pointer transition-colors shadow-sm flex items-center gap-2 ${btnColor} disabled:opacity-50`}
          >
            {isLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            <span>{isLoading ? "Processing..." : confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
