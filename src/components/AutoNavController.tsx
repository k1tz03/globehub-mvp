"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { clsx } from "clsx";
import type { Post } from "@/lib/types";

interface AutoNavControllerProps {
  posts: Post[];
  isEnabled: boolean;
  onToggle: () => void;
  onNavigate: (post: Post) => void;
  onOpenPost: (post: Post) => void;
  currentUserHandle?: string;
}

export function AutoNavController({
  posts,
  isEnabled,
  onToggle,
  onNavigate,
  onOpenPost,
  currentUserHandle,
}: AutoNavControllerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const currentPost = posts[currentIndex];
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Durée par post en ms
  const DURATION = 8000;

  // Fonction pour passer au prochain post
  const nextPost = useCallback(() => {
    if (posts.length === 0) return;
    
    setShowPopup(false);
    setProgress(0);
    
    setTimeout(() => {
      const nextIdx = (currentIndex + 1) % posts.length;
      setCurrentIndex(nextIdx);
      const post = posts[nextIdx];
      
      if (post.lat && post.lon) {
        onNavigate(post);
      }
      
      // Afficher le popup après navigation
      setTimeout(() => {
        setShowPopup(true);
      }, 2000);
    }, 500);
  }, [posts, currentIndex, onNavigate]);

  // Gestion de l'auto-navigation
  useEffect(() => {
    if (!isEnabled || posts.length === 0 || isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
      return;
    }

    // Premier post
    if (currentPost && currentPost.lat && currentPost.lon) {
      onNavigate(currentPost);
      setTimeout(() => setShowPopup(true), 2000);
    }

    // Progress bar
    progressRef.current = setInterval(() => {
      setProgress(p => Math.min(p + (100 / (DURATION / 100)), 100));
    }, 100);

    // Timer pour le prochain post
    intervalRef.current = setTimeout(nextPost, DURATION);

    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [isEnabled, isPaused, currentIndex, posts.length, currentPost, onNavigate, nextPost]);

  // Reset progress quand on change de post
  useEffect(() => {
    setProgress(0);
  }, [currentIndex]);

  const handleSkip = () => {
    if (intervalRef.current) clearTimeout(intervalRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
    nextPost();
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleOpenFull = () => {
    if (currentPost) {
      setIsPaused(true);
      onOpenPost(currentPost);
    }
  };

  const timeAgo = (iso: string) => {
    const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (seconds < 60) return "À l'instant";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}j`;
  };

  return (
    <>
      {/* Bouton de contrôle */}
      <div className="fixed bottom-24 right-4 z-20 sm:bottom-24 sm:right-6">
        <button
          onClick={onToggle}
          className={clsx(
            "flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-lg backdrop-blur-md transition-all",
            isEnabled
              ? "bg-gradient-to-r from-fuchsia-500 to-amber-500 text-white"
              : "bg-white/90 text-neutral-700 hover:bg-white dark:bg-neutral-800/90 dark:text-neutral-300"
          )}
        >
          {isEnabled ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
              Découverte
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Découvrir
            </>
          )}
        </button>
      </div>

      {/* Popup du post */}
      {isEnabled && showPopup && currentPost && (
        <div className="fixed bottom-1/2 left-1/2 z-40 -translate-x-1/2 translate-y-1/2 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2">
          <div 
            className={clsx(
              "w-80 max-w-[90vw] overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-900 transition-all duration-500",
              showPopup ? "scale-100 opacity-100" : "scale-90 opacity-0"
            )}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Progress bar */}
            <div className="h-1 w-full bg-neutral-200 dark:bg-neutral-700">
              <div 
                className="h-full bg-gradient-to-r from-fuchsia-500 to-amber-500 transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Media */}
            {currentPost.media && (
              <div className="relative h-44 w-full bg-neutral-100 dark:bg-neutral-800">
                {currentPost.media.type === "image" ? (
                  <img 
                    src={currentPost.media.url} 
                    alt="" 
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-neutral-900">
                    {currentPost.media.thumbnail && (
                      <img 
                        src={currentPost.media.thumbnail} 
                        alt="" 
                        className="absolute inset-0 h-full w-full object-cover opacity-50"
                      />
                    )}
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                      <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                )}
                
                {/* Badge type */}
                <div className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                  {currentPost.media.type === "youtube" ? "YouTube" : 
                   currentPost.media.type === "tiktok" ? "TikTok" : 
                   currentPost.media.type === "video" ? "Vidéo" : "Photo"}
                </div>
              </div>
            )}

            {/* Contenu */}
            <div className="p-4" onClick={handleOpenFull}>
              {/* Auteur */}
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500/20 to-amber-500/20 text-sm font-bold">
                  {currentPost.avatar ? (
                    <img src={currentPost.avatar} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    currentPost.author.charAt(0)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold">{currentPost.author}</p>
                  <p className="text-xs text-neutral-500">@{currentPost.handle} · {timeAgo(currentPost.createdAtISO)}</p>
                </div>
                {currentPost.isVerified && (
                  <svg className="h-4 w-4 text-sky-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>

              {/* Texte */}
              <p className="mt-3 line-clamp-3 text-sm cursor-pointer hover:text-fuchsia-500 transition-colors">
                {currentPost.text}
              </p>

              {/* Stats */}
              <div className="mt-3 flex items-center gap-4 text-xs text-neutral-500">
                <span className="flex items-center gap-1">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {currentPost.views >= 1000 ? `${(currentPost.views / 1000).toFixed(1)}K` : currentPost.views}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                  {currentPost.likes}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {currentPost.comments.length}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex border-t border-neutral-100 dark:border-neutral-800">
              <button
                onClick={handleSkip}
                className="flex-1 py-2.5 text-xs font-medium text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                Passer ›
              </button>
              <div className="w-px bg-neutral-100 dark:bg-neutral-800" />
              <button
                onClick={handlePause}
                className="flex-1 py-2.5 text-xs font-medium text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                {isPaused ? "▶ Reprendre" : "⏸ Pause"}
              </button>
              <div className="w-px bg-neutral-100 dark:bg-neutral-800" />
              <button
                onClick={handleOpenFull}
                className="flex-1 py-2.5 text-xs font-medium text-fuchsia-500 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-950/20 transition-colors"
              >
                Voir plus
              </button>
            </div>
          </div>

          {/* Indicateurs de position */}
          <div className="mt-3 flex justify-center gap-1">
            {posts.slice(Math.max(0, currentIndex - 2), currentIndex + 3).map((_, idx) => {
              const actualIdx = Math.max(0, currentIndex - 2) + idx;
              return (
                <div
                  key={actualIdx}
                  className={clsx(
                    "h-1.5 rounded-full transition-all",
                    actualIdx === currentIndex
                      ? "w-6 bg-fuchsia-500"
                      : "w-1.5 bg-white/50"
                  )}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Backdrop léger */}
      {isEnabled && showPopup && (
        <div 
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[2px]"
          onClick={() => {
            setShowPopup(false);
            onToggle();
          }}
        />
      )}
    </>
  );
}

// Hook pour l'auto-navigation
export function useAutoNav() {
  const [isEnabled, setIsEnabled] = useState(false);
  
  const toggle = useCallback(() => {
    setIsEnabled(prev => !prev);
  }, []);

  const enable = useCallback(() => setIsEnabled(true), []);
  const disable = useCallback(() => setIsEnabled(false), []);
  
  return { isEnabled, toggle, enable, disable };
}
