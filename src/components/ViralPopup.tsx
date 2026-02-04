"use client";

import { useState, useEffect } from "react";
import { clsx } from "clsx";
import type { Post } from "@/lib/types";
import { timeAgo } from "@/lib/time";

interface ViralPopupProps {
  post: Post;
  pinPosition: { x: number; y: number }; // Position de la puce sur l'écran
  onClose: () => void;
  onClick: () => void;
  index: number; // Pour gérer le décalage vertical
}

export function ViralPopup({ post, pinPosition, onClose, onClick, index }: ViralPopupProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50 + index * 100);
    return () => clearTimeout(timer);
  }, [index]);

  // Calculer la position du popup (au-dessus de la puce)
  const popupWidth = 280;
  const popupHeight = 180;
  const verticalOffset = 20 + index * (popupHeight + 30); // Décalage pour éviter superposition
  
  // Position de base : au-dessus de la puce
  let popupLeft = pinPosition.x - popupWidth / 2;
  let popupTop = pinPosition.y - popupHeight - verticalOffset;
  
  // Ajuster pour rester dans l'écran
  const margin = 16;
  if (typeof window !== "undefined") {
    popupLeft = Math.max(margin, Math.min(popupLeft, window.innerWidth - popupWidth - margin));
    
    // Si pas assez de place en haut, mettre à droite ou à gauche
    if (popupTop < margin) {
      popupTop = pinPosition.y - popupHeight / 2;
      popupLeft = pinPosition.x + 30; // À droite de la puce
      
      if (popupLeft + popupWidth > window.innerWidth - margin) {
        popupLeft = pinPosition.x - popupWidth - 30; // À gauche
      }
    }
  }

  // Calculer le point de connexion pour la ligne
  const lineStartX = pinPosition.x;
  const lineStartY = pinPosition.y;
  const lineEndX = popupLeft + popupWidth / 2;
  const lineEndY = popupTop + popupHeight;

  return (
    <>
      {/* Ligne de connexion vers la puce */}
      <svg
        className={clsx(
          "pointer-events-none fixed inset-0 z-40 transition-opacity duration-300",
          isVisible ? "opacity-100" : "opacity-0"
        )}
        style={{ width: "100%", height: "100%" }}
      >
        <defs>
          <linearGradient id={`line-gradient-${post.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d946ef" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        <line
          x1={lineStartX}
          y1={lineStartY}
          x2={lineEndX}
          y2={lineEndY}
          stroke={`url(#line-gradient-${post.id})`}
          strokeWidth="2"
          strokeDasharray="6 4"
          className="animate-pulse"
        />
        {/* Cercle au point de la puce */}
        <circle
          cx={lineStartX}
          cy={lineStartY}
          r="8"
          fill="none"
          stroke="#d946ef"
          strokeWidth="2"
          className="animate-ping"
          style={{ transformOrigin: `${lineStartX}px ${lineStartY}px` }}
        />
        <circle
          cx={lineStartX}
          cy={lineStartY}
          r="4"
          fill="#d946ef"
        />
      </svg>

      {/* Popup */}
      <div
        className={clsx(
          "pointer-events-auto fixed z-50 transition-all duration-300",
          isVisible ? "scale-100 opacity-100" : "scale-90 opacity-0 translate-y-4"
        )}
        style={{
          left: `${popupLeft}px`,
          top: `${popupTop}px`,
          width: `${popupWidth}px`,
        }}
      >
        {/* Glow */}
        <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-fuchsia-500/30 via-amber-500/30 to-sky-500/30 blur-xl animate-pulse" />
        
        <div className="relative cursor-pointer overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-900" onClick={onClick}>
          {/* Badge VIRAL */}
          <div className="absolute left-0 top-0 flex items-center gap-1 rounded-br-xl bg-gradient-to-r from-fuchsia-500 to-amber-500 px-3 py-1.5 text-xs font-bold text-white">
            <span className="animate-bounce">🔥</span>
            <span>VIRAL</span>
          </div>

          {/* Bouton fermer */}
          <button
            onClick={(e) => { e.stopPropagation(); setIsVisible(false); setTimeout(onClose, 300); }}
            className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-neutral-800 text-white shadow-lg hover:bg-red-500 transition-colors"
            title="Fermer"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Media */}
          {post.media && (
            <div className="relative h-24 w-full bg-neutral-200 dark:bg-neutral-800">
              {post.media.type === "image" && (
                <img src={post.media.url} alt="" className="h-full w-full object-cover" />
              )}
              {(post.media.type === "video" || post.media.type === "youtube" || post.media.type === "tiktok") && (
                <div className="flex h-full items-center justify-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90">
                    <svg className="h-5 w-5 text-fuchsia-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Contenu */}
          <div className={clsx("p-3", post.media ? "" : "pt-8")}>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/20 via-fuchsia-500/20 to-amber-500/20 text-xs font-bold">
                {post.avatar ? <img src={post.avatar} alt="" className="h-full w-full rounded-full object-cover" /> : post.author.charAt(0)}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium">{post.author}</p>
                <p className="text-xs text-neutral-500">@{post.handle} · {timeAgo(post.createdAtISO)}</p>
              </div>
            </div>
            <p className="mb-2 line-clamp-2 text-sm">{post.text}</p>
            <div className="flex items-center gap-4 text-xs text-neutral-500">
              <span className="flex items-center gap-1">❤️ {post.likes.toLocaleString()}</span>
              <span className="flex items-center gap-1">💬 {post.comments.length}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Hook pour calculer les positions des puces depuis les coordonnées
export function useViralPopups(posts: Post[], threshold: number = 50) {
  const [activePopups, setActivePopups] = useState<Array<{ post: Post; position: { x: number; y: number } }>>([]);

  useEffect(() => {
    const viralPosts = posts.filter((p) => p.viralityScore >= threshold && p.lat && p.lon && p.status === "active");

    const interval = setInterval(() => {
      if (viralPosts.length === 0 || activePopups.length >= 3) return;
      const randomPost = viralPosts[Math.floor(Math.random() * viralPosts.length)];
      if (activePopups.some((p) => p.post.id === randomPost.id)) return;

      const position = {
        x: ((randomPost.lon! + 180) / 360) * (typeof window !== "undefined" ? window.innerWidth : 1200),
        y: ((90 - randomPost.lat!) / 180) * (typeof window !== "undefined" ? window.innerHeight : 800),
      };

      setActivePopups((prev) => [...prev, { post: randomPost, position }]);
      setTimeout(() => setActivePopups((prev) => prev.filter((p) => p.post.id !== randomPost.id)), 10000);
    }, 5000);

    return () => clearInterval(interval);
  }, [posts, threshold, activePopups.length]);

  const removePopup = (postId: string) => setActivePopups((prev) => prev.filter((p) => p.post.id !== postId));

  return { activePopups, removePopup };
}

// Container - affiche UN SEUL popup à la fois pour éviter les superpositions
interface ViralPopupContainerProps {
  posts: Post[];
  onPostClick: (post: Post) => void;
  onClose: (postId: string) => void;
}

export function ViralPopupContainer({ posts, onPostClick, onClose }: ViralPopupContainerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  
  // Un seul post à la fois
  const currentPost = posts[currentIndex];
  
  // Passer au suivant après fermeture ou automatiquement
  useEffect(() => {
    if (!isVisible && posts.length > 1) {
      const timer = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % posts.length);
        setIsVisible(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isVisible, posts.length]);

  // Auto-rotation toutes les 8 secondes
  useEffect(() => {
    if (posts.length <= 1) return;
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % posts.length);
        setIsVisible(true);
      }, 300);
    }, 8000);
    return () => clearInterval(interval);
  }, [posts.length]);
  
  if (posts.length === 0 || !currentPost) return null;
  
  // Calculer la position de la puce
  const pinPosition = {
    x: currentPost.lon ? ((currentPost.lon + 180) / 360) * (typeof window !== "undefined" ? window.innerWidth : 1200) : 400,
    y: currentPost.lat ? ((90 - currentPost.lat) / 180) * (typeof window !== "undefined" ? window.innerHeight : 800) : 300,
  };
  
  return (
    <>
      {isVisible && (
        <ViralPopup
          key={currentPost.id}
          post={currentPost}
          pinPosition={pinPosition}
          onClick={() => onPostClick(currentPost)}
          onClose={() => {
            onClose(currentPost.id);
            setIsVisible(false);
          }}
          index={0}
        />
      )}
      
      {/* Indicateur de pagination */}
      {posts.length > 1 && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 shadow-lg backdrop-blur dark:bg-neutral-800/90">
            <span className="text-xs font-medium text-neutral-500">
              🔥 {currentIndex + 1} / {posts.length} viral
            </span>
            <div className="flex gap-1">
              {posts.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setIsVisible(false);
                    setTimeout(() => {
                      setCurrentIndex(idx);
                      setIsVisible(true);
                    }, 200);
                  }}
                  className={clsx(
                    "h-2 w-2 rounded-full transition-all",
                    idx === currentIndex ? "bg-fuchsia-500 w-4" : "bg-neutral-300 dark:bg-neutral-600"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ViralPopup;
