"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";
import type { Post } from "@/lib/types";
import { timeAgo } from "@/lib/time";

type Props = {
  post: Post | null;
  onClose: () => void;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  isLiked?: boolean;
};

export function FeaturedPostPopup({ post, onClose, onLike, onComment, onShare, isLiked }: Props) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (post) {
      setIsVisible(true);
    }
  }, [post]);

  if (!post) return null;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 transition-opacity duration-300",
        isVisible ? "opacity-100" : "opacity-0"
      )}
      onClick={handleClose}
    >
      <div
        className={clsx(
          "relative w-full max-w-2xl transform rounded-3xl bg-gradient-to-br from-neutral-900 to-neutral-800 shadow-2xl transition-all duration-300",
          isVisible ? "scale-100 opacity-100" : "scale-90 opacity-0"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute -right-3 -top-3 z-10 rounded-full bg-white p-2 shadow-lg hover:bg-neutral-100"
        >
          <svg className="h-5 w-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Featured badge */}
        <div className="absolute -left-2 -top-2 z-10">
          <div className="rounded-full bg-gradient-to-r from-amber-500 to-fuchsia-500 px-4 py-1.5 text-sm font-bold text-white shadow-lg">
            ⭐ Post en vedette
          </div>
        </div>

        {/* Media (if any) */}
        {post.media && (
          <div className="relative aspect-video w-full overflow-hidden rounded-t-3xl bg-black">
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
                className="h-full w-full object-contain"
              />
            )}
            {(post.media.type === "youtube" || post.media.type === "tiktok") && (
              <div className="flex h-full items-center justify-center">
                <a
                  href={post.media.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-white/20 p-6 backdrop-blur transition-transform hover:scale-110"
                >
                  <svg className="h-16 w-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </a>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Author */}
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 via-fuchsia-500 to-amber-500 text-xl font-bold text-white">
              {post.avatar ? (
                <img src={post.avatar} alt="" className="h-14 w-14 rounded-full object-cover" />
              ) : (
                post.author.charAt(0)
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white">{post.author}</span>
                {post.kind === "promoted" && (
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">Sponsorisé</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <span>@{post.handle}</span>
                <span>•</span>
                <span>{timeAgo(post.createdAtISO)}</span>
              </div>
            </div>
          </div>

          {/* Text */}
          <p className="mt-4 text-lg leading-relaxed text-white">{post.text}</p>

          {/* Location */}
          {post.lat && post.lon && (
            <div className="mt-4 flex items-center gap-2 text-sm text-neutral-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Géolocalisé</span>
            </div>
          )}

          {/* Stats */}
          <div className="mt-6 flex items-center justify-between border-t border-neutral-700 pt-4">
            <div className="flex gap-6">
              <button
                onClick={onLike}
                className={clsx(
                  "flex items-center gap-2 transition-colors",
                  isLiked ? "text-rose-500" : "text-neutral-400 hover:text-rose-500"
                )}
              >
                <svg className="h-6 w-6" fill={isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="font-medium">{post.likes}</span>
              </button>
              <button
                onClick={onComment}
                className="flex items-center gap-2 text-neutral-400 transition-colors hover:text-sky-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="font-medium">{post.comments.length}</span>
              </button>
              <button
                onClick={onShare}
                className="flex items-center gap-2 text-neutral-400 transition-colors hover:text-emerald-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span className="font-medium">{post.shares}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-neutral-500">{post.views} vues</span>
              <span className="rounded-full bg-gradient-to-r from-fuchsia-500 to-amber-500 px-3 py-1 text-xs font-bold text-white">
                🔥 {post.viralityScore}
              </span>
            </div>
          </div>
        </div>

        {/* Glow effect */}
        <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-fuchsia-500/10 via-transparent to-amber-500/10" />
      </div>
    </div>
  );
}
