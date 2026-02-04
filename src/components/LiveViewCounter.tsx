"use client";

import { useState, useEffect, useRef } from "react";
import { clsx } from "clsx";

interface LiveViewCounterProps {
  postId: string;
  initialViews: number;
  isOwner: boolean;
  onViewsUpdate?: (views: number) => void;
}

export function LiveViewCounter({ postId, initialViews, isOwner, onViewsUpdate }: LiveViewCounterProps) {
  const [views, setViews] = useState(initialViews);
  const [displayViews, setDisplayViews] = useState(initialViews);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showBurst, setShowBurst] = useState(false);
  const lastUpdateRef = useRef(initialViews);

  // Simuler des vues en temps réel pour le propriétaire
  useEffect(() => {
    if (!isOwner) return;

    const interval = setInterval(() => {
      // Plus de chance d'avoir des vues si le post est récent
      const chance = Math.random();
      if (chance < 0.3) {
        const newViews = Math.floor(Math.random() * 3) + 1;
        setViews(v => {
          const updated = v + newViews;
          onViewsUpdate?.(updated);
          return updated;
        });
      }
    }, 2000 + Math.random() * 3000);

    return () => clearInterval(interval);
  }, [isOwner, onViewsUpdate]);

  // Animation du compteur
  useEffect(() => {
    if (views === displayViews) return;

    setIsAnimating(true);
    const diff = views - displayViews;

    // Si grosse augmentation, montrer le burst
    if (diff >= 5) {
      setShowBurst(true);
      setTimeout(() => setShowBurst(false), 1000);
    }

    // Animation fluide
    const steps = Math.min(diff, 20);
    const increment = diff / steps;
    let current = displayViews;
    let step = 0;

    const animate = setInterval(() => {
      step++;
      current = Math.floor(displayViews + increment * step);
      setDisplayViews(current);

      if (step >= steps) {
        setDisplayViews(views);
        setIsAnimating(false);
        clearInterval(animate);
      }
    }, 50);

    return () => clearInterval(animate);
  }, [views, displayViews]);

  // Format des vues
  const formatViews = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return n.toString();
  };

  return (
    <div className="relative inline-flex items-center">
      <div className={clsx(
        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all",
        isOwner 
          ? "bg-gradient-to-r from-fuchsia-500/20 to-amber-500/20 text-fuchsia-600 dark:text-fuchsia-400"
          : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
      )}>
        <svg className={clsx(
          "h-4 w-4 transition-transform",
          isAnimating && "scale-110"
        )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <span className={clsx(
          "tabular-nums transition-all",
          isAnimating && "scale-110 text-fuchsia-500"
        )}>
          {formatViews(displayViews)}
        </span>
      </div>

      {/* Indicateur de mise à jour pour le propriétaire */}
      {isOwner && isAnimating && (
        <span className="absolute -right-1 -top-1 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-fuchsia-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-fuchsia-500" />
        </span>
      )}

      {/* Effet burst */}
      {showBurst && (
        <div className="pointer-events-none absolute inset-0">
          {[...Array(8)].map((_, i) => (
            <span
              key={i}
              className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full bg-fuchsia-500 animate-burst"
              style={{
                transform: `rotate(${i * 45}deg) translateY(-20px)`,
                animationDelay: `${i * 50}ms`,
              }}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes burst {
          0% {
            opacity: 1;
            transform: rotate(var(--rotation)) translateY(-10px) scale(1);
          }
          100% {
            opacity: 0;
            transform: rotate(var(--rotation)) translateY(-30px) scale(0);
          }
        }
        .animate-burst {
          animation: burst 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// Overlay de succès après publication
interface PostSuccessOverlayProps {
  views: number;
  onClose: () => void;
}

export function PostSuccessOverlay({ views, onClose }: PostSuccessOverlayProps) {
  const [displayViews, setDisplayViews] = useState(0);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // Animation progressive
    const timers = [
      setTimeout(() => setStage(1), 300),
      setTimeout(() => setStage(2), 800),
      setTimeout(() => setStage(3), 1500),
      setTimeout(() => {
        // Animer le compteur
        let current = 0;
        const interval = setInterval(() => {
          current += Math.ceil((views - current) / 10) || 1;
          if (current >= views) {
            current = views;
            clearInterval(interval);
          }
          setDisplayViews(current);
        }, 50);
      }, 1800),
      setTimeout(onClose, 4500),
    ];

    return () => timers.forEach(clearTimeout);
  }, [views, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      {/* Confettis */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-confetti"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-20px`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          >
            <span 
              className="block h-3 w-3 rotate-45"
              style={{
                backgroundColor: ['#f0abfc', '#fbbf24', '#34d399', '#60a5fa', '#f472b6'][Math.floor(Math.random() * 5)],
              }}
            />
          </div>
        ))}
      </div>

      <div className="text-center text-white">
        {/* Icône de succès */}
        <div className={clsx(
          "mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 transition-all duration-500",
          stage >= 1 ? "scale-100 opacity-100" : "scale-0 opacity-0"
        )}>
          <svg className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Titre */}
        <h2 className={clsx(
          "text-3xl font-bold transition-all duration-500",
          stage >= 2 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        )}>
          Post publié ! 🎉
        </h2>

        {/* Compteur de vues */}
        <div className={clsx(
          "mt-6 transition-all duration-500",
          stage >= 3 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        )}>
          <p className="mb-2 text-sm text-white/70">Vues en temps réel</p>
          <div className="flex items-center justify-center gap-3">
            <svg className="h-8 w-8 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="text-5xl font-bold tabular-nums bg-gradient-to-r from-fuchsia-400 to-amber-400 bg-clip-text text-transparent">
              {displayViews}
            </span>
          </div>
        </div>

        {/* Message */}
        <p className={clsx(
          "mt-6 text-sm text-white/60 transition-all duration-500 delay-300",
          stage >= 3 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        )}>
          Ton post est maintenant visible sur la carte mondiale !
        </p>
      </div>

      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
    </div>
  );
}

// Badge de vues sur la carte
interface MapViewsBadgeProps {
  views: number;
  isAnimating?: boolean;
}

export function MapViewsBadge({ views, isAnimating }: MapViewsBadgeProps) {
  const formatViews = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return n.toString();
  };

  return (
    <div className={clsx(
      "absolute -right-2 -top-2 flex min-w-[24px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white shadow-lg transition-all",
      isAnimating 
        ? "animate-pulse bg-gradient-to-r from-fuchsia-500 to-amber-500 scale-110" 
        : "bg-neutral-800"
    )}>
      {formatViews(views)}
    </div>
  );
}
