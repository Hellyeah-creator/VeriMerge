import React, { useState, useEffect } from "react";
import {
  Network,
  Layers,
  Sparkles,
  Info,
  CheckCircle,
  Database,
  FileText,
  ShieldCheck,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from "lucide-react";
import { EvidenceGraphData, GraphNode, Entity } from "../../types";
import { api } from "../../services/api";

interface EvidenceGraphPageProps {
  entities: Entity[];
  selectedEntityId?: number;
}

export const EvidenceGraphPage: React.FC<EvidenceGraphPageProps> = ({
  entities,
  selectedEntityId,
}) => {
  const [currentEntityId, setCurrentEntityId] = useState<number>(
    selectedEntityId || (entities.length > 0 ? entities[0].id : 1)
  );

  const [graphData, setGraphData] = useState<EvidenceGraphData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    if (selectedEntityId) {
      setCurrentEntityId(selectedEntityId);
    }
  }, [selectedEntityId]);

  useEffect(() => {
    if (!currentEntityId) return;
    const fetchGraph = async () => {
      try {
        setIsLoading(true);
        const data = await api.getEntityGraph(currentEntityId);
        setGraphData(data);
        if (data.nodes.length > 0) {
          setSelectedNode(data.nodes[0]);
        }
      } catch (err) {
        console.error("Failed to load evidence graph:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGraph();
  }, [currentEntityId]);

  // Group nodes into hierarchical columns:
  // SOURCE -> RECORD -> ENTITY -> FIELD -> EVIDENCE -> AI_DECISION -> TRUSTED_RECORD
  const columnsOrder: GraphNode["type"][] = [
    "SOURCE",
    "RECORD",
    "ENTITY",
    "FIELD",
    "EVIDENCE",
    "AI_DECISION",
    "TRUSTED_RECORD",
  ];

  const groupedNodes: Record<string, GraphNode[]> = {};
  columnsOrder.forEach((col) => (groupedNodes[col] = []));

  if (graphData) {
    graphData.nodes.forEach((node) => {
      if (groupedNodes[node.type]) {
        groupedNodes[node.type].push(node);
      }
    });
  }

  const getNodeColor = (type: GraphNode["type"]) => {
    switch (type) {
      case "SOURCE":
        return "border-cyan-500/50 bg-cyan-950/40 text-cyan-300";
      case "RECORD":
        return "border-slate-700 bg-slate-900 text-slate-300";
      case "ENTITY":
        return "border-violet-500/60 bg-violet-950/50 text-violet-200 shadow-lg shadow-violet-950/40";
      case "FIELD":
        return "border-pink-500/50 bg-pink-950/30 text-pink-300";
      case "EVIDENCE":
        return "border-amber-500/50 bg-amber-950/30 text-amber-300";
      case "AI_DECISION":
        return "border-indigo-500/50 bg-indigo-950/40 text-indigo-300";
      case "TRUSTED_RECORD":
        return "border-emerald-500/60 bg-emerald-950/50 text-emerald-300 shadow-lg shadow-emerald-950/40";
      default:
        return "border-slate-700 bg-slate-800 text-slate-300";
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Entity Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-white flex items-center space-x-2">
            <Network className="w-5 h-5 text-violet-400 shrink-0" />
            <span>Interactive Evidence Graph</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            End-to-end data provenance: SOURCE &rarr; RECORD &rarr; ENTITY &rarr; FIELD &rarr; EVIDENCE &rarr; DECISION &rarr; TRUSTED RECORD.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5 sm:gap-3">
          <div className="flex items-center space-x-2">
            <label className="text-xs font-semibold text-slate-400 font-mono">Entity:</label>
            <select
              value={currentEntityId}
              onChange={(e) => setCurrentEntityId(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 max-w-[180px] sm:max-w-xs truncate"
            >
              {entities.map((ent) => (
                <option key={ent.id} value={ent.id}>
                  {ent.canonical_name} (Entity #{ent.id})
                </option>
              ))}
            </select>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-slate-400">
            <button
              onClick={() => setZoomLevel((z) => Math.min(z + 0.1, 1.4))}
              className="p-1.5 hover:text-white cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1.5 hover:text-white cursor-pointer font-mono text-[10px] px-1"
              title="Reset Zoom"
            >
              100%
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(z - 0.1, 0.7))}
              className="p-1.5 hover:text-white cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Swipe Cue (< xl) */}
      <div className="xl:hidden flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300">
        <span className="flex items-center space-x-1.5">
          <span className="text-cyan-400">↔</span>
          <span>Swipe horizontally to explore all 7 provenance columns</span>
        </span>
        <span className="text-[10px] font-mono text-cyan-400 font-bold">{Math.round(zoomLevel * 100)}% zoom</span>
      </div>

      {/* Main Graph Visualization & Inspector Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6">
        {/* Graph Columns Viewport */}
        <div className="xl:col-span-3 glass-panel rounded-2xl p-4 sm:p-6 border border-slate-800 overflow-x-auto min-h-[480px] sm:min-h-[550px] relative bg-[#070B14]">
          {isLoading ? (
            <div className="h-96 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-cyan-400 animate-spin mr-2" />
              <span className="text-xs text-slate-400 font-mono">Rendering provenance hierarchy...</span>
            </div>
          ) : !graphData || graphData.nodes.length === 0 ? (
            <div className="h-96 flex items-center justify-center text-xs text-slate-500 font-mono">
              No evidence graph available for this entity. Run reconciliation first.
            </div>
          ) : (
            <div
              className="flex items-start justify-between min-w-[900px] gap-6 transition-transform duration-200"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: "top left" }}
            >
              {columnsOrder.map((colType) => {
                const nodes = groupedNodes[colType] || [];
                return (
                  <div key={colType} className="flex-1 space-y-3 min-w-[130px]">
                    {/* Column Header */}
                    <div className="text-[10px] font-mono font-bold text-slate-500 uppercase pb-2 border-b border-slate-800 text-center tracking-wider">
                      {colType.replace("_", " ")}
                    </div>

                    {/* Nodes in this column */}
                    <div className="space-y-3">
                      {nodes.map((node) => {
                        const isSelected = selectedNode?.id === node.id;
                        return (
                          <div
                            key={node.id}
                            onClick={() => setSelectedNode(node)}
                            className={`p-3 rounded-xl border text-xs cursor-pointer transition-all duration-150 select-none ${getNodeColor(
                              node.type
                            )} ${
                              isSelected
                                ? "ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#070B14] scale-105"
                                : "hover:scale-102"
                            }`}
                          >
                            <div className="font-bold truncate text-[11px]" title={node.label}>
                              {node.label}
                            </div>
                            <div className="text-[10px] opacity-75 truncate mt-0.5" title={node.subtitle}>
                              {node.subtitle}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Node Detail Inspector Drawer */}
        <div className="xl:col-span-1 glass-panel rounded-2xl p-5 border border-slate-800 bg-[#0B1120] flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center space-x-2">
                <Info className="w-4 h-4 text-cyan-400" />
                <span>Node Inspector</span>
              </h3>
              {selectedNode && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                  {selectedNode.type}
                </span>
              )}
            </div>

            {selectedNode ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase block">Title</span>
                  <p className="font-bold text-white">{selectedNode.label}</p>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase block">Summary</span>
                  <p className="text-slate-300 text-[11px]">{selectedNode.subtitle}</p>
                </div>

                {/* Dynamic Data Breakdown */}
                {selectedNode.data && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">
                      Provenance Attributes
                    </span>

                    {Object.entries(selectedNode.data).map(([k, v]) => {
                      if (k === "raw_data" && typeof v === "object") {
                        return (
                          <div key={k} className="p-2 rounded bg-slate-950/60 font-mono text-[10px] border border-slate-800">
                            <span className="text-cyan-400 block mb-1">Untouched Raw Fields:</span>
                            {Object.entries(v as Record<string, any>).map(([rk, rv]) => (
                              <div key={rk} className="truncate">
                                <span className="text-slate-500">{rk}:</span> {String(rv)}
                              </div>
                            ))}
                          </div>
                        );
                      }

                      return (
                        <div key={k} className="flex items-start justify-between text-[11px] gap-2">
                          <span className="text-slate-500 font-mono truncate">{k}:</span>
                          <span className="font-mono text-slate-200 text-right truncate max-w-[150px]" title={String(v)}>
                            {typeof v === "object" ? JSON.stringify(v) : String(v)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs font-mono">
                Click any node in the graph to inspect its evidence and provenance details.
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
            Graph nodes dynamically populated from database provenance tables.
          </div>
        </div>
      </div>
    </div>
  );
};
