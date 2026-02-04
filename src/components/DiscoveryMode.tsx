"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { clsx } from "clsx";
import type { Post, User } from "@/lib/types";

interface DiscoveryModeProps {
  posts: Post[];
  currentUser: User | null;
  isEnabled: boolean;
  onToggle: () => void;
  onSelectPost: (post: Post) => void;
  onFlyTo: (coords: { lon: number; lat: number }) => void;
  interval?: number; // ms entre chaque post
}

export function useDiscoveryMode(
  recommendedPosts: Post[],
  isEnabled: boolean,
  interval: number = 8000
) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPost, setCurrentPost] = useState<Post | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const postsRef = useRef<Post[]>([]);

  // Filtrer les posts avec coordonnées et stocker dans ref
  const postsWithCoords = useMemo(() => {
    return recommendedPosts.filter(
      (p) => typeof p.lon === "number" && typeof p.lat === "number"
    );
  }, [recommendedPosts]);

  // Mettre à jour la ref quand les posts changent
  useEffect(() => {
    postsRef.current = postsWithCoords;
  }, [postsWithCoords]);

  const goToNext = useCallback(() => {
    const posts = postsRef.current;
    if (posts.length === 0) return;
    
    setIsTransitioning(true);
    
    setTimeout(() => {
      setCurrentIndex(prev => {
        const nextIndex = (prev + 1) % posts.length;
        setCurrentPost(posts[nextIndex]);
        return nextIndex;
      });
      setIsTransitioning(false);
    }, 300);
  }, []);

  const goToPrevious = useCallback(() => {
    const posts = postsRef.current;
    if (posts.length === 0) return;
    
    setIsTransitioning(true);
    
    setTimeout(() => {
      setCurrentIndex(prev => {
        const prevIndex = prev === 0 ? posts.length - 1 : prev - 1;
        setCurrentPost(posts[prevIndex]);
        return prevIndex;
      });
      setIsTransitioning(false);
    }, 300);
  }, []);

  // Initialiser avec le premier post
  useEffect(() => {
    if (isEnabled && postsWithCoords.length > 0 && !currentPost) {
      setCurrentPost(postsWithCoords[0]);
      setCurrentIndex(0);
    }
  }, [isEnabled, postsWithCoords, currentPost]);

  // Timer automatique
  useEffect(() => {
    if (!isEnabled || postsWithCoords.length === 0) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    timeoutRef.current = setTimeout(goToNext, interval);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isEnabled, currentIndex, interval, goToNext, postsWithCoords.length]);

  // Reset quand on désactive
  useEffect(() => {
    if (!isEnabled) {
      setCurrentPost(null);
      setCurrentIndex(0);
    }
  }, [isEnabled]);

  return {
    currentPost,
    currentIndex,
    totalPosts: postsWithCoords.length,
    isTransitioning,
    goToNext,
    goToPrevious,
  };
}

export default function DiscoveryMode({
  posts,
  currentUser,
  isEnabled,
  onToggle,
  onSelectPost,
  onFlyTo,
  interval = 8000,
}: DiscoveryModeProps) {
  const {
    currentPost,
    currentIndex,
    totalPosts,
    isTransitioning,
    goToNext,
    goToPrevious,
  } = useDiscoveryMode(posts, isEnabled, interval);

  const [progress, setProgress] = useState(0);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Barre de progression - optimisée à 200ms pour réduire les re-renders
  useEffect(() => {
    if (!isEnabled || !currentPost) {
      setProgress(0);
      if (progressRef.current) {
        clearInterval(progressRef.current);
        progressRef.current = null;
      }
      return;
    }

    setProgress(0);
    const updateInterval = 200; // Mise à jour toutes les 200ms (5x/sec au lieu de 20x/sec)
    const step = 100 / (interval / updateInterval);

    progressRef.current = setInterval(() => {
      setProgress((prev) => Math.min(prev + step, 100));
    }, updateInterval);

    return () => {
      if (progressRef.current) {
        clearInterval(progressRef.current);
      }
    };
  }, [isEnabled, currentPost, currentIndex, interval]);

  // Fly to current post
  useEffect(() => {
    if (isEnabled && currentPost && typeof currentPost.lon === "number" && typeof currentPost.lat === "number") {
      onFlyTo({ lon: currentPost.lon, lat: currentPost.lat });
    }
  }, [isEnabled, currentPost, onFlyTo]);

  return (
    <>
      {/* Toggle Button */}
      <div className="fixed bottom-16 right-4 z-30">
        <button
          onClick={onToggle}
          className={clsx(
            "flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-lg transition-all",
            isEnabled
              ? "bg-gradient-to-r from-sky-500 via-fuchsia-500 to-amber-500 text-white"
              : "bg-white text-neutral-700 hover:bg-neutral-50 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
          )}
        >
          {isEnabled ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
              Exploration
              {/* Croix de fermeture intégrée */}
              <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              Explorer
            </>
          )}
        </button>
      </div>

      {/* Discovery Controls */}
      {isEnabled && (
        <div className="fixed bottom-28 right-4 z-30">
          <div className="flex flex-col items-end gap-2">
            {/* Progress bar - transition plus longue pour compenser l'intervalle de mise à jour */}
            <div className="w-48 h-1 bg-white/30 rounded-full overflow-hidden backdrop-blur">
              <div
                className="h-full bg-white transition-all duration-200 ease-linear rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 shadow-lg backdrop-blur dark:bg-neutral-800/90">
              <button
                onClick={goToPrevious}
                className="rounded-full p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                title="Précédent"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <span className="text-xs font-medium min-w-[60px] text-center">
                {currentIndex + 1} / {totalPosts}
              </span>

              <button
                onClick={goToNext}
                className="rounded-full p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                title="Suivant"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Bouton fermer explicite */}
              <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-600 mx-1" />
              <button
                onClick={onToggle}
                className="rounded-full p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-neutral-500 hover:text-red-500 transition-colors"
                title="Fermer l'exploration"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
