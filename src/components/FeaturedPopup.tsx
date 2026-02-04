"use client";

import { useState, useEffect } from "react";
import { clsx } from "clsx";
import { timeAgo } from "@/lib/time";
import type { Post } from "@/lib/types";

type FeaturedPopupProps = {
  post: Post;
  onClose: () => void;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
};

export default function FeaturedPopup({ post, onClose, onLike, onComment, onShare }: FeaturedPopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showFullText, setShowFullText] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 50);

    // Auto-close after 30 seconds if it's just a text post
    if (!post.media) {
      const timeout = setTimeout(() => {
        handleClose();
      }, 30000);
      return () => clearTimeout(timeout);
    }
  }, [post.media]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300",
        isVisible ? "bg-black/80 backdrop-blur-md" : "bg-black/0"
      )}
      onClick={handleClose}
    >
      <div
        className={clsx(
          "relative w-full max-w-4xl transform transition-all duration-300",
          isVisible ? "scale-100 opacity-100" : "scale-90 opacity-0"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Featured badge */}
        <div className="absolute -top-4 left-1/2 z-10 -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 via-fuchsia-500 to-sky-500 px-6 py-2 text-sm font-bold text-white shadow-2xl">
            <span className="animate-pulse">⭐</span>
            <span>POST À LA UNE</span>
            <span className="animate-pulse">⭐</span>
          </div>
        </div>

        {/* Main container */}
        <div className="overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-neutral-900">
          {/* Media section */}
          {post.media && (
            <div className="relative aspect-video w-full bg-black">
              {post.media.type === "image" && (
                <img
                  src={post.media.url}
                  alt=""
                  className="h-full w-full object-contain"
                />
              )}
              {post.media.type === "youtube" && (
                <iframe
                  src={post.media.url.replace("watch?v=", "embed/") + "?autoplay=1"}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
              {post.media.type === "video" && (
                <video
                  src={post.media.url}
                  className="h-full w-full"
                  controls
                  autoPlay
                  muted
                />
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />

              {/* Author info on media */}
              <div className="absolute bottom-4 left-4 flex items-center gap-3 text-white">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-lg font-bold backdrop-blur-sm">
                  {post.avatar ? (
                    <img src={post.avatar} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    post.author.charAt(0)
                  )}
                </div>
                <div>
                  <p className="font-bold">{post.author}</p>
                  <p className="text-sm opacity-80">@{post.handle} • {timeAgo(post.createdAtISO)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Content section */}
          <div className="p-6">
            {/* Author (if no media) */}
            {!post.media && (
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/20 via-fuchsia-500/20 to-amber-500/20 text-xl font-bold">
                  {post.author.charAt(0)}
                </div>
                <div>
                  <p className="text-lg font-bold">{post.author}</p>
                  <p className="text-neutral-500">@{post.handle} • {timeAgo(post.createdAtISO)}</p>
                </div>
              </div>
            )}

            {/* Text */}
            <div className={clsx(
              "text-lg",
              !showFullText && post.text.length > 300 && "line-clamp-4"
            )}>
              {post.text}
            </div>

            {post.text.length > 300 && (
              <button
                onClick={() => setShowFullText(!showFullText)}
                className="mt-2 text-sm font-medium text-fuchsia-500 hover:text-fuchsia-600"
              >
                {showFullText ? "Voir moins" : "Voir plus"}
              </button>
            )}

            {/* Category badge */}
            <div className="mt-4 flex items-center gap-2">
              <span className={clsx(
                "rounded-full px-3 py-1 text-sm font-medium",
                post.category === "event" && "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/50",
                post.category === "news" && "bg-sky-100 text-sky-700 dark:bg-sky-950/50",
                post.category === "alert" && "bg-rose-100 text-rose-700 dark:bg-rose-950/50",
                post.category === "vibe" && "bg-amber-100 text-amber-700 dark:bg-amber-950/50"
              )}>
                {post.category === "event" ? "🎉 Événement" :
                 post.category === "news" ? "📰 Actualité" :
                 post.category === "alert" ? "🚨 Alerte" : "✨ Vibe"}
              </span>
              {post.lat && post.lon && (
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-600 dark:bg-neutral-800">
                  📍 Localisé
                </span>
              )}
            </div>

            {/* Stats */}
            <div className="mt-6 flex items-center justify-between border-t border-neutral-200 pt-4 dark:border-neutral-700">
              <div className="flex gap-6">
                <button
                  onClick={onLike}
                  className="flex items-center gap-2 text-neutral-600 transition-colors hover:text-rose-500 dark:text-neutral-400"
                >
                  <span className="text-xl">❤️</span>
                  <span className="font-bold">{post.likes}</span>
                </button>
                <button
                  onClick={onComment}
                  className="flex items-center gap-2 text-neutral-600 transition-colors hover:text-sky-500 dark:text-neutral-400"
                >
                  <span className="text-xl">💬</span>
                  <span className="font-bold">{post.comments.length}</span>
                </button>
                <button
                  onClick={onShare}
                  className="flex items-center gap-2 text-neutral-600 transition-colors hover:text-emerald-500 dark:text-neutral-400"
                >
                  <span className="text-xl">🔄</span>
                  <span className="font-bold">{post.shares}</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-500">Score de viralité</span>
                <span className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-sm font-bold text-white">
                  {post.viralityScore}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute -right-4 -top-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-lg hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700"
        >
          ×
        </button>

        {/* Decorative glow */}
        <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-r from-amber-500/20 via-fuchsia-500/20 to-sky-500/20 blur-2xl" />
      </div>
    </div>
  );
}
