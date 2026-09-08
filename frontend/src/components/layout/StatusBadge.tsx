import React from "react";
import { CheckCircle, AlertTriangle, ShieldX, HelpCircle, UserCheck } from "lucide-react";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = "" }) => {
  const norm = status?.toLowerCase() || "";

  if (norm.includes("auto") || norm === "resolved" || norm === "trusted") {
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 ${className}`}>
        <CheckCircle className="w-3 h-3 text-emerald-400 mr-1.5" />
        AUTO-RECONCILED
      </span>
    );
  }

  if (norm.includes("review") || norm === "needs_review" || norm === "review_required") {
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-500/30 ${className}`}>
        <AlertTriangle className="w-3 h-3 text-amber-400 mr-1.5" />
        HUMAN REVIEW
      </span>
    );
  }

  if (norm.includes("manual") || norm.includes("human_reviewed")) {
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-950/60 text-indigo-300 border border-indigo-500/30 ${className}`}>
        <UserCheck className="w-3 h-3 text-indigo-400 mr-1.5" />
        MANUALLY VERIFIED
      </span>
    );
  }

  if (norm.includes("block")) {
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-950/60 text-rose-300 border border-rose-500/30 ${className}`}>
        <ShieldX className="w-3 h-3 text-rose-400 mr-1.5" />
        BLOCKED (&lt;70%)
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 ${className}`}>
      <HelpCircle className="w-3 h-3 text-slate-400 mr-1.5" />
      {status.toUpperCase()}
    </span>
  );
};
