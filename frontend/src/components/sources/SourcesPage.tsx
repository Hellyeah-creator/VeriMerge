import React, { useState } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  Trash2,
  Eye,
  CheckCircle,
  Database,
  ArrowRight,
  Layers,
  Sparkles
} from "lucide-react";
import { Source, SourcePreview } from "../../types";
import { api } from "../../services/api";

interface SourcesPageProps {
  sources: Source[];
  onRefresh: () => void;
  onNavigate: (tab: string) => void;
}

export const SourcesPage: React.FC<SourcesPageProps> = ({ sources, onRefresh, onNavigate }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceName, setSourceName] = useState("");
  const [sourceType, setSourceType] = useState("CRM");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [previewData, setPreviewData] = useState<SourcePreview | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setSelectedFile(f);
      if (!sourceName) {
        setSourceName(f.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setUploadError(null);
      await api.uploadSource(selectedFile, sourceName || undefined, sourceType);
      setSelectedFile(null);
      setSourceName("");
      onRefresh();
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePreview = async (sourceId: number) => {
    try {
      setIsPreviewLoading(true);
      const data = await api.getSourcePreview(sourceId);
      setPreviewData(data);
    } catch (err) {
      console.error("Preview failed:", err);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleDelete = async (sourceId: number) => {
    if (!confirm("Are you sure you want to delete this source and its records?")) return;
    try {
      await api.deleteSource(sourceId);
      onRefresh();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Upload Box & Config */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-slate-800">
        <h2 className="text-sm sm:text-base font-bold text-white mb-2 flex items-center space-x-2">
          <UploadCloud className="w-5 h-5 text-cyan-400 shrink-0" />
          <span>Ingest New Data Source</span>
        </h2>
        <p className="text-xs text-slate-400 mb-5 sm:mb-6 leading-relaxed">
          Upload customer, vendor, or corporate data files. The system automatically detects headers, suggests canonical field mappings, normalizes entries, and preserves raw records unchanged.
        </p>

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono uppercase">
                Source System Type
              </label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="CRM">CRM (Customer Relationship Management)</option>
                <option value="ERP">ERP (Enterprise Resource Planning)</option>
                <option value="EXCEL">Manual Excel Spreadsheet</option>
                <option value="WEB/API">Web / External Authorized API</option>
                <option value="REGISTRY">Government Registry Data</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono uppercase">
                Custom Source Name
              </label>
              <input
                type="text"
                placeholder="e.g. Production ERP 2026"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono uppercase">
                Supported File Formats
              </label>
              <div className="text-[11px] text-slate-400 bg-slate-900/60 border border-slate-800 rounded-lg p-2 flex items-center justify-between">
                <span>CSV, XLSX, XLS, JSON</span>
                <span className="text-cyan-400 font-mono">Max 25MB</span>
              </div>
            </div>
          </div>

          {/* File Input Box */}
          <div className="relative border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-xl p-5 sm:p-6 text-center transition-colors bg-slate-900/30">
            <input
              type="file"
              accept=".csv,.xlsx,.xls,.json"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center space-y-2">
              <FileSpreadsheet className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-400/80" />
              <div className="text-xs text-slate-300">
                {selectedFile ? (
                  <span className="font-bold text-cyan-400 break-all">{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                ) : (
                  <span>Drag and drop your file here, or <span className="text-cyan-400 underline">browse computer</span></span>
                )}
              </div>
              <p className="text-[10px] text-slate-500">Auto-detects columns and generates canonical schema representations</p>
            </div>
          </div>

          {uploadError && (
            <div className="text-xs text-rose-400 bg-rose-950/40 border border-rose-800/50 rounded-lg p-3">
              {uploadError}
            </div>
          )}

          <div className="flex justify-stretch sm:justify-end">
            <button
              type="submit"
              disabled={!selectedFile || isUploading}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white text-xs font-semibold shadow-md shadow-cyan-900/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{isUploading ? "Uploading & Normalizing..." : "Upload & Parse Source"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Ingested Sources Catalog Table */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center space-x-2">
              <Database className="w-4 h-4 text-violet-400 shrink-0" />
              <span>Ingested Data Sources</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">All original schemas and raw values are stored immutably.</p>
          </div>
          <button
            onClick={() => onNavigate("reconciliation")}
            className="w-full sm:w-auto px-3.5 py-2 rounded-lg bg-cyan-950/60 border border-cyan-700/50 text-cyan-400 text-xs font-semibold hover:bg-cyan-900/60 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
          >
            <span>Proceed to Reconciliation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mobile Sources Cards (< md) */}
        <div className="block md:hidden space-y-3">
          {sources.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No sources uploaded yet. Upload your files above or click "Run Live Demo" to load seed datasets.
            </div>
          ) : (
            sources.map((s) => (
              <div key={s.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2 min-w-0">
                    <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="font-bold text-white text-xs truncate">{s.name}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                    {s.source_type}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Records:</span>
                    <span className="font-bold text-cyan-400">{s.total_records.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Columns:</span>
                    <span className="text-slate-300">{s.total_columns} fields</span>
                  </div>
                  <div className="col-span-2 truncate">
                    <span className="text-slate-500 block text-[10px]">File:</span>
                    <span className="truncate">{s.filename || "manual_import"}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {s.status.toUpperCase()}
                  </span>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePreview(s.id)}
                      className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-medium flex items-center space-x-1"
                      title="View Schema Mapping"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-1.5 rounded-md bg-slate-800/80 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Delete Source"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Sources Table (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/60 text-slate-400 text-[10px] uppercase font-mono border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Source System</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">File Name</th>
                <th className="py-3 px-4">Records</th>
                <th className="py-3 px-4">Columns</th>
                <th className="py-3 px-4">Ingested At</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sources.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No sources uploaded yet. Upload your files above or click "Run Live Demo" to load seed datasets.
                  </td>
                </tr>
              ) : (
                sources.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>{s.name}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {s.source_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">{s.filename || "manual_import"}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-cyan-400">{s.total_records.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{s.total_columns} fields</td>
                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {new Date(s.uploaded_at).toLocaleDateString()} {new Date(s.uploaded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {s.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handlePreview(s.id)}
                          className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                          title="View Schema Mapping & Sample Records"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Delete Source"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schema Mapping & Data Preview Modal */}
      {previewData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2.5 sm:p-4">
          <div className="glass-panel bg-[#0B1120] border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm sm:text-lg font-bold text-white flex items-center space-x-2">
                  <Layers className="w-5 h-5 text-cyan-400 shrink-0" />
                  <span className="truncate">Schema Mapping: {previewData.name}</span>
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                  Original schema is preserved alongside canonical normalization targets.
                </p>
              </div>
              <button
                onClick={() => setPreviewData(null)}
                className="text-slate-400 hover:text-white text-xs sm:text-sm font-mono px-3 py-1 bg-slate-800 rounded-lg shrink-0 cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6">
              {/* Field Mapping Grid */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono mb-2.5 sm:mb-3">
                  Canonical Field Mappings (Original &rarr; Canonical)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-2.5">
                  {Object.entries(previewData.detected_mappings).map(([orig, canon]) => (
                    <div
                      key={orig}
                      className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <span className="font-mono text-slate-400 truncate max-w-[120px]" title={orig}>{orig}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0 mx-1" />
                      <span className="font-mono text-cyan-400 font-semibold truncate max-w-[120px]" title={canon}>
                        {canon}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sample Raw Records */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono mb-3">
                  Sample Raw Records Preview
                </h4>
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase font-mono border-b border-slate-800">
                      <tr>
                        {previewData.columns.map((col) => (
                          <th key={col} className="py-2.5 px-3 whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                      {previewData.sample_rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/20">
                          {previewData.columns.map((col) => (
                            <td key={col} className="py-2 px-3 whitespace-nowrap font-mono text-[11px] text-slate-300">
                              {row[col] !== undefined && row[col] !== null ? String(row[col]) : "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
