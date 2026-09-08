import React, { useState, useEffect } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { DashboardPage } from "./components/dashboard/DashboardPage";
import { SourcesPage } from "./components/sources/SourcesPage";
import { ReconciliationPage } from "./components/reconciliation/ReconciliationPage";
import { EntityDetailPage } from "./components/entity/EntityDetailPage";
import { EvidenceGraphPage } from "./components/graph/EvidenceGraphPage";
import { ReviewQueuePage } from "./components/review/ReviewQueuePage";
import { AuditLedgerPage } from "./components/audit/AuditLedgerPage";
import { SettingsPage } from "./components/layout/SettingsPage";
import { ConflictCopilotModal } from "./components/copilot/ConflictCopilotModal";
import {
  LayoutDashboard,
  FolderUp,
  GitMerge,
  ShieldAlert,
  Menu as MenuIcon
} from "lucide-react";

import {
  DashboardStats,
  Source,
  Entity,
  EntityDetail,
  Conflict,
  AuditLog
} from "./types";
import { api } from "./services/api";

export function App() {
  const [currentTab, setCurrentTab] = useState<string>("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [reviewConflicts, setReviewConflicts] = useState<Conflict[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [selectedEntityDetail, setSelectedEntityDetail] = useState<EntityDetail | null>(null);
  const [graphEntityId, setGraphEntityId] = useState<number | undefined>(undefined);
  const [activeCopilotConflictId, setActiveCopilotConflictId] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isReconciling, setIsReconciling] = useState<boolean>(false);
  const [isDemoLoading, setIsDemoLoading] = useState<boolean>(false);

  const refreshAllData = async () => {
    try {
      const [statsData, sourcesData, entitiesData, reviewData, auditData] = await Promise.all([
        api.getDashboardStats().catch(() => null),
        api.getSources().catch(() => []),
        api.getEntities().catch(() => []),
        api.getReviewQueue().catch(() => []),
        api.getAuditLogs().catch(() => []),
      ]);

      if (statsData) setStats(statsData);
      setSources(sourcesData);
      setEntities(entitiesData);
      setReviewConflicts(reviewData);
      setAuditLogs(auditData);

      // If we are currently viewing an entity, refresh its details
      if (selectedEntityDetail) {
        api.getEntityDetail(selectedEntityDetail.id)
          .then((detail) => setSelectedEntityDetail(detail))
          .catch(() => {});
      }
    } catch (err) {
      console.error("Failed to load application data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  const handleRunReconciliation = async () => {
    try {
      setIsReconciling(true);
      await api.runReconciliation();
      await refreshAllData();
    } catch (err) {
      console.error("Reconciliation failed:", err);
    } finally {
      setIsReconciling(false);
    }
  };

  const handleRunDemo = async () => {
    try {
      setIsDemoLoading(true);
      const res = await api.loadDemoData();
      await refreshAllData();

      // Automatically find John Smith / TechCorp entity and open it if desired
      const ents = await api.getEntities();
      const johnEntity = ents.find((e) => e.canonical_name.toLowerCase().includes("techcorp") || e.canonical_name.toLowerCase().includes("smith"));
      if (johnEntity) {
        const detail = await api.getEntityDetail(johnEntity.id);
        setSelectedEntityDetail(detail);
        setCurrentTab("reconciliation");
      }
    } catch (err) {
      console.error("Demo load failed:", err);
    } finally {
      setIsDemoLoading(false);
    }
  };

  const handleSelectEntity = async (entityId: number) => {
    try {
      setIsLoading(true);
      const detail = await api.getEntityDetail(entityId);
      setSelectedEntityDetail(detail);
    } catch (err) {
      console.error("Failed to fetch entity details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenGraph = (entityId: number) => {
    setGraphEntityId(entityId);
    setCurrentTab("graph");
  };

  // Determine page header title & subtitle
  const getHeaderMeta = () => {
    switch (currentTab) {
      case "dashboard":
        return {
          title: "Executive Intelligence Dashboard",
          subtitle: "Zero-trust reconciliation metrics, entity deduplication, and risk breakdown.",
        };
      case "sources":
        return {
          title: "Multi-Source Data Ingestion Catalog",
          subtitle: "Original schemas, file uploads, canonical mappings, and untouched raw records.",
        };
      case "reconciliation":
        return {
          title: selectedEntityDetail ? `Golden Record: ${selectedEntityDetail.canonical_name}` : "Entity Resolution & Discrepancy Reconciliation",
          subtitle: selectedEntityDetail
            ? "Inspect field confidence, external evidence provenance, and preserved original values."
            : "Clustered canonical entities, matching features, and field evaluation status.",
        };
      case "review":
        return {
          title: "Human-in-the-Loop Governance Queue",
          subtitle: "Review cases with confidence between 70% and 89%, or blocked sensitive attributes.",
        };
      case "graph":
        return {
          title: "Interactive Hierarchical Evidence Graph",
          subtitle: "Source -> Record -> Entity -> Field -> Evidence -> Decision -> Trusted Record.",
        };
      case "audit":
        return {
          title: "Cryptographic Tamper-Evident Audit Ledger",
          subtitle: "Immutable event history of ingestion, AI recommendations, and operator actions.",
        };
      case "settings":
        return {
          title: "Zero-Trust Governance & Threshold Configuration",
          subtitle: "Calibrate automated reconciliation cutoffs and relative source authority weights.",
        };
      default:
        return { title: "VeriMerge", subtitle: "Evidence-First Data Reconciliation" };
    }
  };

  const headerMeta = getHeaderMeta();

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex">
      {/* Sidebar Navigation (drawer on mobile, fixed on desktop) */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          if (tab !== "reconciliation") {
            setSelectedEntityDetail(null);
          }
          setCurrentTab(tab);
        }}
        reviewCount={stats?.needs_review || reviewConflicts.length}
        onRunDemo={handleRunDemo}
        isDemoLoading={isDemoLoading}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 ml-0 lg:ml-64 flex flex-col min-w-0 transition-all duration-200">
        <Header
          title={headerMeta.title}
          subtitle={headerMeta.subtitle}
          stats={stats}
          onRunReconciliation={handleRunReconciliation}
          isRunning={isReconciling}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        />

        <main className="flex-1 p-3.5 sm:p-5 md:p-6 lg:p-8 pb-22 lg:pb-8 overflow-y-auto">
          {currentTab === "dashboard" && (
            <DashboardPage
              stats={stats}
              isLoading={isLoading}
              onNavigate={(tab) => setCurrentTab(tab)}
              onRunDemo={handleRunDemo}
              isDemoLoading={isDemoLoading}
            />
          )}

          {currentTab === "sources" && (
            <SourcesPage
              sources={sources}
              onRefresh={refreshAllData}
              onNavigate={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === "reconciliation" && (
            selectedEntityDetail ? (
              <EntityDetailPage
                entity={selectedEntityDetail}
                onBack={() => setSelectedEntityDetail(null)}
                onOpenGraph={handleOpenGraph}
                onOpenCopilot={(conflictId) => setActiveCopilotConflictId(conflictId)}
                onRefresh={refreshAllData}
              />
            ) : (
              <ReconciliationPage
                entities={entities}
                onSelectEntity={handleSelectEntity}
                onOpenGraph={handleOpenGraph}
                onOpenCopilot={(conflictId) => setActiveCopilotConflictId(conflictId)}
                onRunReconciliation={handleRunReconciliation}
                isRunning={isReconciling}
              />
            )
          )}

          {currentTab === "review" && (
            <ReviewQueuePage
              conflicts={reviewConflicts}
              onRefresh={refreshAllData}
              onOpenCopilot={(conflictId) => setActiveCopilotConflictId(conflictId)}
            />
          )}

          {currentTab === "graph" && (
            <EvidenceGraphPage
              entities={entities}
              selectedEntityId={graphEntityId}
            />
          )}

          {currentTab === "audit" && (
            <AuditLedgerPage
              logs={auditLogs}
              onRefresh={refreshAllData}
            />
          )}

          {currentTab === "settings" && <SettingsPage />}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Phone only) */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090E1A]/95 backdrop-blur-lg border-t border-slate-800 px-1 py-1.5 flex items-center justify-around shadow-lg"
      >
        <button
          onClick={() => {
            setSelectedEntityDetail(null);
            setCurrentTab("dashboard");
          }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors text-[10px] font-medium ${
            currentTab === "dashboard" ? "text-cyan-400 font-semibold" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => {
            setSelectedEntityDetail(null);
            setCurrentTab("sources");
          }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors text-[10px] font-medium ${
            currentTab === "sources" ? "text-cyan-400 font-semibold" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <FolderUp className="w-5 h-5 mb-0.5" />
          <span>Ingestion</span>
        </button>

        <button
          onClick={() => {
            setSelectedEntityDetail(null);
            setCurrentTab("reconciliation");
          }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors text-[10px] font-medium ${
            currentTab === "reconciliation" ? "text-cyan-400 font-semibold" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <GitMerge className="w-5 h-5 mb-0.5" />
          <span>Reconcile</span>
        </button>

        <button
          onClick={() => {
            setSelectedEntityDetail(null);
            setCurrentTab("review");
          }}
          className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors text-[10px] font-medium ${
            currentTab === "review" ? "text-cyan-400 font-semibold" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <div className="relative">
            <ShieldAlert className="w-5 h-5 mb-0.5" />
            {(stats?.needs_review || reviewConflicts.length) > 0 && (
              <span className="absolute -top-1 -right-2 px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-amber-500 text-slate-950">
                {stats?.needs_review || reviewConflicts.length}
              </span>
            )}
          </div>
          <span>Review</span>
        </button>

        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-lg text-slate-400 hover:text-slate-200 transition-colors text-[10px] font-medium"
        >
          <MenuIcon className="w-5 h-5 mb-0.5" />
          <span>More</span>
        </button>
      </nav>

      {/* Conflict Copilot Assistant Modal */}
      {activeCopilotConflictId && (
        <ConflictCopilotModal
          conflictId={activeCopilotConflictId}
          onClose={() => setActiveCopilotConflictId(null)}
        />
      )}
    </div>
  );
}

export default App;
