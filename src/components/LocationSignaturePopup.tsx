"use client";

import { useState, useEffect } from "react";
import { clsx } from "clsx";
import type { LocationSignature } from "@/lib/useLocationSignaturesStore";
import { timeAgo } from "@/lib/time";

interface LocationSignaturePopupProps {
  signature: LocationSignature | null;
  screenPosition: { x: number; y: number } | null;
  onClose: () => void;
  onViewPost?: (postId: string) => void;
  onViewProfile?: (handle: string) => void;
}

export default function LocationSignaturePopup({
  signature,
  screenPosition,
  onClose,
  onViewPost,
  onViewProfile,
}: LocationSignaturePopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<"stats" | "contributors" | "legendary">("stats");

  useEffect(() => {
    if (signature && screenPosition) {
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [signature, screenPosition]);

  if (!signature || !screenPosition) return null;

  const popupWidth = 340;
  const popupHeight = 380;
  const verticalGap = 30;

  let left = screenPosition.x - popupWidth / 2;
  let top = screenPosition.y - popupHeight - verticalGap;

  const margin = 16;
  if (typeof window !== "undefined") {
    left = Math.max(margin, Math.min(left, window.innerWidth - popupWidth - margin));
    if (top < margin + 60) {
      top = screenPosition.y + verticalGap;
    }
  }

  const activityColors: Record<LocationSignature["activityLevel"], string> = {
    dormant: "bg-neutral-400",
    calm: "bg-sky-400",
    active: "bg-emerald-400",
    buzzing: "bg-amber-400",
    legendary: "bg-fuchsia-500",
  };

  const activityLabels: Record<LocationSignature["activityLevel"], string> = {
    dormant: "Endormi",
    calm: "Calme",
    active: "Actif",
    buzzing: "En effervescence",
    legendary: "Légendaire",
  };

  const moodColors: Record<string, string> = {
    vibe: "bg-fuchsia-500",
    news: "bg-sky-500",
    event: "bg-amber-500",
    alert: "bg-rose-500",
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Popup */}
      <div
        className={clsx(
          "fixed z-50 transition-all duration-300",
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        )}
        style={{
          left: `${left}px`,
          top: `${top}px`,
          width: `${popupWidth}px`,
        }}
      >
        {/* Glow effect */}
        <div className={clsx(
          "absolute -inset-3 rounded-3xl blur-xl opacity-50",
          signature.activityLevel === "legendary"
            ? "bg-gradient-to-r from-fuchsia-500 via-amber-500 to-pink-500 animate-pulse"
            : "bg-gradient-to-r from-sky-500/30 to-purple-500/30"
        )} />

        {/* Card */}
        <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-700/50">
          {/* Header */}
          <div className={clsx(
            "relative h-20 bg-gradient-to-r",
            signature.activityLevel === "legendary"
              ? "from-fuchsia-500 via-purple-500 to-pink-500"
              : "from-sky-500 via-purple-500 to-fuchsia-500"
          )}>
            {/* Activity badge */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-2.5 py-1">
              <span className={clsx("h-2 w-2 rounded-full animate-pulse", activityColors[signature.activityLevel])} />
              <span className="text-xs font-medium text-white">
                {activityLabels[signature.activityLevel]}
              </span>
            </div>

            {/* Emoji badge */}
            <div className="absolute -bottom-6 left-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-lg dark:bg-neutral-800">
              {signature.emoji}
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 left-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/30 text-white hover:bg-red-500 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-4 pt-10 pb-4">
            {/* Title & Stats quick view */}
            <div className="mb-4">
              <h3 className="font-bold text-lg">
                {signature.name || "Zone active"}
                {signature.activityLevel === "legendary" && " 👑"}
              </h3>
              <p className="text-sm text-neutral-500">
                {signature.totalPosts} posts • {signature.totalLikes} likes • {signature.uniqueContributors} contributeurs
              </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4">
              {(["stats", "contributors", "legendary"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={clsx(
                    "flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors",
                    activeTab === tab
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400"
                  )}
                >
                  {tab === "stats" && "📊 Stats"}
                  {tab === "contributors" && "👥 Top"}
                  {tab === "legendary" && "🏆 Best"}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="min-h-[160px]">
              {/* Stats tab */}
              {activeTab === "stats" && (
                <div className="space-y-3">
                  {/* Mood distribution */}
                  <div>
                    <p className="text-xs font-medium text-neutral-500 mb-2">Ambiance dominante</p>
                    <div className="flex h-3 rounded-full overflow-hidden">
                      {Object.entries(signature.moodDistribution).map(([mood, count]) => {
                        const percentage = (count / signature.totalPosts) * 100;
                        if (percentage < 5) return null;
                        return (
                          <div
                            key={mood}
                            className={clsx("h-full", moodColors[mood])}
                            style={{ width: `${percentage}%` }}
                            title={`${mood}: ${count} posts`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-1 text-[10px] text-neutral-400">
                      <span>✨ Vibes</span>
                      <span>📰 News</span>
                      <span>🎉 Events</span>
                      <span>⚠️ Alertes</span>
                    </div>
                  </div>

                  {/* Activity timeline */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800">
                      <p className="text-xs text-neutral-500">Premier post</p>
                      <p className="text-sm font-medium">{timeAgo(signature.firstPostDate)}</p>
                    </div>
                    <div className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800">
                      <p className="text-xs text-neutral-500">Dernière activité</p>
                      <p className="text-sm font-medium">{timeAgo(signature.lastActivityDate)}</p>
                    </div>
                  </div>

                  {/* Achievements */}
                  {signature.achievements.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-neutral-500 mb-2">Achievements débloqués</p>
                      <div className="flex flex-wrap gap-1">
                        {signature.achievements.map(ach => (
                          <span
                            key={ach.id}
                            className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                            title={`${ach.name} - Par @${ach.unlockedBy}`}
                          >
                            {ach.emoji} {ach.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Contributors tab */}
              {activeTab === "contributors" && (
                <div className="space-y-2">
                  {signature.topContributors.map((contributor, index) => (
                    <button
                      key={contributor.handle}
                      onClick={() => onViewProfile?.(contributor.handle)}
                      className="flex w-full items-center gap-3 rounded-xl p-2 hover:bg-neutral-50 transition-colors dark:hover:bg-neutral-800"
                    >
                      <div className="relative">
                        <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                          {index + 1}
                        </span>
                        {contributor.avatar ? (
                          <img src={contributor.avatar} alt="" className="h-10 w-10 rounded-full" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white font-bold">
                            {contributor.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-sm">{contributor.username}</p>
                        <p className="text-xs text-neutral-500">@{contributor.handle}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-fuchsia-500">{contributor.totalLikes} ❤️</p>
                        <p className="text-xs text-neutral-400">{contributor.postCount} posts</p>
                      </div>
                    </button>
                  ))}

                  {signature.topContributors.length === 0 && (
                    <p className="text-center text-sm text-neutral-500 py-8">
                      Pas encore de contributeurs majeurs
                    </p>
                  )}
                </div>
              )}

              {/* Legendary post tab */}
              {activeTab === "legendary" && (
                <div>
                  {signature.legendaryPost ? (
                    <button
                      onClick={() => onViewPost?.(signature.legendaryPost!.id)}
                      className="w-full rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 p-4 text-left transition-transform hover:scale-[1.02] dark:from-amber-900/20 dark:to-orange-900/20"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">👑</span>
                        <div>
                          <p className="font-semibold text-amber-700 dark:text-amber-400">Post légendaire</p>
                          <p className="text-xs text-amber-600/70 dark:text-amber-500/70">
                            Le plus liké de cette zone
                          </p>
                        </div>
                      </div>

                      <p className="text-sm text-neutral-700 dark:text-neutral-200 line-clamp-3 mb-3">
                        "{signature.legendaryPost.text}"
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs text-white font-bold">
                            {signature.legendaryPost.author.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-medium">{signature.legendaryPost.author}</p>
                            <p className="text-[10px] text-neutral-500">
                              {timeAgo(signature.legendaryPost.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-rose-500">
                          <span className="font-bold">{signature.legendaryPost.likes}</span>
                          <span>❤️</span>
                        </div>
                      </div>
                    </button>
                  ) : (
                    <div className="text-center py-8">
                      <span className="text-4xl">🏆</span>
                      <p className="mt-2 text-sm text-neutral-500">
                        Aucun post légendaire pour l'instant
                      </p>
                      <p className="text-xs text-neutral-400 mt-1">
                        Un post avec 5+ likes deviendra légendaire
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Mini badge à afficher sur la carte pour les zones avec signature
export function LocationSignatureBadge({
  signature,
  onClick,
}: {
  signature: LocationSignature;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium shadow-lg transition-transform hover:scale-110",
        signature.activityLevel === "legendary"
          ? "bg-gradient-to-r from-fuchsia-500 to-amber-500 text-white"
          : signature.activityLevel === "buzzing"
          ? "bg-amber-500 text-white"
          : signature.activityLevel === "active"
          ? "bg-emerald-500 text-white"
          : "bg-white text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
      )}
    >
      <span>{signature.emoji}</span>
      <span>{signature.totalLikes}</span>
      {signature.activityLevel === "legendary" && <span>👑</span>}
    </button>
  );
}
