import React from "react";

interface ConfidenceBarProps {
  score: number;
  showLabel?: boolean;
}

export const ConfidenceBar: React.FC<ConfidenceBarProps> = ({ score, showLabel = true }) => {
  const percentage = Math.min(Math.max(score, 0), 100);

  let barColor = "bg-rose-500";
  let textColor = "text-rose-400";
  let glowColor = "shadow-rose-500/20";

  if (percentage >= 90) {
    barColor = "bg-gradient-to-r from-emerald-500 to-teal-400";
    textColor = "text-emerald-400";
    glowColor = "shadow-emerald-500/20";
  } else if (percentage >= 70) {
    barColor = "bg-gradient-to-r from-amber-500 to-yellow-400";
    textColor = "text-amber-400";
    glowColor = "shadow-amber-500/20";
  }

  return (
    <div className="flex items-center space-x-2.5">
      <div className="w-24 bg-slate-800/80 rounded-full h-2 overflow-hidden border border-slate-700/50">
        <div
          className={`h-full rounded-full ${barColor} shadow-sm ${glowColor} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className={`text-xs font-mono font-bold ${textColor}`}>
          {score.toFixed(1)}%
        </span>
      )}
    </div>
  );
};
