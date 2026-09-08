import React, { useState } from "react";
import {
  ArrowLeft,
  ShieldCheck,
  HelpCircle,
  Sparkles,
  Search,
  Network,
  Database,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Layers,
  Activity
} from "lucide-react";
import { EntityDetail, TrustedField, Conflict } from "../../types";
import { ConfidenceBar } from "../layout/ConfidenceBar";
import { StatusBadge } from "../layout/StatusBadge";
import { api } from "../../services/api";

interface EntityDetailPageProps {
  entity: EntityDetail;
  onBack: () => void;
  onOpenGraph: (entityId: number) => void;
  onOpenCopilot: (conflictId: number) => void;
  onRefresh: () => void;
}

export const EntityDetailPage: React.FC<EntityDetailPageProps> = ({
  entity,
  onBack,
  onOpenGraph,
  onOpenCopilot,
  onRefresh,
}) => {
  const [selectedFieldWhy, setSelectedFieldWhy] = useState<{
    field: string;
    trusted?: TrustedField;
    conflict?: Conflict;
  } | null>(null);

  const [isVerifying, setIsVerifying] = useState<string | null>(null);

  const handleWebVerify = async (fieldName: string) => {
    try {
      setIsVerifying(fieldName);
      await api.triggerWebVerify(entity.id, fieldName);
      onRefresh();
    } catch (err) {
      console.error("Web Verify failed:", err);
    } finally {
      setIsVerifying(null);
    }
  };

  // Find corresponding conflict for each field
  const getConflictForField = (fieldName: string) =>
    entity.conflicts.find((c) => c.field_name === fieldName);

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Top Bar with Back and Graph Link */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <button
          onClick={onBack}
          className="flex items-center justify-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Reconciliation List</span>
        </button>

        <button
          onClick={() => onOpenGraph(entity.id)}
          className="flex items-center justify-center space-x-2 text-xs font-semibold text-violet-300 hover:text-white px-3.5 py-2 rounded-lg bg-violet-950/60 border border-violet-700/50 hover:bg-violet-900/60 transition-colors shadow-sm cursor-pointer"
        >
          <Network className="w-3.5 h-3.5 text-violet-400" />
          <span>Interactive Evidence Graph</span>
        </button>
      </div>

      {/* Entity Header Banner */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-slate-800 bg-gradient-to-r from-[#0C1322] via-[#090E1A] to-[#130E22]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-cyan-950/80 border border-cyan-700/50 flex items-center justify-center text-cyan-400 font-mono text-base sm:text-lg font-bold shrink-0">
                {entity.canonical_name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-base sm:text-xl font-bold text-white tracking-tight truncate">{entity.canonical_name}</h1>
                  <StatusBadge status={entity.status} />
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                  <span className="font-mono text-cyan-400">Entity #{entity.id}</span>
                  <span>•</span>
                  <span>{entity.entity_type}</span>
                  <span>•</span>
                  <span className="font-mono">{entity.records.length} Linked Records</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4 bg-slate-900/80 p-3 rounded-xl border border-slate-800 self-start md:self-auto">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Clustering Confidence</span>
              <ConfidenceBar score={entity.match_confidence} />
            </div>
          </div>
        </div>

        {/* Matched Features */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Matched Signals:</span>
          {entity.matching_features.map((feat, idx) => (
            <span
              key={idx}
              className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-cyan-950/40 text-cyan-300 border border-cyan-800/40"
            >
              {feat}
            </span>
          ))}
        </div>
      </div>

      {/* Section 1: Golden Trusted Record Card */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Canonical Golden Record</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Zero-trust field-level resolution. Every field retains confidence, source corroboration, and complete reasoning.
            </p>
          </div>
          <div className="text-[10px] sm:text-[11px] text-emerald-400/90 font-mono bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-800/40 self-start sm:self-auto shrink-0">
            Immutable Audit Provenance
          </div>
        </div>

        <div className="divide-y divide-slate-800/80">
          {/* Canonical Fields Comparison List */}
          {[
            { key: "entity_name", label: "Legal / Entity Name" },
            { key: "address", label: "Registered Address" },
            { key: "phone", label: "Primary Phone" },
            { key: "director", label: "Director / Officer" },
            { key: "bank_account", label: "Bank Account Details" },
            { key: "company", label: "Company Organization" },
            { key: "registration_id", label: "Registration / Tax ID" },
          ].map(({ key, label }) => {
            const trusted = entity.trusted_fields.find((tf) => tf.field_name === key);
            const conflict = getConflictForField(key);
            const confScore = trusted ? trusted.confidence : (conflict ? conflict.confidence : 0);
            const state = trusted ? trusted.resolution_state : (conflict ? conflict.status : "UNRESOLVED");
            const displayVal = trusted ? trusted.value : (conflict?.recommended_value || "—");

            return (
              <div key={key} className="py-3.5 sm:py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
                <div className="space-y-1 max-w-md">
                  <span className="text-[11px] sm:text-xs font-semibold text-slate-400 font-mono uppercase tracking-wider block">
                    {label}
                  </span>
                  <div className="text-sm font-bold text-white flex flex-wrap items-center gap-2">
                    <span>{displayVal || "Unresolved"}</span>
                    {trusted && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {trusted.decided_by}
                      </span>
                    )}
                  </div>
                  {trusted?.source_names && trusted.source_names.length > 0 && (
                    <div className="text-[11px] text-slate-400">
                      Sources: <span className="text-cyan-400 font-mono">{trusted.source_names.join(", ")}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
                  {/* Confidence */}
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono uppercase block mb-1">Field Confidence</span>
                    <ConfidenceBar score={confScore} />
                  </div>

                  {/* Status Badge */}
                  <StatusBadge status={state} />

                  {/* "Why?" Button */}
                  <button
                    onClick={() => setSelectedFieldWhy({ field: label, trusted, conflict })}
                    className="px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/40 text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Why?</span>
                  </button>

                  {/* Conflict Copilot Button */}
                  {conflict && (
                    <button
                      onClick={() => onOpenCopilot(conflict.id)}
                      className="px-3 py-1.5 rounded-lg bg-violet-950/60 hover:bg-violet-900/60 text-violet-300 border border-violet-800/40 text-xs font-semibold transition-colors flex items-center space-x-1 cursor-pointer"
                      title="Ask Conflict Copilot"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                      <span>Copilot</span>
                    </button>
                  )}

                  {/* Web Verify Button */}
                  {conflict && conflict.status !== "auto_resolved" && (
                    <button
                      onClick={() => handleWebVerify(key)}
                      disabled={isVerifying === key}
                      className="px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/40 text-xs font-semibold transition-colors flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                    >
                      {isVerifying === key ? (
                        <Activity className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                      ) : (
                        <Search className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      <span>Web Verify</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Original Preserved Records Side-by-Side */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center space-x-2">
              <Database className="w-5 h-5 text-cyan-400 shrink-0" />
              <span>Original Source Records Preserved Intact</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Crucial UX Rule: Reconciliation NEVER overwrites or deletes incoming source data. Original ERP, CRM, and Excel values remain preserved.
            </p>
          </div>
          <span className="text-[10px] sm:text-[11px] font-mono text-cyan-400 bg-cyan-950/50 border border-cyan-800/40 px-2.5 py-1 rounded-full self-start sm:self-auto shrink-0">
            {entity.records.length} Records Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {entity.records.map((rec) => (
            <div
              key={rec.id}
              className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-cyan-400 font-mono">{rec.source_name}</span>
                <span className="text-[10px] font-mono text-slate-500">#{rec.external_record_id}</span>
              </div>

              <div className="space-y-1.5 font-mono text-xs">
                {Object.entries(rec.raw_data).map(([k, v]) => (
                  <div key={k} className="flex items-start justify-between text-[11px] gap-2">
                    <span className="text-slate-500 truncate max-w-[110px]" title={k}>{k}:</span>
                    <span className={`text-right truncate max-w-[150px] ${String(v).includes("18 MG") ? "text-amber-400 font-semibold" : "text-slate-200"}`} title={String(v)}>
                      {String(v)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between font-mono">
                <span>Preserved Original</span>
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* "Why?" Evidence Trail Modal */}
      {selectedFieldWhy && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2.5 sm:p-4">
          <div className="glass-panel bg-[#0B1120] border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="truncate">Evidence Trail: {selectedFieldWhy.field}</span>
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                  Complete mathematical and evidentiary provenance behind this field value.
                </p>
              </div>
              <button
                onClick={() => setSelectedFieldWhy(null)}
                className="text-slate-400 hover:text-white text-xs font-mono px-3 py-1 bg-slate-800 rounded-lg shrink-0 cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Confidence & Status */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Selected Trusted Value</span>
                  <span className="text-sm font-bold text-white">
                    {selectedFieldWhy.trusted?.value || selectedFieldWhy.conflict?.recommended_value || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Confidence Score</span>
                  <ConfidenceBar
                    score={selectedFieldWhy.trusted?.confidence || selectedFieldWhy.conflict?.confidence || 0}
                  />
                </div>
              </div>

              {/* Rationale / Reasoning */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono mb-2">
                  Zero-Trust Decision Rationale
                </h4>
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
                  {selectedFieldWhy.trusted?.reasoning ||
                    selectedFieldWhy.conflict?.reasoning ||
                    "Evaluated against zero-trust criteria."}
                </div>
              </div>

              {/* Contested Values Across Sources */}
              {selectedFieldWhy.conflict && selectedFieldWhy.conflict.values.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono mb-2">
                    Original Source Values Compared
                  </h4>
                  <div className="space-y-2">
                    {selectedFieldWhy.conflict.values.map((v) => (
                      <div
                        key={v.id}
                        className={`p-3 rounded-lg border text-xs flex items-center justify-between ${v.is_selected ? "bg-emerald-950/30 border-emerald-700/50 text-emerald-300" : "bg-slate-900 border-slate-800 text-slate-300"}`}
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold">{v.value}</span>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Source: {v.source_name} (Authority weight: {v.authority_score})
                          </div>
                        </div>
                        {v.is_selected && (
                          <span className="text-[10px] font-semibold text-emerald-400 font-mono">SELECTED VALUE</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* External Corroborating Evidence */}
              {selectedFieldWhy.conflict && selectedFieldWhy.conflict.evidence_items.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono mb-2">
                    Corroborating External Evidence
                  </h4>
                  <div className="space-y-2.5">
                    {selectedFieldWhy.conflict.evidence_items.map((ev) => (
                      <div key={ev.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-cyan-400">{ev.source_title}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            Relevance: {ev.relevance}
                          </span>
                        </div>
                        {ev.raw_snippet && (
                          <p className="text-[11px] text-slate-400 italic bg-slate-950/60 p-2 rounded border border-slate-800/80">
                            "{ev.raw_snippet}"
                          </p>
                        )}
                        <div className="text-[10px] text-slate-500 flex items-center justify-between font-mono">
                          <span>Value: '{ev.value}'</span>
                          <span>Authority: {ev.authority}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
