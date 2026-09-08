import React from "react";
import {
  LayoutDashboard,
  FolderUp,
  GitMerge,
  ShieldAlert,
  Network,
  History,
  Sliders,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  X
} from "lucide-react";

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  reviewCount?: number;
  onRunDemo?: () => void;
  isDemoLoading?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  reviewCount = 0,
  onRunDemo,
  isDemoLoading = false,
  isOpen = false,
  onClose,
}) => {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "sources", label: "Data Ingestion", icon: FolderUp },
    { id: "reconciliation", label: "Reconciliation", icon: GitMerge },
    {
      id: "review",
      label: "Human Review",
      icon: ShieldAlert,
      badge: reviewCount > 0 ? reviewCount : undefined,
      badgeColor: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
    },
    { id: "graph", label: "Evidence Graph", icon: Network },
    { id: "audit", label: "Audit Ledger", icon: History },
    { id: "settings", label: "Trust Thresholds", icon: Sliders },
  ];

  const handleNavClick = (tabId: string) => {
    setCurrentTab(tabId);
    if (onClose) onClose();
  };

  const handleDemoClick = () => {
    if (onRunDemo) {
      onRunDemo();
      if (onClose) onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`w-64 bg-[#090E1A] border-r border-slate-800 flex flex-col justify-between h-screen fixed left-0 top-0 z-50 select-none transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0 shadow-2xl shadow-cyan-950/50" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="overflow-y-auto">
          {/* Logo & Brand Header */}
          <div className="p-5 sm:p-6 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-violet-600 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-xl font-bold tracking-tight text-white font-mono">Veri<span className="text-cyan-400">Merge</span></span>
                </div>
                <p className="text-[11px] font-medium text-slate-400 tracking-wide uppercase">Evidence-First Trust</p>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 1-Click Live Demo Banner */}
          <div className="px-4 pt-4 pb-2">
            <button
              onClick={handleDemoClick}
              disabled={isDemoLoading}
              className="w-full relative group overflow-hidden rounded-xl p-[1px] focus:outline-none transition-all duration-300 shadow-lg shadow-cyan-900/30 active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-violet-500 to-pink-500 animate-pulse group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative px-3.5 py-2.5 rounded-[11px] bg-[#0c1322] flex items-center justify-between text-left">
                <div className="flex items-center space-x-2.5">
                  <Sparkles className={`w-4 h-4 text-cyan-400 ${isDemoLoading ? "animate-spin" : ""}`} />
                  <div>
                    <div className="text-xs font-semibold text-white tracking-wide">
                      {isDemoLoading ? "Reconciling..." : "Run Live Demo"}
                    </div>
                    <div className="text-[10px] text-slate-400">Seed CRM, ERP & Web</div>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 tracking-wider uppercase">Workspace</div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-500/15 to-violet-500/10 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/10 font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-500"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Core Principle Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-[#070B14]/70">
          <div className="flex items-center space-x-2 text-[11px] text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Zero Overwrite Guarantee</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
            Source records and original values are permanently preserved in the immutable ledger.
          </p>
        </div>
      </aside>
    </>
  );
};
