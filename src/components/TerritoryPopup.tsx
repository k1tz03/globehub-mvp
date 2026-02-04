"use client";

import { useState, useEffect } from "react";
import { clsx } from "clsx";
import type { Territory } from "@/lib/useTerritoriesStore";
import { timeAgo } from "@/lib/time";

interface TerritoryPopupProps {
  territory: Territory | null;
  screenPosition: { x: number; y: number } | null;
  currentUserHandle?: string;
  onClose: () => void;
  onViewProfile?: (handle: string) => void;
}

export default function TerritoryPopup({
  territory,
  screenPosition,
  currentUserHandle,
  onClose,
  onViewProfile,
}: TerritoryPopupProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (territory && screenPosition) {
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [territory, screenPosition]);

  if (!territory || !screenPosition) return null;

  const popupWidth = 360;
  const margin = 16;

  let left = screenPosition.x - popupWidth / 2;
  let top = screenPosition.y + 30;

  if (typeof window !== "undefined") {
    left = Math.max(margin, Math.min(left, window.innerWidth - popupWidth - margin));
    if (top + 400 > window.innerHeight) {
      top = screenPosition.y - 400 - 30;
    }
  }

  const userRank = territory.leaderboard.find(u => u.handle === currentUserHandle);
  const isCurrentUserMayor = territory.mayor?.handle === currentUserHandle;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

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
        {/* Glow for contested territories */}
        {territory.isContested && (
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-rose-500/40 via-amber-500/40 to-rose-500/40 blur-xl animate-pulse" />
        )}

        <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-700/50">
          {/* Header */}
          <div className={clsx(
            "relative p-4 bg-gradient-to-r",
            territory.isContested
              ? "from-rose-500 via-amber-500 to-rose-500"
              : "from-emerald-500 via-teal-500 to-cyan-500"
          )}>
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/30 text-white hover:bg-red-500 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Territory info */}
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm text-3xl">
                {territory.emoji}
              </div>
              <div className="text-white">
                <h3 className="font-bold text-lg">{territory.name}</h3>
                <p className="text-white/80 text-sm">
                  {territory.totalPosts} posts • {territory.activeUsers} contributeurs
                </p>
              </div>
            </div>

            {/* Contested badge */}
            {territory.isContested && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/20 px-3 py-1.5">
                <span className="animate-pulse">⚔️</span>
                <span className="text-sm font-medium text-white">Territoire contesté !</span>
              </div>
            )}
          </div>

          {/* Mayor section */}
          <div className="p-4 border-b border-neutral-100 dark:border-neutral-800">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
              👑 Maire actuel
            </p>

            {territory.mayor ? (
              <button
                onClick={() => onViewProfile?.(territory.mayor!.handle)}
                className="flex w-full items-center gap-3 rounded-xl bg-amber-50 p-3 hover:bg-amber-100 transition-colors dark:bg-amber-900/20 dark:hover:bg-amber-900/30"
              >
                <div className="relative">
                  {territory.mayor.avatar ? (
                    <img src={territory.mayor.avatar} alt="" className="h-12 w-12 rounded-full border-2 border-amber-500" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-amber-500 bg-gradient-to-br from-amber-400 to-orange-500 text-white font-bold text-lg">
                      {territory.mayor.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute -top-1 -right-1 text-lg">👑</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-amber-700 dark:text-amber-400">
                    {territory.mayor.username}
                    {isCurrentUserMayor && <span className="ml-1 text-xs">(vous !)</span>}
                  </p>
                  <p className="text-xs text-amber-600/70 dark:text-amber-500/70">
                    @{territory.mayor.handle} • {territory.mayor.score} points
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-amber-500">{territory.mayor.streak}</p>
                  <p className="text-[10px] text-amber-600/70">jours</p>
                </div>
              </button>
            ) : (
              <div className="rounded-xl bg-neutral-50 p-4 text-center dark:bg-neutral-800">
                <span className="text-3xl">🏛️</span>
                <p className="mt-2 text-sm text-neutral-500">Aucun maire</p>
                <p className="text-xs text-neutral-400">Soyez le premier à poster !</p>
              </div>
            )}

            {/* Challenger */}
            {territory.challenger && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-rose-50 p-2 dark:bg-rose-900/20">
                <span>⚔️</span>
                <p className="text-xs text-rose-700 dark:text-rose-400">
                  <button
                    onClick={() => onViewProfile?.(territory.challenger!.handle)}
                    className="font-semibold hover:underline"
                  >
                    @{territory.challenger.handle}
                  </button>
                  {" "}est à {territory.challenger.gap} points du maire !
                </p>
              </div>
            )}
          </div>

          {/* Leaderboard */}
          <div className="p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
              🏆 Classement
            </p>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {territory.leaderboard.map((user, index) => {
                const isCurrentUser = user.handle === currentUserHandle;
                const isMayor = index === 0;

                return (
                  <button
                    key={user.handle}
                    onClick={() => onViewProfile?.(user.handle)}
                    className={clsx(
                      "flex w-full items-center gap-3 rounded-xl p-2 transition-colors",
                      isCurrentUser
                        ? "bg-fuchsia-50 dark:bg-fuchsia-900/20"
                        : "hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    )}
                  >
                    {/* Rank */}
                    <div className={clsx(
                      "flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm",
                      index === 0 ? "bg-amber-500 text-white" :
                      index === 1 ? "bg-neutral-400 text-white" :
                      index === 2 ? "bg-amber-700 text-white" :
                      "bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300"
                    )}>
                      {user.rank}
                    </div>

                    {/* Avatar */}
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="h-8 w-8 rounded-full" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white text-xs font-bold">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 text-left min-w-0">
                      <p className={clsx(
                        "font-medium text-sm truncate",
                        isCurrentUser && "text-fuchsia-600 dark:text-fuchsia-400"
                      )}>
                        {user.username}
                        {isCurrentUser && " (vous)"}
                        {isMayor && " 👑"}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {user.postCount} posts • {user.likesReceived} ❤️
                      </p>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <p className={clsx(
                        "font-bold",
                        isCurrentUser ? "text-fuchsia-500" : "text-neutral-600 dark:text-neutral-300"
                      )}>
                        {user.score}
                      </p>
                      <p className="text-[10px] text-neutral-400">pts</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* User not in leaderboard */}
            {currentUserHandle && !userRank && (
              <div className="mt-3 rounded-xl bg-neutral-50 p-3 text-center dark:bg-neutral-800">
                <p className="text-sm text-neutral-500">
                  Vous n'êtes pas encore classé ici
                </p>
                <p className="text-xs text-neutral-400">
                  Postez dans cette zone pour apparaître !
                </p>
              </div>
            )}
          </div>

          {/* Stats footer */}
          <div className="px-4 pb-4">
            <div className="grid grid-cols-3 gap-2 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800">
              <div className="text-center">
                <p className="text-lg font-bold text-fuchsia-500">{territory.totalPosts}</p>
                <p className="text-[10px] text-neutral-500">Posts</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-rose-500">{territory.totalLikes}</p>
                <p className="text-[10px] text-neutral-500">Likes</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-emerald-500">{territory.activeUsers}</p>
                <p className="text-[10px] text-neutral-500">Actifs</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Badge Maire pour afficher sur le profil ou la carte
export function MayorBadge({
  territoryName,
  emoji,
  streak,
  size = "md",
}: {
  territoryName: string;
  emoji: string;
  streak: number;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  return (
    <div className={clsx(
      "inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 font-medium text-white shadow-lg",
      sizeClasses[size]
    )}>
      <span>👑</span>
      <span>{emoji}</span>
      <span className="font-bold">{territoryName}</span>
      {streak > 1 && (
        <span className="rounded-full bg-white/20 px-1.5 text-xs">
          {streak}j
        </span>
      )}
    </div>
  );
}

// Overlay pour afficher les territoires sur la carte
export function TerritoryOverlay({
  territory,
  screenPosition,
  onClick,
}: {
  territory: Territory;
  screenPosition: { x: number; y: number };
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110",
        territory.isContested && "animate-pulse"
      )}
      style={{ left: screenPosition.x, top: screenPosition.y }}
    >
      <div className={clsx(
        "flex items-center gap-1 rounded-full px-2 py-1 shadow-lg",
        territory.isContested
          ? "bg-gradient-to-r from-rose-500 to-amber-500 text-white"
          : "bg-white text-neutral-700 dark:bg-neutral-800 dark:text-white"
      )}>
        <span className="text-sm">{territory.emoji}</span>
        <span className="text-xs font-bold">{territory.mayor?.username.slice(0, 8) || "?"}</span>
        <span className="text-xs">👑</span>
      </div>
    </button>
  );
}
