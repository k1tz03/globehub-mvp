"use client";

import { useState, useEffect } from "react";
import { clsx } from "clsx";
import type { Post } from "@/lib/types";
import { timeAgo } from "@/lib/time";

interface FeaturedPostModalProps {
  post: Post;
  onClose: () => void;
  onLike?: () => void;
  onShare?: () => void;
  onComment?: () => void;
}

export function FeaturedPostModal({ post, onClose, onLike, onShare, onComment }: FeaturedPostModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    // Prevent body scroll
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = "";
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    onLike?.();
  };

  // Extract YouTube ID if it's a YouTube video
  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return match ? match[1] : null;
  };

  return (
    <div 
      className={clsx(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-300",
        isVisible ? "opacity-100" : "opacity-0"
      )}
      onClick={handleClose}
    >
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 top-1/4 h-96 w-96 rounded-full bg-fuchsia-500/20 blur-3xl animate-pulse" />
        <div className="absolute -right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-sky-500/20 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/20 blur-3xl animate-pulse" style={{ animationDelay: "0.5s" }} />
      </div>

      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute right-6 top-6 z-10 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Featured badge */}
      <div className="absolute left-6 top-6 flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-amber-500 px-4 py-2 text-sm font-bold text-white">
        <span className="animate-pulse">⭐</span>
        <span>EN VEDETTE</span>
      </div>

      {/* Main content */}
      <div
        className={clsx(
          "relative mx-4 max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl transition-all duration-500 dark:bg-neutral-900",
          isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-10"
        )}
        onClick={(e) => e.stopPropagation()}
      >
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
            
            {post.media.type === "video" && (
              <video 
                src={post.media.url} 
                controls 
                autoPlay 
                className="h-full w-full"
              />
            )}
            
            {post.media.type === "youtube" && (
              <iframe
                src={`https://www.youtube.com/embed/${getYouTubeId(post.media.url)}?autoplay=1`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            )}

            {post.media.type === "tiktok" && (
              <div className="flex h-full items-center justify-center">
                <a
                  href={post.media.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 text-white"
                >
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20">
                    <svg className="h-10 w-10" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <span>Voir sur TikTok</span>
                </a>
              </div>
            )}
          </div>
        )}

        {/* Content section */}
        <div className="p-6 lg:p-8">
          {/* Author */}
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 via-fuchsia-500 to-amber-500 p-0.5">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-xl font-bold dark:bg-neutral-900">
                {post.avatar ? (
                  <img src={post.avatar} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  post.author.charAt(0)
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">{post.author}</h3>
                {post.kind === "promoted" && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                    Sponsorisé
                  </span>
                )}
              </div>
              <p className="text-sm text-neutral-500">@{post.handle} · {timeAgo(post.createdAtISO)}</p>
            </div>
          </div>

          {/* Text */}
          <p className="mb-6 text-lg leading-relaxed">{post.text}</p>

          {/* Stats */}
          <div className="mb-6 flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl">❤️</span>
              <div>
                <p className="text-xl font-bold">{post.likes.toLocaleString()}</p>
                <p className="text-xs text-neutral-500">J&apos;aime</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">💬</span>
              <div>
                <p className="text-xl font-bold">{post.comments.length}</p>
                <p className="text-xs text-neutral-500">Commentaires</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔄</span>
              <div>
                <p className="text-xl font-bold">{post.shares}</p>
                <p className="text-xs text-neutral-500">Partages</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">👁️</span>
              <div>
                <p className="text-xl font-bold">{post.views.toLocaleString()}</p>
                <p className="text-xs text-neutral-500">Vues</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleLike}
              className={clsx(
                "flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium transition-all",
                isLiked
                  ? "bg-rose-500 text-white"
                  : "bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
              )}
            >
              <span>{isLiked ? "❤️" : "🤍"}</span>
              {isLiked ? "Aimé" : "J'aime"}
            </button>
            <button
              onClick={onComment}
              className="flex items-center gap-2 rounded-xl bg-neutral-100 px-6 py-3 text-sm font-medium transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
            >
              <span>💬</span>
              Commenter
            </button>
            <button
              onClick={onShare}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-amber-500 px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              <span>🔗</span>
              Partager
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
