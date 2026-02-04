"use client";

import { useState } from "react";
import { clsx } from "clsx";
import type { ViralPrediction } from "@/lib/useEngagementBoostStore";

interface ViralPredictionBadgeProps {
  prediction: ViralPrediction;
  onBoost?: () => void;
  hasUserBoosted?: boolean;
  compact?: boolean;
}

export default function ViralPredictionBadge({ 
  prediction, 
  onBoost, 
  hasUserBoosted = false,
  compact = false 
}: ViralPredictionBadgeProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Déterminer le niveau visuel basé sur le score
  const getScoreLevel = (score: number) => {
    if (score >= 80) return { emoji: "🚀", label: "Explosion imminente", color: "fuchsia", glow: true };
    if (score >= 60) return { emoji: "🔮", label: "Fort potentiel", color: "violet", glow: true };
    if (score >= 40) return { emoji: "📈", label: "En progression", color: "sky", glow: false };
    if (score >= 20) return { emoji: "✨", label: "Prometteur", color: "amber", glow: false };
    return { emoji: "🌱", label: "Nouveau", color: "emerald", glow: false };
  };

  const level = getScoreLevel(prediction.score);

  // Version compacte pour les listes
  if (compact) {
    return (
      <div
        className={clsx(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium cursor-pointer transition-all",
          level.color === "fuchsia" && "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300",
          level.color === "violet" && "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
          level.color === "sky" && "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
          level.color === "amber" && "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
          level.color === "emerald" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
          level.glow && "ring-2 ring-offset-1 ring-fuchsia-400/50 animate-pulse"
        )}
        onClick={() => setShowDetails(!showDetails)}
      >
        <span>{level.emoji}</span>
        <span>{prediction.score}%</span>
        {prediction.boostCount > 0 && (
          <span className="flex items-center gap-0.5 text-[10px] opacity-75">
            ⚡{prediction.boostCount}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Badge principal */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={clsx(
          "flex items-center gap-2 rounded-xl px-3 py-2 transition-all hover:scale-105",
          level.color === "fuchsia" && "bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white",
          level.color === "violet" && "bg-gradient-to-r from-violet-500 to-purple-500 text-white",
          level.color === "sky" && "bg-gradient-to-r from-sky-500 to-blue-500 text-white",
          level.color === "amber" && "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
          level.color === "emerald" && "bg-gradient-to-r from-emerald-500 to-green-500 text-white",
          level.glow && "shadow-lg shadow-fuchsia-500/30 animate-pulse"
        )}
      >
        <span className="text-lg">{level.emoji}</span>
        <div className="text-left">
          <p className="text-xs font-bold">{level.label}</p>
          <p className="text-[10px] opacity-90">Score: {prediction.score}/100</p>
        </div>
        {prediction.boostCount > 0 && (
          <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">
            ⚡ {prediction.boostCount}
          </span>
        )}
      </button>

      {/* Panneau de détails */}
      {showDetails && (
        <div className="absolute left-0 top-full z-50 mt-2 w-72 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="rounded-2xl bg-white p-4 shadow-2xl dark:bg-neutral-900">
            {/* Header */}
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-bold text-neutral-800 dark:text-white">
                Prédiction de viralité
              </h4>
              <span className={clsx(
                "rounded-full px-2 py-0.5 text-xs font-bold",
                prediction.confidence === "high" && "bg-emerald-100 text-emerald-700",
                prediction.confidence === "medium" && "bg-amber-100 text-amber-700",
                prediction.confidence === "low" && "bg-neutral-100 text-neutral-700",
              )}>
                {prediction.confidence === "high" ? "Fiable" : prediction.confidence === "medium" ? "Modéré" : "Incertain"}
              </span>
            </div>

            {/* Score bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-neutral-500">Score global</span>
                <span className="text-sm font-bold">{prediction.score}%</span>
              </div>
              <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                <div
                  className={clsx(
                    "h-full rounded-full transition-all duration-500",
                    prediction.score >= 80 && "bg-gradient-to-r from-fuchsia-500 to-pink-500",
                    prediction.score >= 60 && prediction.score < 80 && "bg-gradient-to-r from-violet-500 to-purple-500",
                    prediction.score >= 40 && prediction.score < 60 && "bg-gradient-to-r from-sky-500 to-blue-500",
                    prediction.score < 40 && "bg-gradient-to-r from-amber-500 to-orange-500",
                  )}
                  style={{ width: `${prediction.score}%` }}
                />
              </div>
            </div>

            {/* Facteurs */}
            <div className="space-y-2 mb-4">
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Facteurs</p>
              
              {Object.entries(prediction.factors).map(([key, value]) => {
                const labels: Record<string, { label: string; emoji: string }> = {
                  earlyEngagement: { label: "Engagement précoce", emoji: "⚡" },
                  authorInfluence: { label: "Influence auteur", emoji: "👤" },
                  contentQuality: { label: "Qualité contenu", emoji: "✨" },
                  timing: { label: "Timing", emoji: "⏰" },
                  location: { label: "Localisation", emoji: "📍" },
                };
                const factor = labels[key];
                if (!factor) return null;

                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-sm">{factor.emoji}</span>
                    <span className="text-xs text-neutral-600 dark:text-neutral-400 flex-1">
                      {factor.label}
                    </span>
                    <div className="w-16 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-400 to-fuchsia-400"
                        style={{ width: `${value}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium w-8 text-right">{Math.round(value)}</span>
                  </div>
                );
              })}
            </div>

            {/* Pic prédit */}
            <div className="mb-4 rounded-xl bg-neutral-100 p-3 dark:bg-neutral-800">
              <div className="flex items-center gap-2">
                <span className="text-lg">📊</span>
                <div>
                  <p className="text-xs text-neutral-500">Pic prévu</p>
                  <p className="text-sm font-medium">
                    {new Date(prediction.predictedPeakTime).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Bouton Boost */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBoost?.();
              }}
              disabled={hasUserBoosted}
              className={clsx(
                "w-full rounded-xl py-2.5 text-sm font-bold transition-all",
                hasUserBoosted
                  ? "bg-neutral-100 text-neutral-400 dark:bg-neutral-800 cursor-not-allowed"
                  : "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:shadow-orange-500/30 active:scale-95"
              )}
            >
              {hasUserBoosted ? (
                <>✓ Boosté</>
              ) : (
                <>⚡ Booster ce post</>
              )}
            </button>

            {prediction.boostCount > 0 && (
              <p className="mt-2 text-center text-xs text-neutral-500">
                {prediction.boostCount} personne{prediction.boostCount > 1 ? "s" : ""} {prediction.boostCount > 1 ? "ont" : "a"} boosté ce post
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Version inline pour les cards de post
export function ViralScoreInline({ score }: { score: number }) {
  if (score < 30) return null;

  const getEmoji = (s: number) => {
    if (s >= 80) return "🚀";
    if (s >= 60) return "🔮";
    if (s >= 40) return "📈";
    return "✨";
  };

  return (
    <span className={clsx(
      "inline-flex items-center gap-1 text-xs",
      score >= 80 && "text-fuchsia-500",
      score >= 60 && score < 80 && "text-violet-500",
      score >= 40 && score < 60 && "text-sky-500",
      score < 40 && "text-amber-500",
    )}>
      {getEmoji(score)} {score}%
    </span>
  );
}
