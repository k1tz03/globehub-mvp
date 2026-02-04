"use client";

import { useEffect, useState, useRef } from "react";
import { clsx } from "clsx";
import { useAnimatedCounter, formatViewCount } from "@/lib/useEngagementStore";

interface ViewCounterProps {
  postId: string;
  initialViews: number;
  currentViews: number;
  isOwner: boolean;
  size?: "sm" | "md" | "lg";
  showPulse?: boolean;
}

export function ViewCounter({ 
  postId, 
  initialViews, 
  currentViews, 
  isOwner,
  size = "md",
  showPulse = true 
}: ViewCounterProps) {
  const displayValue = useAnimatedCounter(currentViews, 800);
  const [showBurst, setShowBurst] = useState(false);
  const prevViews = useRef(initialViews);
  
  // Effet de burst quand les vues augmentent significativement
  useEffect(() => {
    if (currentViews - prevViews.current >= 5) {
      setShowBurst(true);
      setTimeout(() => setShowBurst(false), 600);
    }
    prevViews.current = currentViews;
  }, [currentViews]);
  
  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  };
  
  return (
    <div className="relative inline-flex items-center gap-1.5">
      <div className={clsx(
        "flex items-center gap-1.5 rounded-full font-medium transition-all",
        sizeClasses[size],
        isOwner 
          ? "bg-gradient-to-r from-fuchsia-500/20 to-amber-500/20 text-fuchsia-600 dark:text-fuchsia-400"
          : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
      )}>
        {/* Icône œil */}
        <svg 
          className={clsx(
            "transition-transform",
            size === "sm" ? "h-3 w-3" : size === "md" ? "h-4 w-4" : "h-5 w-5",
            showBurst && "scale-125"
          )} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        
        {/* Compteur */}
        <span className={clsx(
          "tabular-nums transition-all",
          showBurst && "scale-110 text-fuchsia-500"
        )}>
          {formatViewCount(displayValue)}
        </span>
      </div>
      
      {/* Effet pulse pour le propriétaire */}
      {isOwner && showPulse && currentViews > initialViews && (
        <span className="absolute -right-1 -top-1 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-fuchsia-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-fuchsia-500" />
        </span>
      )}
      
      {/* Effet burst */}
      {showBurst && (
        <div className="absolute inset-0 flex items-center justify-center">
          {[...Array(6)].map((_, i) => (
            <span
              key={i}
              className="absolute h-1 w-1 animate-ping rounded-full bg-fuchsia-500"
              style={{
                transform: `rotate(${i * 60}deg) translateX(20px)`,
                animationDelay: `${i * 50}ms`,
                animationDuration: "400ms",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Composant de succès après un post
interface PostSuccessOverlayProps {
  postId: string;
  views: number;
  onClose: () => void;
}

// Générer les données de particules côté client uniquement
function generateParticleData() {
  const emojis = ["✨", "🎉", "⭐", "💫", "🌟"];
  return [...Array(30)].map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
    emoji: emojis[Math.floor(Math.random() * emojis.length)],
  }));
}

export function PostSuccessOverlay({ postId, views, onClose }: PostSuccessOverlayProps) {
  const [stage, setStage] = useState(0);
  const displayViews = useAnimatedCounter(views, 2000);
  const [particles, setParticles] = useState<ReturnType<typeof generateParticleData>>([]);

  // Générer les particules uniquement côté client
  useEffect(() => {
    setParticles(generateParticleData());
  }, []);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 500),
      setTimeout(() => setStage(2), 1500),
      setTimeout(() => setStage(3), 3000),
      setTimeout(onClose, 4500),
    ];
    
    return () => timers.forEach(clearTimeout);
  }, [onClose]);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="flex flex-col items-center text-center text-white">
        {/* Checkmark animé */}
        <div className={clsx(
          "mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500",
          stage >= 1 ? "scale-100 opacity-100" : "scale-50 opacity-0"
        )}>
          <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M5 13l4 4L19 7"
              className={clsx(
                "transition-all duration-500",
                stage >= 1 ? "opacity-100" : "opacity-0"
              )}
              style={{
                strokeDasharray: 30,
                strokeDashoffset: stage >= 1 ? 0 : 30,
              }}
            />
          </svg>
        </div>
        
        {/* Texte de succès */}
        <h2 className={clsx(
          "mb-2 text-2xl font-bold transition-all duration-500",
          stage >= 1 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        )}>
          Post publié ! 🎉
        </h2>
        
        {/* Compteur de vues */}
        <div className={clsx(
          "mb-4 transition-all duration-500 delay-300",
          stage >= 2 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        )}>
          <p className="mb-1 text-sm text-white/70">Vues en direct</p>
          <div className="flex items-center justify-center gap-2 text-4xl font-bold">
            <svg className="h-8 w-8 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="bg-gradient-to-r from-fuchsia-400 to-amber-400 bg-clip-text text-transparent">
              {displayViews}
            </span>
          </div>
        </div>
        
        {/* Message encourageant */}
        <p className={clsx(
          "text-sm text-white/60 transition-all duration-500 delay-500",
          stage >= 3 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        )}>
          Votre post est maintenant visible sur la carte mondiale !
        </p>
        
        {/* Particules de célébration */}
        {stage >= 1 && particles.length > 0 && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {particles.map((p) => (
              <span
                key={p.id}
                className="absolute animate-float text-2xl"
                style={{
                  left: `${p.left}%`,
                  top: `${p.top}%`,
                  animationDelay: `${p.delay}s`,
                  animationDuration: `${p.duration}s`,
                }}
              >
                {p.emoji}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Mini badge de vues pour le marker sur la carte
interface MapViewBadgeProps {
  views: number;
  isAnimating?: boolean;
}

export function MapViewBadge({ views, isAnimating = false }: MapViewBadgeProps) {
  return (
    <div className={clsx(
      "absolute -top-2 -right-2 flex min-w-[24px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white shadow-lg transition-transform",
      isAnimating 
        ? "scale-110 bg-gradient-to-r from-fuchsia-500 to-amber-500 animate-pulse" 
        : "bg-neutral-800"
    )}>
      {formatViewCount(views)}
    </div>
  );
}
