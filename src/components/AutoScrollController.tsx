"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { clsx } from "clsx";
import type { Post } from "@/lib/types";
import { timeAgo } from "@/lib/time";
import { ViewCounter } from "./ViewCounter";

interface AutoScrollControllerProps {
  posts: Post[];
  isEnabled: boolean;
  onToggle: () => void;
  onNavigateToPost: (post: Post) => void;
  onOpenPost: (post: Post) => void;
  currentUserHandle?: string;
}

export function AutoScrollController({
  posts,
  isEnabled,
  onToggle,
  onNavigateToPost,
  onOpenPost,
  currentUserHandle,
}: AutoScrollControllerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [currentPost, setCurrentPost] = useState<Post | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const popupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fonction pour passer au post suivant
  const nextPost = useCallback(() => {
    if (posts.length === 0 || isPaused) return;

    const nextIndex = (currentIndex + 1) % posts.length;
    const post = posts[nextIndex];
    
    setCurrentIndex(nextIndex);
    setCurrentPost(post);
    
    // Naviguer vers le post sur la carte
    onNavigateToPost(post);
    
    // Afficher le popup après un délai
    popupTimeoutRef.current = setTimeout(() => {
      setShowPopup(true);
    }, 2000); // 2s pour laisser la carte se déplacer

  }, [posts, currentIndex, isPaused, onNavigateToPost]);

  // Démarrer/arrêter le défilement automatique
  useEffect(() => {
    if (!isEnabled || posts.length === 0) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setShowPopup(false);
      return;
    }

    // Premier post immédiatement
    if (!currentPost && posts.length > 0) {
      setCurrentPost(posts[0]);
      onNavigateToPost(posts[0]);
      setTimeout(() => setShowPopup(true), 2000);
    }

    // Intervalle pour les posts suivants
    const interval = setInterval(() => {
      if (!isPaused) {
        setShowPopup(false);
        setTimeout(nextPost, 500); // Fermer le popup puis passer au suivant
      }
    }, 8000); // 8 secondes par post

    return () => {
      clearInterval(interval);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
    };
  }, [isEnabled, posts, isPaused, nextPost, currentPost, onNavigateToPost]);

  // Gérer le clic sur le popup
  const handlePopupClick = () => {
    if (currentPost) {
      onOpenPost(currentPost);
      setIsPaused(true);
    }
  };

  // Reprendre le défilement
  const handleResume = () => {
    setIsPaused(false);
    setShowPopup(false);
    setTimeout(nextPost, 500);
  };

  // Skip vers le prochain post
  const handleSkip = () => {
    setShowPopup(false);
    setTimeout(nextPost, 300);
  };

  return (
    <>
      {/* Bouton de contrôle */}
      <div className="fixed bottom-24 right-4 z-30">
        <button
          onClick={onToggle}
          className={clsx(
            "flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-lg transition-all",
            isEnabled
              ? "bg-fuchsia-500 text-white"
              : "bg-white text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
          )}
        >
          {isEnabled ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
              Auto-découverte
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

      {/* Popup flottant du post */}
      {isEnabled && showPopup && currentPost && (
        <div 
          className={clsx(
            "fixed left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2 transition-all duration-500",
            showPopup ? "scale-100 opacity-100" : "scale-90 opacity-0"
          )}
        >
          <div 
            className="relative w-80 max-w-[90vw] cursor-pointer overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-900"
            onClick={handlePopupClick}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Progress bar */}
            <div className="absolute left-0 top-0 h-1 w-full bg-neutral-200 dark:bg-neutral-700">
              <div 
                className={clsx(
                  "h-full bg-gradient-to-r from-fuchsia-500 to-amber-500 transition-all",
                  isPaused ? "" : "animate-progress"
                )}
                style={{ animationDuration: "8s" }}
              />
            </div>

            {/* Media preview */}
            {currentPost.media && (
              <div className="relative h-40 w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                {currentPost.media.type === "image" ? (
                  <img 
                    src={currentPost.media.url} 
                    alt="" 
                    className="h-full w-full object-cover"
                  />
                ) : (currentPost.media.type === "video" || currentPost.media.type === "youtube" || currentPost.media.type === "tiktok") && (
                  <div className="flex h-full w-full items-center justify-center bg-neutral-900">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                      <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                    {currentPost.media.thumbnail && (
                      <img 
                        src={currentPost.media.thumbnail} 
                        alt="" 
                        className="absolute inset-0 h-full w-full object-cover opacity-50"
                      />
                    )}
                  </div>
                )}
                
                {/* Badge type */}
                <div className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-xs font-medium text-white">
                  {currentPost.media.type === "youtube" ? "YouTube" : 
                   currentPost.media.type === "tiktok" ? "TikTok" : 
                   currentPost.media.type === "video" ? "Vidéo" : "Image"}
                </div>
              </div>
            )}

            {/* Content */}
            <div className="p-4">
              {/* Author */}
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/20 via-fuchsia-500/20 to-amber-500/20 text-sm font-bold">
                  {currentPost.author.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold">{currentPost.author}</p>
                  <p className="text-xs text-neutral-500">@{currentPost.handle} · {timeAgo(currentPost.createdAtISO)}</p>
                </div>
              </div>

              {/* Text */}
              <p className="mt-3 line-clamp-3 text-sm">{currentPost.text}</p>

              {/* Stats */}
              <div className="mt-3 flex items-center gap-4 text-xs text-neutral-500">
                <ViewCounter 
                  postId={currentPost.id}
                  initialViews={currentPost.views}
                  currentViews={currentPost.views}
                  isOwner={currentPost.handle === currentUserHandle}
                  size="sm"
                  showPulse={false}
                />
                <span className="flex items-center gap-1">
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                  {currentPost.likes}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {currentPost.comments.length}
                </span>
              </div>

              {/* CTA */}
              <p className="mt-3 text-center text-xs text-fuchsia-500">
                Touchez pour voir plus
              </p>
            </div>

            {/* Actions */}
            <div className="flex border-t border-neutral-100 dark:border-neutral-800">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSkip();
                }}
                className="flex-1 py-2 text-xs font-medium text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                Passer ›
              </button>
              <div className="w-px bg-neutral-100 dark:bg-neutral-800" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPaused(!isPaused);
                }}
                className="flex-1 py-2 text-xs font-medium text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                {isPaused ? "▶ Reprendre" : "⏸ Pause"}
              </button>
            </div>
          </div>

          {/* Indicateur de position */}
          <div className="mt-2 flex justify-center gap-1">
            {posts.slice(0, 10).map((_, idx) => (
              <div
                key={idx}
                className={clsx(
                  "h-1.5 rounded-full transition-all",
                  idx === currentIndex % 10
                    ? "w-4 bg-fuchsia-500"
                    : "w-1.5 bg-white/50"
                )}
              />
            ))}
          </div>
        </div>
      )}

      {/* Backdrop léger quand popup actif */}
      {isEnabled && showPopup && (
        <div 
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[2px]"
          onClick={() => {
            setShowPopup(false);
            handleResume();
          }}
        />
      )}

      {/* Style pour l'animation de la progress bar */}
      <style jsx global>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        .animate-progress {
          animation: progress linear forwards;
        }
      `}</style>
    </>
  );
}

// Hook pour gérer l'auto-scroll
export function useAutoScroll(posts: Post[]) {
  const [isEnabled, setIsEnabled] = useState(false);
  
  const toggle = useCallback(() => {
    setIsEnabled(prev => !prev);
  }, []);
  
  return {
    isEnabled,
    toggle,
    posts,
  };
}
