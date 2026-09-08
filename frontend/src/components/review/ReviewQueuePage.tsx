import React, { useState } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Search,
  Sparkles,
  ArrowRight,
  UserCheck,
  RotateCw,
  SlidersHorizontal,
  Check,
  ArrowLeft,
  ListFilter
} from "lucide-react";
import { Conflict } from "../../types";
import { ConfidenceBar } from "../layout/ConfidenceBar";
import { StatusBadge } from "../layout/StatusBadge";
import { api } from "../../services/api";

interface ReviewQueuePageProps {
  conflicts: Conflict[];
  onRefresh: () => void;
  onOpenCopilot: (conflictId: number) => void;
}

export const ReviewQueuePage: React.FC<ReviewQueuePageProps> = ({
  conflicts,
  onRefresh,
  onOpenCopilot,
}) => {
  const [selectedCase, setSelectedCase] = useState<Conflict | null>(
    conflicts.length > 0 ? conflicts[0] : null
  );

  const [mobileView, setMobileView] = useState<"list" | "detail">("list");
  const [selectedCustomValue, setSelectedCustomValue] = useState<string>("");
  const [reviewReason, setReviewReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync selectedCase when conflicts list updates
  React.useEffect(() => {
    if (conflicts.length > 0 && (!selectedCase || !conflicts.find((c) => c.id === selectedCase.id))) {
      setSelectedCase(conflicts[0]);
    }
  }, [conflicts]);

  const handleResolve = async (action: "APPROVE" | "REJECT" | "CHOOSE" | "REQUEST_EVIDENCE") => {
    if (!selectedCase) return;

    try {
      setIsSubmitting(true);
      setSuccessMessage(null);

      const val = action === "CHOOSE" ? selectedCustomValue : (selectedCase.recommended_value || "");
      await api.resolveReviewCase(selectedCase.id, {
        selected_value: val,
        action: action,
        reason: reviewReason || undefined,
        reviewer: "compliance_officer@verimerge.ai",
      });

      setSuccessMessage(`Successfully executed action: ${action}`);
      setReviewReason("");
      setSelectedCustomValue("");
      onRefresh();
    } catch (err: any) {
      console.error("Resolution failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-white flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <span>Human-in-the-Loop Review Queue</span>
        </h2>
        <p className="text-xs text-slate-400">
          Cases with confidence between 70% and 89%, or blocked sensitive fields, require authorized human approval.
        </p>
      </div>

      {conflicts.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white">Review Queue is Empty</h3>
          <p className="text-xs text-slate-500 mt-1">
            All records meet the zero-trust auto-reconciliation threshold or no conflicts are pending.
          </p>
        </div>
      ) : (
        <div>
          {/* Mobile View Switcher (< lg) */}
          <div className="flex lg:hidden bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs mb-4">
            <button
              onClick={() => setMobileView("list")}
              className={`flex-1 py-2 rounded-md font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer ${
                mobileView === "list" ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Pending Queue ({conflicts.length})</span>
            </button>
            <button
              onClick={() => setMobileView("detail")}
              disabled={!selectedCase}
              className={`flex-1 py-2 rounded-md font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-40 ${
                mobileView === "detail" ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              <span>Review Console</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Queue List */}
            <div
              className={`lg:col-span-1 glass-panel rounded-2xl p-4 border border-slate-800 space-y-3 h-[480px] lg:h-[650px] flex flex-col ${
                mobileView === "detail" ? "hidden lg:flex" : "flex"
              }`}
            >
              <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider px-2 flex items-center justify-between">
                <span>Pending Decisions</span>
                <span className="text-cyan-400 font-bold">{conflicts.length}</span>
              </div>

              <div className="overflow-y-auto space-y-2 flex-1 pr-1">
                {conflicts.map((item) => {
                  const isSelected = selectedCase?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedCase(item);
                        setSuccessMessage(null);
                        setMobileView("detail");
                      }}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all duration-150 ${
                        isSelected
                          ? "bg-slate-800/90 border-cyan-500/50 shadow-md shadow-cyan-950/20"
                          : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-white truncate max-w-[140px]">{item.entity_name}</span>
                        <StatusBadge status={item.status} />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-mono text-cyan-400 uppercase font-semibold">{item.field_name}</span>
                        <ConfidenceBar score={item.confidence} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Case Deep-Dive & Action Console */}
            {selectedCase && (
              <div
                className={`lg:col-span-2 glass-panel rounded-2xl p-4 sm:p-6 border border-slate-800 space-y-5 sm:space-y-6 bg-[#0B1120] ${
                  mobileView === "list" ? "hidden lg:block" : "block"
                }`}
              >
                {/* Mobile Back Button */}
                <div className="lg:hidden">
                  <button
                    onClick={() => setMobileView("list")}
                    className="flex items-center space-x-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-mono py-1 px-2 -ml-2 rounded-lg hover:bg-slate-800/50 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Pending List ({conflicts.length})</span>
                  </button>
                </div>

                {/* Case Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 gap-3 sm:gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <span className="text-base font-bold text-white">{selectedCase.entity_name}</span>
                      <span className="font-mono text-xs text-cyan-400 bg-cyan-950/50 border border-cyan-800/40 px-2 py-0.5 rounded">
                        Field: {selectedCase.field_name.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">Case ID #{selectedCase.id}</span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => onOpenCopilot(selectedCase.id)}
                      className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-violet-950/60 hover:bg-violet-900/60 text-violet-300 border border-violet-800/40 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                      <span>Ask Conflict Copilot</span>
                    </button>
                  </div>
                </div>

                {/* Status Message */}
                {successMessage && (
                  <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-xs text-emerald-300 flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {/* AI Recommendation Summary */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                      System AI Recommendation
                    </span>
                    <ConfidenceBar score={selectedCase.confidence} />
                  </div>
                  <div className="text-sm font-bold text-cyan-300">
                    {selectedCase.recommended_value || "No confident recommendation"}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {selectedCase.reasoning || "Reasoning generated from corroboration weights."}
                  </p>
                </div>

                {/* Conflicting Source Values */}
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono mb-2">
                    Contested Values Across Original Sources
                  </h4>
                  <div className="space-y-2">
                    {selectedCase.values.map((v) => (
                      <label
                        key={v.id}
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                          selectedCustomValue === v.value
                            ? "bg-cyan-950/40 border-cyan-500/50 text-white"
                            : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <input
                            type="radio"
                            name="conflicting_val"
                            checked={selectedCustomValue === v.value}
                            onChange={() => setSelectedCustomValue(v.value)}
                            className="accent-cyan-500"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-sm truncate">{v.value}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              Source: {v.source_name} (Authority: {v.authority_score})
                            </div>
                          </div>
                        </div>
                        {v.value === selectedCase.recommended_value && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 shrink-0 ml-2">
                            AI Top Choice
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Reviewer Rationale Input */}
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-400 uppercase mb-1.5">
                    Audit Ledger Note / Justification (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Verified against physical registry excerpt signed on 04-Sept-2026"
                    value={reviewReason}
                    onChange={(e) => setReviewReason(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3">
                  <button
                    onClick={() => handleResolve("APPROVE")}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-900/20 active:scale-95 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Approve Recommendation</span>
                  </button>

                  <button
                    onClick={() => handleResolve("CHOOSE")}
                    disabled={isSubmitting || !selectedCustomValue}
                    className="px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-900/20 active:scale-95 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4 shrink-0" />
                    <span>Choose Selected Value</span>
                  </button>

                  <button
                    onClick={() => handleResolve("REQUEST_EVIDENCE")}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5 shrink-0" />
                    <span>Request More Evidence</span>
                  </button>

                  <button
                    onClick={() => handleResolve("REJECT")}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span>Reject & Block</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
