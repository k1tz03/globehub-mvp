"use client";

import { useState, useEffect } from "react";
import { clsx } from "clsx";
import type { Challenge } from "@/lib/useEngagementBoostStore";

interface ChallengesPanelProps {
  challenges: Challenge[];
  userHandle?: string;
  onJoin: (challengeId: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const typeConfig = {
  location: { icon: "📍", color: "sky" },
  category: { icon: "🏷️", color: "fuchsia" },
  time: { icon: "⏰", color: "amber" },
  social: { icon: "💬", color: "emerald" },
};

function ChallengeCard({ 
  challenge, 
  userHandle, 
  onJoin 
}: { 
  challenge: Challenge; 
  userHandle?: string; 
  onJoin: () => void;
}) {
  const config = typeConfig[challenge.type];
  const isJoined = userHandle ? challenge.participants.includes(userHandle) : false;
  const isCompleted = userHandle ? challenge.completedBy.includes(userHandle) : false;
  const [timeLeft, setTimeLeft] = useState("");

  // Calculer le temps restant
  useEffect(() => {
    const updateTime = () => {
      const end = new Date(challenge.endDate).getTime();
      const now = Date.now();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("Terminé");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}m`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [challenge.endDate]);

  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-2xl p-4 transition-all",
        isCompleted 
          ? "bg-emerald-50 dark:bg-emerald-900/20 ring-2 ring-emerald-500" 
          : "bg-white dark:bg-neutral-800",
        !isCompleted && !isJoined && "hover:shadow-lg"
      )}
    >
      {/* Badge de complétion */}
      {isCompleted && (
        <div className="absolute -right-8 -top-8 h-16 w-16 rotate-45 bg-emerald-500">
          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-white text-lg">✓</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={clsx(
            "flex h-12 w-12 items-center justify-center rounded-xl text-2xl",
            config.color === "sky" && "bg-sky-100 dark:bg-sky-900/40",
            config.color === "fuchsia" && "bg-fuchsia-100 dark:bg-fuchsia-900/40",
            config.color === "amber" && "bg-amber-100 dark:bg-amber-900/40",
            config.color === "emerald" && "bg-emerald-100 dark:bg-emerald-900/40",
          )}>
            {challenge.emoji}
          </div>
          <div>
            <h3 className="font-bold text-neutral-800 dark:text-white">
              {challenge.title}
            </h3>
            <p className="text-sm text-neutral-500">{challenge.description}</p>
          </div>
        </div>

        {/* Timer */}
        <div className={clsx(
          "rounded-lg px-2 py-1 text-xs font-medium",
          timeLeft === "Terminé" 
            ? "bg-neutral-200 text-neutral-500" 
            : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
        )}>
          ⏱️ {timeLeft}
        </div>
      </div>

      {/* Récompense */}
      <div className="mb-3 rounded-xl bg-neutral-100 p-3 dark:bg-neutral-700/50">
        <div className="flex items-center gap-2">
          <span className="text-lg">
            {challenge.reward.type === "badge" && "🏆"}
            {challenge.reward.type === "visibility" && "👁️"}
            {challenge.reward.type === "points" && "⭐"}
          </span>
          <div>
            <p className="text-xs text-neutral-500">Récompense</p>
            <p className="text-sm font-medium">
              {challenge.reward.type === "badge" && `Badge "${challenge.reward.value}" ${challenge.reward.badgeEmoji || ""}`}
              {challenge.reward.type === "visibility" && `${challenge.reward.value}x visibilité`}
              {challenge.reward.type === "points" && `${challenge.reward.value} points`}
            </p>
          </div>
        </div>
      </div>

      {/* Progression */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-neutral-500">
            {challenge.participants.length} participants
          </span>
          <span className="text-xs text-neutral-500">
            {challenge.completedBy.length} complétés
          </span>
        </div>
        <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
          <div
            className={clsx(
              "h-full rounded-full transition-all",
              config.color === "sky" && "bg-sky-500",
              config.color === "fuchsia" && "bg-fuchsia-500",
              config.color === "amber" && "bg-amber-500",
              config.color === "emerald" && "bg-emerald-500",
            )}
            style={{ 
              width: `${challenge.participants.length > 0 
                ? (challenge.completedBy.length / challenge.participants.length) * 100 
                : 0}%` 
            }}
          />
        </div>
      </div>

      {/* Leaderboard mini */}
      {challenge.leaderboard.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-neutral-500 mb-2">🏅 Top participants</p>
          <div className="flex flex-wrap gap-1">
            {challenge.leaderboard.slice(0, 5).map((entry, idx) => (
              <span
                key={entry.handle}
                className={clsx(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  idx === 0 && "bg-amber-100 text-amber-700",
                  idx === 1 && "bg-neutral-200 text-neutral-700",
                  idx === 2 && "bg-orange-100 text-orange-700",
                  idx > 2 && "bg-neutral-100 text-neutral-600",
                )}
              >
                {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : ""} @{entry.handle}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action button */}
      {!isCompleted && (
        <button
          onClick={onJoin}
          disabled={isJoined}
          className={clsx(
            "w-full rounded-xl py-2.5 text-sm font-bold transition-all",
            isJoined
              ? "bg-neutral-100 text-neutral-500 dark:bg-neutral-700"
              : clsx(
                  "text-white active:scale-95",
                  config.color === "sky" && "bg-gradient-to-r from-sky-500 to-blue-500 hover:shadow-lg hover:shadow-sky-500/30",
                  config.color === "fuchsia" && "bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:shadow-lg hover:shadow-fuchsia-500/30",
                  config.color === "amber" && "bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-lg hover:shadow-amber-500/30",
                  config.color === "emerald" && "bg-gradient-to-r from-emerald-500 to-green-500 hover:shadow-lg hover:shadow-emerald-500/30",
                )
          )}
        >
          {isJoined ? "✓ Inscrit" : "Participer"}
        </button>
      )}

      {isCompleted && (
        <div className="text-center py-2">
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
            ✨ Challenge complété !
          </span>
        </div>
      )}
    </div>
  );
}

export default function ChallengesPanel({ 
  challenges, 
  userHandle, 
  onJoin, 
  onClose, 
  isOpen 
}: ChallengesPanelProps) {
  if (!isOpen) return null;

  const activeChallenges = challenges.filter((c) => c.isActive);
  const completedChallenges = userHandle 
    ? challenges.filter((c) => c.completedBy.includes(userHandle))
    : [];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md animate-in slide-in-from-right duration-300">
        <div className="flex h-full flex-col bg-neutral-50 dark:bg-neutral-900">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-200 p-4 dark:border-neutral-800">
            <div>
              <h2 className="text-xl font-bold text-neutral-800 dark:text-white">
                🎯 Défis du jour
              </h2>
              <p className="text-sm text-neutral-500">
                {completedChallenges.length}/{activeChallenges.length} complétés
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Stats rapides */}
          <div className="grid grid-cols-3 gap-2 p-4 bg-gradient-to-r from-sky-500/10 via-fuchsia-500/10 to-amber-500/10">
            <div className="text-center">
              <p className="text-2xl font-bold text-sky-500">{activeChallenges.length}</p>
              <p className="text-xs text-neutral-500">Actifs</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-fuchsia-500">
                {challenges.reduce((sum, c) => sum + c.participants.length, 0)}
              </p>
              <p className="text-xs text-neutral-500">Participants</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-500">{completedChallenges.length}</p>
              <p className="text-xs text-neutral-500">Complétés</p>
            </div>
          </div>

          {/* Liste des challenges */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                userHandle={userHandle}
                onJoin={() => onJoin(challenge.id)}
              />
            ))}

            {activeChallenges.length === 0 && (
              <div className="text-center py-12">
                <span className="text-4xl">🎯</span>
                <p className="mt-4 text-neutral-500">
                  Aucun défi actif pour le moment
                </p>
                <p className="text-sm text-neutral-400">
                  Reviens demain !
                </p>
              </div>
            )}
          </div>

          {/* Footer motivant */}
          <div className="border-t border-neutral-200 p-4 dark:border-neutral-800">
            <div className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-amber-500 p-4 text-white">
              <p className="text-sm font-medium">💡 Astuce du jour</p>
              <p className="text-xs opacity-90 mt-1">
                Complète tous les défis quotidiens pour débloquer un badge spécial à la fin de la semaine !
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Bouton flottant pour ouvrir les challenges
export function ChallengesFAB({ 
  activeChallenges, 
  completedCount, 
  onClick 
}: { 
  activeChallenges: number; 
  completedCount: number; 
  onClick: () => void;
}) {
  const hasIncomplete = completedCount < activeChallenges;

  return (
    <button
      onClick={onClick}
      className={clsx(
        "fixed left-4 bottom-20 z-30 flex items-center gap-2 rounded-full px-4 py-3 shadow-lg transition-all hover:scale-105 active:scale-95",
        hasIncomplete
          ? "bg-gradient-to-r from-fuchsia-500 to-amber-500 text-white animate-pulse"
          : "bg-white text-neutral-700 dark:bg-neutral-800 dark:text-white"
      )}
    >
      <span className="text-lg">🎯</span>
      <span className="text-sm font-bold">
        {completedCount}/{activeChallenges}
      </span>
      {hasIncomplete && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
          !
        </span>
      )}
    </button>
  );
}

// Notification de challenge complété
export function ChallengeCompletedToast({ 
  challenge, 
  onClose 
}: { 
  challenge: Challenge; 
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top fade-in duration-300">
      <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-2xl dark:bg-neutral-800">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-2xl dark:bg-emerald-900/40">
          🎉
        </div>
        <div>
          <p className="font-bold text-emerald-600 dark:text-emerald-400">
            Challenge complété !
          </p>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            {challenge.title}
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            {challenge.reward.type === "badge" && `🏆 Badge: ${challenge.reward.value}`}
            {challenge.reward.type === "visibility" && `👁️ ${challenge.reward.value}x visibilité`}
            {challenge.reward.type === "points" && `⭐ +${challenge.reward.value} points`}
          </p>
        </div>
        <button
          onClick={onClose}
          className="ml-2 rounded-full p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
