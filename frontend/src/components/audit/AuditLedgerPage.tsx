import React, { useState } from "react";
import {
  History,
  Search,
  Filter,
  CheckCircle,
  FileText,
  UserCheck,
  ShieldAlert,
  Database,
  Calendar,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { AuditLog } from "../../types";

interface AuditLedgerPageProps {
  logs: AuditLog[];
  onRefresh: () => void;
}

export const AuditLedgerPage: React.FC<AuditLedgerPageProps> = ({ logs, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("all");

  const filteredLogs = logs.filter((log) => {
    const matchesAction = selectedAction === "all" || log.action === selectedAction;
    const matchesSearch =
      log.event_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.field && log.field.toLowerCase().includes(searchTerm.toLowerCase())) ||
      log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.reason && log.reason.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesAction && matchesSearch;
  });

  const uniqueActions = Array.from(new Set(logs.map((l) => l.action)));

  const getActionBadge = (action: string) => {
    if (action.includes("APPROVAL") || action.includes("TRUSTED")) {
      return "bg-emerald-950/60 text-emerald-400 border-emerald-800/40";
    }
    if (action.includes("RECOMMENDATION") || action.includes("EVIDENCE")) {
      return "bg-cyan-950/60 text-cyan-400 border-cyan-800/40";
    }
    if (action.includes("CONFLICT")) {
      return "bg-pink-950/60 text-pink-400 border-pink-800/40";
    }
    if (action.includes("REJECTION") || action.includes("BLOCKED")) {
      return "bg-rose-950/60 text-rose-400 border-rose-800/40";
    }
    return "bg-slate-800 text-slate-300 border-slate-700";
  };

  return (
    <div className="space-y-5 sm:space-y-6 pb-12">
      {/* Header & Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-white flex items-center space-x-2">
            <History className="w-5 h-5 text-cyan-400 shrink-0" />
            <span>Immutable Audit Ledger & Provenance Trail</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Complete cryptographic audit trail of all ingestion, matching, AI recommendation, and human governance decisions.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
          {/* Search */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search event ID, actor, field..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-56 bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Action Filter */}
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="w-full sm:w-auto bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Actions ({logs.length})</option>
            {uniqueActions.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Ledger Container */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-slate-800">
        {/* Mobile Card View (< md) */}
        <div className="block md:hidden space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="py-8 text-center text-slate-500 font-mono text-xs">
              No matching audit records found.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-cyan-400 text-xs">{log.event_id}</span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold font-mono border ${getActionBadge(
                      log.action
                    )}`}
                  >
                    {log.action}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Actor:</span>
                    <span className="text-slate-300 truncate block">{log.actor}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Entity:</span>
                    <span className="text-slate-300 block">{log.entity_id ? `Entity #${log.entity_id}` : "—"}</span>
                  </div>
                  {log.field && (
                    <div>
                      <span className="text-slate-500 block text-[10px]">Field:</span>
                      <span className="text-violet-400 font-semibold block">{log.field}</span>
                    </div>
                  )}
                  {log.new_value && (
                    <div>
                      <span className="text-slate-500 block text-[10px]">New Value:</span>
                      <span className="text-emerald-300 truncate block">{log.new_value}</span>
                    </div>
                  )}
                </div>

                {log.reason && (
                  <p className="text-[11px] text-slate-400 leading-relaxed">{log.reason}</p>
                )}

                <div className="text-[10px] text-slate-500 font-mono text-right pt-1 border-t border-slate-800/60">
                  {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 text-[10px] uppercase font-mono border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">Event ID</th>
                <th className="py-3 px-3">Action</th>
                <th className="py-3 px-3">Actor</th>
                <th className="py-3 px-3">Entity</th>
                <th className="py-3 px-3">Field</th>
                <th className="py-3 px-3">New Value</th>
                <th className="py-3 px-3">Justification & Provenance</th>
                <th className="py-3 px-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-mono">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-cyan-400 whitespace-nowrap">
                      {log.event_id}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono border ${getActionBadge(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                      {log.actor}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400 whitespace-nowrap">
                      {log.entity_id ? `Entity #${log.entity_id}` : "—"}
                    </td>
                    <td className="py-3 px-3 font-mono text-violet-400 font-semibold whitespace-nowrap">
                      {log.field || "—"}
                    </td>
                    <td className="py-3 px-3 font-mono text-emerald-300 max-w-[140px] truncate" title={log.new_value || ""}>
                      {log.new_value || "—"}
                    </td>
                    <td className="py-3 px-3 max-w-xs truncate text-slate-400 text-[11px]" title={log.reason || ""}>
                      {log.reason}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-500 whitespace-nowrap text-[11px]">
                      {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
