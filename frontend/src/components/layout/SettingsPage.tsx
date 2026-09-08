import React, { useState, useEffect } from "react";
import { Sliders, Save, ShieldCheck, Check, RotateCcw, AlertTriangle } from "lucide-react";
import { SystemSettings } from "../../types";
import { api } from "../../services/api";

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const data = await api.getSettings();
        setSettings(data);
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    try {
      setIsSaving(true);
      await api.updateSettings(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAuthorityChange = (source: string, val: number) => {
    if (!settings) return;
    setSettings({
      ...settings,
      source_authorities: {
        ...settings.source_authorities,
        [source]: val,
      },
    });
  };

  if (isLoading || !settings) {
    return (
      <div className="p-8 text-center text-slate-500 font-mono text-xs">
        Loading trust configuration settings...
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 max-w-4xl">
      <div>
        <h2 className="text-sm sm:text-base font-bold text-white flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-cyan-400 shrink-0" />
          <span>Zero-Trust Governance & Threshold Configuration</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Calibrate automated reconciliation cutoffs, human-in-the-loop triggers, and relative source authority weights.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-xs text-emerald-300 flex items-center space-x-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Configuration saved successfully. Subsequent reconciliations will use these thresholds.</span>
        </div>
      )}

      {/* Thresholds Card */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-slate-800 space-y-5 sm:space-y-6">
        <h3 className="text-xs sm:text-sm font-bold text-white font-mono uppercase tracking-wider">
          Reconciliation Decision Thresholds
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Auto-Resolve Cutoff */}
          <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-2">
            <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase block">
              Auto-Resolve Minimum (&ge;)
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white">
              {settings.auto_resolve_threshold}%
            </div>
            <input
              type="range"
              min={80}
              max={99}
              step={1}
              value={settings.auto_resolve_threshold}
              onChange={(e) =>
                setSettings({ ...settings, auto_resolve_threshold: Number(e.target.value) })
              }
              className="w-full accent-emerald-400"
            />
            <p className="text-[10px] text-slate-500">
              Fields meeting or exceeding this threshold are automatically accepted into the Golden Record.
            </p>
          </div>

          {/* Human Review Threshold */}
          <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 space-y-2">
            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase block">
              Human Review Floor (&ge;)
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white">
              {settings.human_review_threshold}%
            </div>
            <input
              type="range"
              min={50}
              max={85}
              step={1}
              value={settings.human_review_threshold}
              onChange={(e) =>
                setSettings({ ...settings, human_review_threshold: Number(e.target.value) })
              }
              className="w-full accent-amber-400"
            />
            <p className="text-[10px] text-slate-500">
              Scores between this floor and the auto cutoff are routed to /review for human operator signoff.
            </p>
          </div>

          {/* Blocked Range */}
          <div className="p-4 rounded-xl bg-slate-900 border border-rose-500/30 space-y-2 sm:col-span-2 md:col-span-1">
            <span className="text-[10px] font-mono font-bold text-rose-400 uppercase block">
              Blocked High-Risk Zone (&lt;)
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-rose-400">
              &lt; {settings.human_review_threshold}%
            </div>
            <div className="h-6 flex items-center text-[11px] text-slate-400 font-mono">
              Automatic Hard Block
            </div>
            <p className="text-[10px] text-slate-500">
              Fields with insufficient consensus or uncorroborated single sources are blocked from auto-decision.
            </p>
          </div>
        </div>
      </div>

      {/* Source Authority Weights Card */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-slate-800 space-y-5 sm:space-y-6">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-white font-mono uppercase tracking-wider">
            Configurable Source Authority Weights
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Transparent calibration: No source is permanently hardcoded as universally truthful.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {Object.entries(settings.source_authorities).map(([src, weight]) => (
            <div key={src} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">{src}</span>
                <span className="text-xs font-mono font-bold text-cyan-400">
                  {(weight * 100).toFixed(0)}% ({weight})
                </span>
              </div>
              <input
                type="range"
                min={0.1}
                max={1.0}
                step={0.05}
                value={weight}
                onChange={(e) => handleAuthorityChange(src, parseFloat(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-stretch sm:justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-cyan-900/30 active:scale-95 transition-all flex items-center justify-center space-x-2 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? "Saving Config..." : "Save Governance Settings"}</span>
        </button>
      </div>
    </div>
  );
};
