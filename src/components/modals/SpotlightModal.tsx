"use client";

import { useState, useEffect } from "react";
import { clsx } from "clsx";
import type { Post } from "@/lib/types";
import { timeAgo } from "@/lib/time";

interface SpotlightModalProps {
  post: Post;
  onClose: () => void;
  onLike?: () => void;
  onShare?: () => void;
  onReport?: () => void;
}

export function SpotlightModal({ post, onClose, onLike, onShare, onReport }: SpotlightModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animation d'entrée
    requestAnimationFrame(() => setIsVisible(true));
    
    // Bloquer le scroll
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const hasVideo = post.media?.type === "video" || post.media?.type === "youtube" || post.media?.type === "tiktok";
  const hasImage = post.media?.type === "image";

  // Extraire l'ID YouTube si c'est une vidéo YouTube
  const getYoutubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : null;
  };

  return (
    <div 
      className={clsx(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md transition-opacity duration-300",
        isVisible ? "opacity-100" : "opacity-0"
      )}
      onClick={handleClose}
    >
      {/* Close Button */}
      <button
        onClick={handleClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Content */}
      <div 
        className={clsx(
          "relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl transition-transform duration-300 dark:bg-neutral-900",
          isVisible ? "scale-100" : "scale-95"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Badge si post viral ou sponsorisé */}
        {(post.isFeatured || post.kind === "promoted") && (
          <div className="absolute left-4 top-4 z-10">
            <span className={clsx(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-lg",
              post.kind === "promoted" 
                ? "bg-amber-500 text-white" 
                : "bg-gradient-to-r from-fuchsia-500 to-sky-500 text-white"
            )}>
              {post.kind === "promoted" ? "✨ Sponsorisé" : "🔥 Viral"}
            </span>
          </div>
        )}

        {/* Media (Full width pour vidéo/image) */}
        {(hasVideo || hasImage) && (
          <div className="relative aspect-video w-full bg-black">
            {post.media?.type === "youtube" && post.media.url && (
              <iframe
                src={getYoutubeEmbedUrl(post.media.url) || ""}
                className="absolute inset-0 h-full w-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            )}
            {post.media?.type === "video" && (
              <video
                src={post.media.url}
                className="absolute inset-0 h-full w-full object-contain"
                controls
                autoPlay
                muted
              />
            )}
            {hasImage && (
              <img
                src={post.media?.url}
                alt=""
                className="absolute inset-0 h-full w-full object-contain"
              />
            )}
          </div>
        )}

        {/* Post Content */}
        <div className="p-6">
          {/* Author */}
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/20 via-fuchsia-500/20 to-amber-500/20 text-lg font-bold">
              {post.avatar ? (
                <img src={post.avatar} alt="" className="h-full w-full rounded-full object-cover" />
              ) : (
                post.author.charAt(0)
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold">{post.author}</span>
                {post.kind === "promoted" && (
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                    Sponsor
                  </span>
                )}
              </div>
              <span className="text-sm text-neutral-500">@{post.handle} · {timeAgo(post.createdAtISO)}</span>
            </div>
          </div>

          {/* Text */}
          <p className="mb-6 text-lg leading-relaxed">{post.text}</p>

          {/* Stats */}
          <div className="mb-6 flex items-center gap-6 text-sm text-neutral-500">
            <span className="flex items-center gap-1">
              <span className="text-lg">👁</span>
              {post.views.toLocaleString()} vues
            </span>
            <span className="flex items-center gap-1">
              <span className="text-lg">❤️</span>
              {post.likes.toLocaleString()} likes
            </span>
            <span className="flex items-center gap-1">
              <span className="text-lg">💬</span>
              {post.comments.length} commentaires
            </span>
            <span className="flex items-center gap-1">
              <span className="text-lg">🔄</span>
              {post.shares} partages
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onLike}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-100 py-3 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-200 dark:bg-rose-950/30 dark:text-rose-400"
            >
              <span className="text-lg">❤️</span>
              J&apos;aime
            </button>
            <button
              onClick={onShare}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-sky-100 py-3 text-sm font-medium text-sky-700 transition-colors hover:bg-sky-200 dark:bg-sky-950/30 dark:text-sky-400"
            >
              <span className="text-lg">🔗</span>
              Partager
            </button>
            <button
              onClick={onReport}
              className="flex items-center justify-center gap-2 rounded-xl bg-neutral-100 px-4 py-3 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400"
            >
              <span className="text-lg">🚩</span>
            </button>
          </div>
        </div>

        {/* Location if available */}
        {post.lat && post.lon && (
          <div className="border-t border-neutral-200 px-6 py-3 dark:border-neutral-800">
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <span>📍</span>
              <span>Position: {post.lat.toFixed(4)}, {post.lon.toFixed(4)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Composant pour afficher un mini popup sur la carte quand un post devient viral
interface ViralPopupProps {
  post: Post;
  position: { x: number; y: number };
  onClick: () => void;
}

export function ViralPopup({ post, position, onClick }: ViralPopupProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  return (
    <div
      className={clsx(
        "absolute z-30 cursor-pointer transition-all duration-500",
        isVisible ? "scale-100 opacity-100" : "scale-50 opacity-0"
      )}
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -100%)",
      }}
      onClick={onClick}
    >
      {/* Pulse animation */}
      <div className="absolute -inset-2 animate-ping rounded-full bg-fuchsia-500/30" />
      
      {/* Card */}
      <div className="relative w-64 rounded-2xl bg-white p-4 shadow-2xl dark:bg-neutral-900">
        {/* Arrow */}
        <div className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 bg-white dark:bg-neutral-900" />
        
        {/* Badge viral */}
        <div className="mb-2 flex items-center gap-2">
          <span className="animate-pulse text-lg">🔥</span>
          <span className="text-xs font-bold text-fuchsia-600">POST VIRAL</span>
        </div>

        {/* Author */}
        <div className="mb-2 flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-500/20 via-fuchsia-500/20 to-amber-500/20 font-bold flex items-center justify-center text-sm">
            {post.author.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-medium">{post.author}</p>
            <p className="text-xs text-neutral-500">@{post.handle}</p>
          </div>
        </div>

        {/* Preview */}
        <p className="mb-2 line-clamp-2 text-sm">{post.text}</p>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-neutral-500">
          <span>❤️ {post.likes}</span>
          <span>💬 {post.comments.length}</span>
          <span>👁 {post.views}</span>
        </div>

        {/* CTA */}
        <div className="mt-3 text-center text-xs font-medium text-fuchsia-600">
          Cliquez pour voir →
        </div>
      </div>
    </div>
  );
}
