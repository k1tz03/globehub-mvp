"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";
import type { Post } from "@/lib/types";
import { timeAgo } from "@/lib/time";

interface FeaturedPostPopupProps {
  post: Post;
  onClose: () => void;
  onLike?: () => void;
  onShare?: () => void;
}

export function FeaturedPostPopup({ post, onClose, onLike, onShare }: FeaturedPostPopupProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animation d'entrée
    setTimeout(() => setVisible(true), 50);

    // Auto-close après 30s si pas d'interaction
    const timeout = setTimeout(() => {
      handleClose();
    }, 30000);

    return () => clearTimeout(timeout);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div 
      className={clsx(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0"
      )}
      onClick={handleClose}
    >
      <div 
        className={clsx(
          "relative w-full max-w-2xl transform transition-all duration-300",
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Badge Featured */}
        <div className="absolute -top-4 left-1/2 z-10 -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 via-fuchsia-500 to-sky-500 px-4 py-2 text-sm font-bold text-white shadow-lg">
            <span className="animate-pulse">🔥</span>
            POST VIRAL
            <span className="animate-pulse">🔥</span>
          </div>
        </div>

        {/* Card */}
        <div className="overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-neutral-900">
          {/* Media */}
          {post.media && (
            <div className="relative aspect-video w-full bg-neutral-900">
              {post.media.type === "image" && (
                <img 
                  src={post.media.url} 
                  alt="" 
                  className="h-full w-full object-cover"
                />
              )}
              {post.media.type === "video" && (
                <video 
                  src={post.media.url} 
                  controls 
                  autoPlay 
                  muted 
                  className="h-full w-full object-cover"
                />
              )}
              {post.media.type === "youtube" && (
                <iframe
                  src={post.media.url.replace("watch?v=", "embed/") + "?autoplay=1&mute=1"}
                  className="h-full w-full"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              )}
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {/* Author */}
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/20 via-fuchsia-500/20 to-amber-500/20 text-xl font-bold">
                {post.avatar ? (
                  <img src={post.avatar} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  post.author.charAt(0)
                )}
              </div>
              <div>
                <p className="font-bold">{post.author}</p>
                <p className="text-sm text-neutral-500">@{post.handle} · {timeAgo(post.createdAtISO)}</p>
              </div>
              {post.isFeatured && (
                <span className="ml-auto rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                  Sponsorisé
                </span>
              )}
            </div>

            {/* Text */}
            <p className="mb-4 text-lg leading-relaxed">{post.text}</p>

            {/* Stats */}
            <div className="mb-6 flex items-center gap-6 border-y border-neutral-200 py-4 dark:border-neutral-800">
              <div className="text-center">
                <p className="text-2xl font-bold text-fuchsia-500">{post.likes}</p>
                <p className="text-xs text-neutral-500">Likes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-sky-500">{post.comments.length}</p>
                <p className="text-xs text-neutral-500">Commentaires</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-500">{post.shares}</p>
                <p className="text-xs text-neutral-500">Partages</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-500">{post.views}</p>
                <p className="text-xs text-neutral-500">Vues</p>
              </div>
              <div className="ml-auto text-center">
                <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-fuchsia-500 to-sky-500">
                  {post.viralityScore}
                </p>
                <p className="text-xs text-neutral-500">Score Viral</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button 
                onClick={onLike}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-fuchsia-500 py-3 text-sm font-medium text-white transition-colors hover:bg-fuchsia-600"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                J&apos;aime
              </button>
              <button 
                onClick={onShare}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-neutral-100 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Partager
              </button>
            </div>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute -top-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-neutral-600 shadow-lg transition-colors hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Mini popup qui apparaît au coin de l'écran pour les posts viraux
export function ViralPostToast({ 
  post, 
  onView, 
  onDismiss 
}: { 
  post: Post; 
  onView: () => void; 
  onDismiss: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
    
    // Auto-dismiss après 10s
    const timeout = setTimeout(() => {
      handleDismiss();
    }, 10000);

    return () => clearTimeout(timeout);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(onDismiss, 300);
  };

  return (
    <div 
      className={clsx(
        "fixed bottom-4 right-4 z-40 w-80 transform transition-all duration-300",
        visible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      )}
    >
      <div className="overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-900">
        {/* Header */}
        <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500 via-fuchsia-500 to-sky-500 px-4 py-2 text-sm font-bold text-white">
          <span className="animate-pulse">🔥</span>
          Post en tendance !
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/20 via-fuchsia-500/20 to-amber-500/20 text-sm font-bold">
              {post.author.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium">{post.author}</p>
              <p className="text-xs text-neutral-500">@{post.handle}</p>
            </div>
          </div>
          <p className="mb-3 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
            {post.text}
          </p>
          <div className="flex items-center gap-4 text-xs text-neutral-500">
            <span>❤️ {post.likes}</span>
            <span>💬 {post.comments.length}</span>
            <span className="font-bold text-fuchsia-500">🔥 {post.viralityScore}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex border-t border-neutral-200 dark:border-neutral-800">
          <button
            onClick={onView}
            className="flex-1 py-3 text-sm font-medium text-fuchsia-500 transition-colors hover:bg-fuchsia-50 dark:hover:bg-fuchsia-950/30"
          >
            Voir le post
          </button>
          <button
            onClick={handleDismiss}
            className="flex-1 border-l border-neutral-200 py-3 text-sm text-neutral-500 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800"
          >
            Ignorer
          </button>
        </div>
      </div>
    </div>
  );
}
