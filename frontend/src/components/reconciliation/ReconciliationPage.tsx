import React, { useState } from "react";
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Search,
  ExternalLink,
  ShieldCheck,
  Layers,
  Network
} from "lucide-react";
import { Entity, Conflict } from "../../types";
import { StatusBadge } from "../layout/StatusBadge";
import { ConfidenceBar } from "../layout/ConfidenceBar";

interface ReconciliationPageProps {
  entities: Entity[];
  onSelectEntity: (entityId: number) => void;
  onOpenGraph: (entityId: number) => void;
  onOpenCopilot: (conflictId: number) => void;
  onRunReconciliation: () => void;
  isRunning: boolean;
}

export const ReconciliationPage: React.FC<ReconciliationPageProps> = ({
  entities,
  onSelectEntity,
  onOpenGraph,
  onOpenCopilot,
  onRunReconciliation,
  isRunning,
}) => {
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEntities = entities.filter((e) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "auto" && e.status === "auto_reconciled") ||
      (filter === "review" && e.status === "needs_review") ||
      (filter === "blocked" && e.status === "blocked");

    const matchesSearch =
      e.canonical_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.matching_features.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-5 sm:space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-white flex items-center space-x-2">
            <Users className="w-5 h-5 text-cyan-400 shrink-0" />
            <span>Entity Resolution & Discrepancy Manager</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Multi-signal deterministic & fuzzy clustering groups fragmented records into canonical entities.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
          {/* Search */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search entities or features..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-56 bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs overflow-x-auto">
            <button
              onClick={() => setFilter("all")}
              className={`flex-1 sm:flex-initial px-3 py-1 rounded-md transition-colors text-center ${filter === "all" ? "bg-cyan-600 text-white font-semibold" : "text-slate-400 hover:text-white"}`}
            >
              All ({entities.length})
            </button>
            <button
              onClick={() => setFilter("auto")}
              className={`flex-1 sm:flex-initial px-3 py-1 rounded-md transition-colors text-center ${filter === "auto" ? "bg-emerald-600 text-white font-semibold" : "text-slate-400 hover:text-white"}`}
            >
              Auto
            </button>
            <button
              onClick={() => setFilter("review")}
              className={`flex-1 sm:flex-initial px-3 py-1 rounded-md transition-colors text-center ${filter === "review" ? "bg-amber-600 text-white font-semibold" : "text-slate-400 hover:text-white"}`}
            >
              Review
            </button>
            <button
              onClick={() => setFilter("blocked")}
              className={`flex-1 sm:flex-initial px-3 py-1 rounded-md transition-colors text-center ${filter === "blocked" ? "bg-rose-600 text-white font-semibold" : "text-slate-400 hover:text-white"}`}
            >
              Blocked
            </button>
          </div>
        </div>
      </div>

      {/* Entity Cards Grid */}
      <div className="grid grid-cols-1 gap-3.5 sm:gap-4">
        {filteredEntities.length === 0 ? (
          <div className="glass-panel rounded-2xl p-8 sm:p-12 text-center border border-slate-800">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-300">No entities found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Upload source datasets or trigger the reconciliation pipeline.
            </p>
          </div>
        ) : (
          filteredEntities.map((entity) => (
            <div
              key={entity.id}
              className="glass-panel glass-panel-hover rounded-xl p-4 sm:p-5 border border-slate-800 bg-[#0B1120]/60 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="text-sm sm:text-base font-bold text-white tracking-tight hover:text-cyan-400 cursor-pointer"
                      onClick={() => onSelectEntity(entity.id)}
                    >
                      {entity.canonical_name}
                    </span>
                    <StatusBadge status={entity.status} />
                    <span className="text-[10px] sm:text-[11px] font-mono text-slate-400">
                      Entity #{entity.id}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className="flex items-center space-x-1 text-slate-300">
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{entity.record_count} Records</span>
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-pink-400 font-semibold">
                      {entity.conflict_count} Fields
                    </span>
                    <span className="text-slate-600">•</span>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-slate-400">Confidence:</span>
                      <ConfidenceBar score={entity.match_confidence} />
                    </div>
                  </div>

                  {/* Matching Signals */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {entity.matching_features.map((feat, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-cyan-300 border border-slate-700/60"
                      >
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800/80">
                  <button
                    onClick={() => onOpenGraph(entity.id)}
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Network className="w-3.5 h-3.5 text-violet-400" />
                    <span>Evidence Graph</span>
                  </button>
                  <button
                    onClick={() => onSelectEntity(entity.id)}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white text-xs font-bold shadow-md shadow-cyan-900/20 active:scale-95 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <span>Inspect Golden Record</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
