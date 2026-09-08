import React from "react";
import { Play, Activity, Menu } from "lucide-react";
import { DashboardStats } from "../../types";

interface HeaderProps {
  title: string;
  subtitle: string;
  stats?: DashboardStats | null;
  onRunReconciliation: () => void;
  isRunning: boolean;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  stats,
  onRunReconciliation,
  isRunning,
  onToggleMobileMenu,
}) => {
  return (
    <header className="h-16 md:h-18 bg-[#090E1A]/90 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-30 px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2">
      <div className="flex items-center space-x-3 min-w-0">
        {/* Mobile menu trigger */}
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 -ml-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors focus:outline-none shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h1 className="text-sm sm:text-base md:text-lg font-bold text-white tracking-tight flex items-center space-x-2 truncate">
            <span className="truncate">{title}</span>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-950/60 text-cyan-400 border border-cyan-800/40 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse mr-1.5" />
              Live Engine
            </span>
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 truncate hidden sm:block">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center space-x-6">
        {stats && (
          <div className="hidden lg:flex items-center space-x-5 text-xs text-slate-400 border-r border-slate-800/80 pr-6">
            <div>
              <span className="text-slate-500 font-mono uppercase text-[10px] block">Records</span>
              <span className="font-semibold text-white font-mono">{stats.total_records.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-500 font-mono uppercase text-[10px] block">Entities</span>
              <span className="font-semibold text-cyan-400 font-mono">{stats.unique_entities.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-500 font-mono uppercase text-[10px] block">Auto-Resolved</span>
              <span className="font-semibold text-emerald-400 font-mono">{stats.auto_resolved.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-500 font-mono uppercase text-[10px] block">Review Queue</span>
              <span className="font-semibold text-amber-400 font-mono">{stats.needs_review.toLocaleString()}</span>
            </div>
          </div>
        )}

        <button
          onClick={onRunReconciliation}
          disabled={isRunning}
          className="flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white text-xs font-semibold shadow-lg shadow-cyan-900/30 active:scale-95 transition-all disabled:opacity-50 shrink-0 cursor-pointer"
        >
          {isRunning ? (
            <>
              <Activity className="w-3.5 h-3.5 animate-spin" />
              <span>Processing<span className="hidden sm:inline"> Pipeline</span>...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run<span className="hidden sm:inline"> Pipeline</span></span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
