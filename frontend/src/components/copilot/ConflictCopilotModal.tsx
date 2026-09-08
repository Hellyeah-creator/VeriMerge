import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Send,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Info,
  X,
  Bot,
  User,
  ArrowRight
} from "lucide-react";
import { CopilotResponse } from "../../types";
import { ConfidenceBar } from "../layout/ConfidenceBar";
import { api } from "../../services/api";

interface ConflictCopilotModalProps {
  conflictId: number | null;
  onClose: () => void;
  onSelectRecommendation?: (recValue: string) => void;
}

export const ConflictCopilotModal: React.FC<ConflictCopilotModalProps> = ({
  conflictId,
  onClose,
  onSelectRecommendation,
}) => {
  const [userPrompt, setUserPrompt] = useState("Why did you choose this value?");
  const [copilotData, setCopilotData] = useState<CopilotResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!conflictId) return;

    const fetchAnalysis = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await api.queryCopilot(conflictId, userPrompt);
        setCopilotData(res);
      } catch (err: any) {
        setError(err.message || "Failed to query Conflict Copilot");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalysis();
  }, [conflictId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conflictId || !userPrompt.trim()) return;

    try {
      setIsLoading(true);
      setError(null);
      const res = await api.queryCopilot(conflictId, userPrompt);
      setCopilotData(res);
    } catch (err: any) {
      setError(err.message || "Copilot query failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (!conflictId) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-2.5 sm:p-4">
      <div className="glass-panel bg-[#0B1120] border border-violet-700/50 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl shadow-violet-950/40">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-violet-950/40 to-slate-900 gap-2">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-violet-600/30 border border-violet-500/40 flex items-center justify-center shadow-inner shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">VeriMerge Conflict Copilot</h3>
                <span className="text-[9px] sm:text-[10px] font-mono px-2 py-0.2 rounded-full bg-violet-900/50 text-violet-300 border border-violet-700/50">
                  Zero-Hallucination
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate hidden sm:block">
                Reasons strictly over corroborated source data and authorized external evidence.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 flex-1">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <Sparkles className="w-8 h-8 text-violet-400 animate-spin" />
              <p className="text-xs text-slate-400 font-mono">
                Cross-referencing source records and corroborating registry evidence...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 text-xs text-rose-300">
              {error}
            </div>
          ) : copilotData ? (
            <div className="space-y-5 text-xs">
              {/* AI Discrepancy Overview Banner */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-slate-500 uppercase font-bold">
                    Field Evaluated: <span className="text-cyan-400">{copilotData.field_name.toUpperCase()}</span>
                  </span>
                  <ConfidenceBar score={copilotData.confidence} />
                </div>
                <p className="text-white font-semibold">{copilotData.conflict_summary}</p>
              </div>

              {/* Grounded Natural Language Reasoning */}
              <div>
                <h4 className="text-[11px] font-bold text-slate-300 uppercase font-mono tracking-wider mb-2 flex items-center space-x-1.5">
                  <Bot className="w-3.5 h-3.5 text-violet-400" />
                  <span>AI Grounded Reasoning</span>
                  <span className="text-[10px] text-emerald-400 font-normal font-sans ml-2">
                    (Verified Against System Truth)
                  </span>
                </h4>
                <div className="p-4 rounded-xl bg-gradient-to-r from-violet-950/30 to-cyan-950/20 border border-violet-800/30 text-slate-200 leading-relaxed font-sans text-xs">
                  {copilotData.reasoning}
                </div>
              </div>

              {/* Recommended Value & Next Action */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-mono uppercase block">Recommended Value</span>
                  <span className="text-sm font-bold text-cyan-300">
                    {copilotData.recommended_value || "None"}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-mono uppercase block">Recommended Governance Action</span>
                  <span className="text-xs font-bold text-emerald-400">
                    {copilotData.next_action}
                  </span>
                </div>
              </div>

              {/* Sources Compared */}
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block mb-1.5">
                  Sources Compared
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {copilotData.sources_compared.map((src, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-slate-900 text-slate-300 border border-slate-800"
                    >
                      {src}
                    </span>
                  ))}
                </div>
              </div>

              {/* Evidence Considered */}
              {copilotData.evidence_considered.length > 0 && (
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block mb-1.5">
                    Supporting Evidence Corroborated
                  </span>
                  <div className="space-y-2">
                    {copilotData.evidence_considered.map((ev, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-between"
                      >
                        <div className="truncate max-w-sm">
                          <div className="font-bold text-slate-200">{ev.source_title}</div>
                          <div className="text-[10px] text-slate-400 font-mono">Value: '{ev.value}'</div>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-cyan-400">
                          Authority {ev.authority}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Question Prompt Bar */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-slate-800 bg-[#090E1A] flex items-center space-x-2">
          <input
            type="text"
            placeholder="Ask Copilot (e.g. Why did you choose 12 MG Road?)"
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
          />
          <button
            type="submit"
            disabled={isLoading || !userPrompt.trim()}
            className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-md shadow-violet-900/30 flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Investigate</span>
          </button>
        </form>
      </div>
    </div>
  );
};
