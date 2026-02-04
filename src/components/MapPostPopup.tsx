"use client";

import { useState, useEffect, useRef } from "react";
import { clsx } from "clsx";
import type { Post } from "@/lib/types";
import { timeAgo } from "@/lib/time";

interface MapPostPopupProps {
  post: Post | null;
  screenPosition: { x: number; y: number } | null;
  onClose: () => void;
  onLike?: () => void;
  onComment?: () => void;
  onViewDetails?: () => void;
  isLiked?: boolean;
}

export default function MapPostPopup({
  post,
  screenPosition,
  onClose,
  onLike,
  onComment,
  onViewDetails,
  isLiked = false,
}: MapPostPopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (post && screenPosition) {
      // Animation d'entrée
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [post, screenPosition]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsExiting(false);
      onClose();
    }, 200);
  };

  if (!post || !screenPosition) return null;

  // Calculer la position du popup (au-dessus de la puce, centré)
  const popupWidth = 320;
  const popupHeight = 220;
  const verticalGap = 30;
  
  // Ajuster pour que le popup reste dans l'écran
  let left = screenPosition.x - popupWidth / 2;
  let top = screenPosition.y - popupHeight - verticalGap;
  let popupBelow = false;
  
  // Garder dans les limites de l'écran
  const margin = 16;
  if (typeof window !== "undefined") {
    left = Math.max(margin, Math.min(left, window.innerWidth - popupWidth - margin));
    // Si pas assez de place en haut, afficher en bas
    if (top < margin + 60) { // +60 pour la TopBar
      top = screenPosition.y + verticalGap;
      popupBelow = true;
    }
  }

  // Points de connexion pour la ligne
  const lineEndX = left + popupWidth / 2;
  const lineEndY = popupBelow ? top : top + popupHeight;

  const categoryColors: Record<string, string> = {
    vibe: "from-fuchsia-500 to-pink-500",
    news: "from-sky-500 to-blue-500",
    event: "from-amber-500 to-orange-500",
    alert: "from-rose-500 to-red-500",
  };

  const categoryEmojis: Record<string, string> = {
    vibe: "✨",
    news: "📰",
    event: "🎉",
    alert: "🚨",
  };

  return (
    <>
      {/* Ligne de connexion vers la puce */}
      <svg
        className={clsx(
          "pointer-events-none fixed inset-0 z-40 transition-opacity duration-300",
          isVisible && !isExiting ? "opacity-100" : "opacity-0"
        )}
        style={{ width: "100%", height: "100%" }}
      >
        <defs>
          <linearGradient id={`popup-line-${post.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#d946ef" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        {/* Ligne pointillée */}
        <line
          x1={screenPosition.x}
          y1={screenPosition.y}
          x2={lineEndX}
          y2={lineEndY}
          stroke={`url(#popup-line-${post.id})`}
          strokeWidth="2"
          strokeDasharray="8 4"
        />
        {/* Cercle pulsant sur la puce */}
        <circle
          cx={screenPosition.x}
          cy={screenPosition.y}
          r="12"
          fill="none"
          stroke="#d946ef"
          strokeWidth="2"
          opacity="0.6"
        >
          <animate attributeName="r" values="8;16;8" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <circle
          cx={screenPosition.x}
          cy={screenPosition.y}
          r="6"
          fill="#d946ef"
          className="drop-shadow-lg"
        />
      </svg>

      {/* Popup - utilise transform pour de meilleures performances GPU */}
      <div
        ref={popupRef}
        className={clsx(
          "pointer-events-auto fixed z-50 will-change-transform",
          isVisible && !isExiting
            ? "opacity-100"
            : "opacity-0"
        )}
        style={{
          left: 0,
          top: 0,
          width: `${popupWidth}px`,
          transform: `translate3d(${left}px, ${top}px, 0) ${isVisible && !isExiting ? 'scale(1)' : 'scale(0.9)'}`,
          transition: 'transform 300ms ease-out, opacity 300ms ease-out',
        }}
      >
        {/* Glow effect */}
        <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-sky-500/20 via-fuchsia-500/20 to-amber-500/20 blur-xl animate-pulse" />
      
      {/* Card */}
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-700/50">
        {/* Category badge */}
        <div className={clsx(
          "absolute left-0 top-0 flex items-center gap-1 rounded-br-xl bg-gradient-to-r px-3 py-1.5 text-xs font-bold text-white",
          categoryColors[post.category] || "from-neutral-500 to-neutral-600"
        )}>
          <span>{categoryEmojis[post.category]}</span>
          <span className="capitalize">{post.category}</span>
        </div>

        {/* Close button - bien visible */}
        <button
          onClick={handleClose}
          className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-neutral-800 text-white shadow-lg hover:bg-red-500 transition-colors"
          title="Fermer"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Media preview */}
        {post.media && (
          <div className="relative h-24 w-full bg-neutral-200 dark:bg-neutral-800">
            {post.media.type === "image" && (
              <img src={post.media.url} alt="" className="h-full w-full object-cover" />
            )}
            {(post.media.type === "video" || post.media.type === "youtube" || post.media.type === "tiktok") && (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90">
                  <svg className="h-5 w-5 text-neutral-800 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className={clsx("p-4", post.media ? "pt-3" : "pt-8")}>
          {/* Author */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/20 via-fuchsia-500/20 to-amber-500/20 text-sm font-bold">
              {post.author.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm truncate">{post.author}</span>
                <span className="text-xs text-neutral-400">@{post.handle}</span>
              </div>
              <span className="text-xs text-neutral-400">{timeAgo(post.createdAtISO)}</span>
            </div>
          </div>

          {/* Text */}
          <p className="text-sm text-neutral-700 dark:text-neutral-200 line-clamp-2 mb-3">
            {post.text}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800 pt-3">
            <div className="flex items-center gap-4">
              {/* Like */}
              <button
                onClick={onLike}
                className={clsx(
                  "flex items-center gap-1.5 text-xs transition-colors",
                  isLiked ? "text-rose-500" : "text-neutral-500 hover:text-rose-500"
                )}
              >
                <svg
                  className="h-4 w-4"
                  fill={isLiked ? "currentColor" : "none"}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={isLiked ? 0 : 2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>{post.likes}</span>
              </button>

              {/* Comments */}
              <button
                onClick={onComment}
                className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-sky-500 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>{post.comments?.length || 0}</span>
              </button>
            </div>

            {/* View details */}
            <button
              onClick={onViewDetails}
              className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-sky-500 via-fuchsia-500 to-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity"
            >
              Voir plus
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
