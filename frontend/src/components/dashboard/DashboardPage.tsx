import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend
} from "recharts";
import {
  FileText,
  Users,
  AlertOctagon,
  CheckCircle2,
  Clock,
  ShieldX,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Activity
} from "lucide-react";
import { DashboardStats } from "../../types";

interface DashboardPageProps {
  stats: DashboardStats | null;
  isLoading: boolean;
  onNavigate: (tab: string) => void;
  onRunDemo: () => void;
  isDemoLoading: boolean;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stats,
  isLoading,
  onNavigate,
  onRunDemo,
  isDemoLoading,
}) => {
  if (isLoading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Activity className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
        <p className="text-sm text-slate-400">Loading enterprise intelligence dashboard...</p>
      </div>
    );
  }

  const s = stats || {
    total_records: 0,
    unique_entities: 0,
    total_conflicts: 0,
    auto_resolved: 0,
    needs_review: 0,
    blocked: 0,
    conflicts_by_source: [],
    conflicts_by_field: [],
    confidence_distribution: [],
    reconciliation_status: [],
    recent_activity: [],
  };

  const PIE_COLORS = ["#10B981", "#F59E0B", "#EF4444"];

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Hero Live Walkthrough CTA if no records or ready */}
      <div className="relative overflow-hidden rounded-2xl p-4 sm:p-6 bg-gradient-to-r from-cyan-950/40 via-slate-900/80 to-violet-950/40 border border-cyan-500/20 shadow-xl shadow-cyan-950/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>Evidence-First Reconciliation Pipeline</span>
            </div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-tight">
              Reconcile Conflicting Digital Records with Zero Data Loss
            </h2>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
              VeriMerge ingests CRM, ERP, and unstructured records, executes multi-signal entity clustering, calculates field-level zero-trust confidence, and automatically gathers corroborating external evidence.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 shrink-0">
            <button
              onClick={onRunDemo}
              disabled={isDemoLoading}
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className={`w-4 h-4 shrink-0 ${isDemoLoading ? "animate-spin" : ""}`} />
              <span>{isDemoLoading ? "Seeding & Reconciling..." : "1-Click Live Demo"}</span>
            </button>
            <button
              onClick={() => onNavigate("sources")}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <span>Upload Custom Data</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
        <div className="glass-panel rounded-xl p-3 sm:p-4 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1.5 sm:mb-2">
            <span className="text-[10px] sm:text-[11px] font-mono uppercase font-semibold truncate">Total Records</span>
            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono">{s.total_records.toLocaleString()}</div>
          <span className="text-[9px] sm:text-[10px] text-slate-500 mt-1 block truncate">Preserved across all</span>
        </div>

        <div className="glass-panel rounded-xl p-3 sm:p-4 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1.5 sm:mb-2">
            <span className="text-[10px] sm:text-[11px] font-mono uppercase font-semibold truncate">Unique Entities</span>
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-violet-300 font-mono">{s.unique_entities.toLocaleString()}</div>
          <span className="text-[9px] sm:text-[10px] text-slate-500 mt-1 block truncate">Clustered signals</span>
        </div>

        <div className="glass-panel rounded-xl p-3 sm:p-4 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1.5 sm:mb-2">
            <span className="text-[10px] sm:text-[11px] font-mono uppercase font-semibold truncate">Conflicts</span>
            <AlertOctagon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-pink-400 font-mono">{s.total_conflicts.toLocaleString()}</div>
          <span className="text-[9px] sm:text-[10px] text-slate-500 mt-1 block truncate">Field discrepancies</span>
        </div>

        <div className="glass-panel rounded-xl p-3 sm:p-4 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1.5 sm:mb-2">
            <span className="text-[10px] sm:text-[11px] font-mono uppercase font-semibold truncate">Auto-Resolved</span>
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono">{s.auto_resolved.toLocaleString()}</div>
          <span className="text-[9px] sm:text-[10px] text-slate-500 mt-1 block truncate">Confidence &ge; 90%</span>
        </div>

        <div className="glass-panel rounded-xl p-3 sm:p-4 border border-slate-800 cursor-pointer hover:border-amber-500/40 transition-colors" onClick={() => onNavigate("review")}>
          <div className="flex items-center justify-between text-slate-400 mb-1.5 sm:mb-2">
            <span className="text-[10px] sm:text-[11px] font-mono uppercase font-semibold truncate">Needs Review</span>
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-400 font-mono">{s.needs_review.toLocaleString()}</div>
          <span className="text-[9px] sm:text-[10px] text-amber-500/80 mt-1 block truncate">70% &le; Conf &lt; 90%</span>
        </div>

        <div className="glass-panel rounded-xl p-3 sm:p-4 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1.5 sm:mb-2">
            <span className="text-[10px] sm:text-[11px] font-mono uppercase font-semibold truncate">Blocked</span>
            <ShieldX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-rose-400 font-mono">{s.blocked.toLocaleString()}</div>
          <span className="text-[9px] sm:text-[10px] text-rose-500/80 mt-1 block truncate">Confidence &lt; 70%</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Confidence Distribution */}
        <div className="glass-panel rounded-xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white tracking-wide">Confidence Score Distribution</h3>
            <span className="text-[11px] text-slate-400 font-mono">Zero-Trust Boundaries</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={s.confidence_distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="range" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0F172A", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                  cursor={{ fill: "rgba(30, 41, 59, 0.4)" }}
                />
                <Bar dataKey="count" fill="#06B6D4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Conflicts by Field */}
        <div className="glass-panel rounded-xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white tracking-wide">Conflicts by Canonical Field</h3>
            <span className="text-[11px] text-slate-400 font-mono">Discrepancy Hotspots</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={s.conflicts_by_field} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                <XAxis type="number" stroke="#64748B" fontSize={11} tickLine={false} allowDecimals={false} />
                <YAxis dataKey="field" type="category" stroke="#94A3B8" fontSize={11} tickLine={false} width={90} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0F172A", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                  cursor={{ fill: "rgba(30, 41, 59, 0.4)" }}
                />
                <Bar dataKey="count" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Conflicts by Source */}
        <div className="glass-panel rounded-xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white tracking-wide">Discrepancies by Source System</h3>
            <span className="text-[11px] text-slate-400 font-mono">Source Inconsistencies</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={s.conflicts_by_source}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="source" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0F172A", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                  cursor={{ fill: "rgba(30, 41, 59, 0.4)" }}
                />
                <Bar dataKey="count" fill="#EC4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Reconciliation Status Breakdown */}
        <div className="glass-panel rounded-xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white tracking-wide">Reconciliation Outcome Status</h3>
            <span className="text-[11px] text-slate-400 font-mono">Governance Routing</span>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={s.reconciliation_status}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                >
                  {s.reconciliation_status.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#0F172A", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                />
                <Legend
                  formatter={(value) => <span className="text-xs text-slate-300">{value}</span>}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Ledger Preview */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white tracking-wide flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span>Live Audit Event Stream</span>
          </h3>
          <button
            onClick={() => onNavigate("audit")}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center space-x-1"
          >
            <span>View Full Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mobile Card List (< md) */}
        <div className="block md:hidden space-y-2.5">
          {s.recent_activity.length === 0 ? (
            <div className="py-6 text-center text-slate-500 text-xs">
              No reconciliation events logged yet. Run the pipeline or load demo data.
            </div>
          ) : (
            s.recent_activity.slice(0, 6).map((log) => (
              <div key={log.id} className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-cyan-400 font-semibold text-[11px]">{log.event_id}</span>
                  <span className="font-mono text-[10px] text-slate-500">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-[11px]">{log.action}</span>
                  {log.field && (
                    <span className="font-mono text-[10px] text-violet-400 bg-violet-950/40 px-1.5 py-0.5 rounded border border-violet-800/40">
                      {log.field}
                    </span>
                  )}
                </div>
                {log.reason && (
                  <p className="text-[11px] text-slate-400 line-clamp-2">{log.reason}</p>
                )}
                <div className="text-[10px] text-slate-500 font-mono">
                  Actor: <span className="text-slate-400">{log.actor}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/60 text-slate-400 text-[10px] uppercase font-mono border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Event ID</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Actor</th>
                <th className="py-2.5 px-3">Field</th>
                <th className="py-2.5 px-3">Reason / Details</th>
                <th className="py-2.5 px-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {s.recent_activity.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500">
                    No reconciliation events logged yet. Run the pipeline or load demo data.
                  </td>
                </tr>
              ) : (
                s.recent_activity.slice(0, 6).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-mono text-cyan-400 font-semibold">{log.event_id}</td>
                    <td className="py-2.5 px-3 font-semibold text-white">{log.action}</td>
                    <td className="py-2.5 px-3 text-slate-400">{log.actor}</td>
                    <td className="py-2.5 px-3 font-mono text-violet-400">{log.field || "—"}</td>
                    <td className="py-2.5 px-3 max-w-md truncate text-slate-300" title={log.reason}>
                      {log.reason}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
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
