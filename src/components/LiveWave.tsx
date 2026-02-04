"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { clsx } from "clsx";
import type { LiveWave } from "@/lib/useLiveWavesStore";
import { useLiveWavesStore, shouldNotifyWave } from "@/lib/useLiveWavesStore";
import { timeAgo } from "@/lib/time";

// Wave animation on map (renders as overlay)
export function LiveWaveOverlay({
  wave,
  mapProjection,
}: {
  wave: LiveWave;
  mapProjection: (lat: number, lon: number) => { x: number; y: number } | null;
}) {
  const [animationFrame, setAnimationFrame] = useState(0);
  const originScreen = mapProjection(wave.origin.lat, wave.origin.lon);

  useEffect(() => {
    if (wave.status === "completed") return;

    const interval = setInterval(() => {
      setAnimationFrame(f => f + 1);
    }, 50);

    return () => clearInterval(interval);
  }, [wave.status]);

  if (!originScreen || wave.status === "completed") return null;

  // Convert km radius to approximate screen pixels (very rough, varies with zoom)
  // This is a simplified approach - in production you'd use proper map projection
  const radiusPixels = Math.min(wave.currentRadius * 2, 500);

  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: originScreen.x,
        top: originScreen.y,
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* Main wave ring */}
      <div
        className="absolute rounded-full"
        style={{
          width: radiusPixels * 2,
          height: radiusPixels * 2,
          left: -radiusPixels,
          top: -radiusPixels,
          border: `3px solid ${wave.color}`,
          opacity: wave.intensity * 0.6,
          boxShadow: `0 0 ${20 * wave.intensity}px ${wave.color}, inset 0 0 ${10 * wave.intensity}px ${wave.color}`,
          animation: "pulse 1s ease-in-out infinite",
        }}
      />

      {/* Inner glow */}
      <div
        className="absolute rounded-full"
        style={{
          width: radiusPixels * 1.6,
          height: radiusPixels * 1.6,
          left: -radiusPixels * 0.8,
          top: -radiusPixels * 0.8,
          border: `2px solid ${wave.color}`,
          opacity: wave.intensity * 0.3,
        }}
      />

      {/* Center pulse */}
      <div
        className="absolute rounded-full"
        style={{
          width: 20,
          height: 20,
          left: -10,
          top: -10,
          backgroundColor: wave.color,
          opacity: wave.intensity,
          boxShadow: `0 0 20px ${wave.color}`,
          animation: "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite",
        }}
      />

      {/* Particle effects along the ring */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2 + (animationFrame * 0.02);
        const x = Math.cos(angle) * radiusPixels;
        const y = Math.sin(angle) * radiusPixels;

        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 8,
              height: 8,
              left: x - 4,
              top: y - 4,
              backgroundColor: wave.color,
              opacity: wave.intensity * 0.8,
              boxShadow: `0 0 10px ${wave.color}`,
            }}
          />
        );
      })}
    </div>
  );
}

// Notification banner when wave reaches user
export function WaveReachedNotification({
  wave,
  onDismiss,
  onViewPost,
}: {
  wave: LiveWave;
  onDismiss: () => void;
  onViewPost: (postId: string) => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(onDismiss, 300);
  };

  const handleViewPost = () => {
    onViewPost(wave.postId);
    handleDismiss();
  };

  return (
    <div
      className={clsx(
        "fixed top-20 left-1/2 z-[100] -translate-x-1/2 transition-all duration-300",
        isVisible && !isExiting
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-4"
      )}
    >
      {/* Glow effect */}
      <div
        className="absolute -inset-4 rounded-3xl blur-xl opacity-60"
        style={{ backgroundColor: wave.color }}
      />

      <div
        className="relative overflow-hidden rounded-2xl shadow-2xl"
        style={{
          background: `linear-gradient(135deg, ${wave.color}20, ${wave.color}40)`,
          backdropFilter: "blur(20px)",
          border: `2px solid ${wave.color}60`,
        }}
      >
        {/* Animated border */}
        <div
          className="absolute inset-0 rounded-2xl opacity-50"
          style={{
            background: `linear-gradient(90deg, transparent, ${wave.color}, transparent)`,
            animation: "shimmer 2s infinite",
          }}
        />

        <div className="relative p-4">
          <div className="flex items-start gap-3">
            {/* Animated wave icon */}
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl text-white"
              style={{ backgroundColor: wave.color }}
            >
              <svg
                className="h-6 w-6 animate-pulse"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🌊</span>
                <h4 className="font-bold text-white">Onde virale !</h4>
              </div>

              <p className="text-sm text-white/80 line-clamp-2 mb-2">
                Le post de <span className="font-semibold">@{wave.postHandle}</span> devient viral !
              </p>

              <p className="text-xs text-white/60 line-clamp-1 italic">
                "{wave.postText.slice(0, 80)}..."
              </p>

              <div className="flex items-center gap-4 mt-3">
                <button
                  onClick={handleViewPost}
                  className="flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/30 transition-colors"
                >
                  <span>Voir</span>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <div className="flex items-center gap-2 text-xs text-white/60">
                  <span>❤️ {wave.initialLikes}</span>
                  <span>•</span>
                  <span>🚀 {wave.likeVelocity}/min</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mini indicator showing active waves count
export function ActiveWavesIndicator({
  waveCount,
  onClick,
}: {
  waveCount: number;
  onClick: () => void;
}) {
  if (waveCount === 0) return null;

  return (
    <button
      onClick={onClick}
      className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 px-4 py-2 text-white shadow-lg hover:scale-105 transition-transform"
    >
      <span className="relative flex h-3 w-3">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
      </span>
      <span className="font-bold">{waveCount}</span>
      <span className="text-sm">onde{waveCount > 1 ? "s" : ""} active{waveCount > 1 ? "s" : ""}</span>
      <span className="text-lg">🌊</span>
    </button>
  );
}

// Panel showing all recent viral events
export function ViralEventsFeed({
  isOpen,
  onClose,
  onViewPost,
  onViewProfile,
}: {
  isOpen: boolean;
  onClose: () => void;
  onViewPost: (postId: string) => void;
  onViewProfile: (handle: string) => void;
}) {
  const recentEvents = useLiveWavesStore(state => state.getRecentViralEvents(20));
  const activeWaves = useLiveWavesStore(state => state.getActiveWaves());

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-hidden bg-white shadow-2xl dark:bg-neutral-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 p-4 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌊</span>
            <div>
              <h2 className="font-bold text-lg">Ondes Virales</h2>
              <p className="text-xs text-neutral-500">
                {activeWaves.length} active{activeWaves.length > 1 ? "s" : ""} • {recentEvents.length} récente{recentEvents.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Active waves */}
        {activeWaves.length > 0 && (
          <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-neutral-400">
              🔴 En cours
            </p>
            <div className="space-y-2">
              {activeWaves.map(wave => (
                <button
                  key={wave.id}
                  onClick={() => onViewPost(wave.postId)}
                  className="flex w-full items-center gap-3 rounded-xl p-3 transition-colors"
                  style={{
                    background: `linear-gradient(135deg, ${wave.color}10, ${wave.color}20)`,
                    border: `1px solid ${wave.color}40`,
                  }}
                >
                  <div
                    className="relative flex h-10 w-10 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: wave.color }}
                  >
                    <span className="absolute inset-0 rounded-full animate-ping opacity-40" style={{ backgroundColor: wave.color }} />
                    <span className="relative">🌊</span>
                  </div>

                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm">@{wave.postHandle}</p>
                    <p className="text-xs text-neutral-500 line-clamp-1">{wave.postText}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: wave.color }}>
                      {Math.round(wave.currentRadius)}km
                    </p>
                    <p className="text-[10px] text-neutral-400">
                      {wave.reachedCount} touchés
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recent events list */}
        <div className="flex-1 overflow-y-auto p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-neutral-400">
            📜 Historique
          </p>

          <div className="space-y-3">
            {recentEvents.map(wave => (
              <div
                key={wave.id}
                className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800"
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => onViewProfile(wave.postHandle)}
                    className="flex-shrink-0"
                  >
                    {wave.postAvatar ? (
                      <img src={wave.postAvatar} alt="" className="h-10 w-10 rounded-full" />
                    ) : (
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-full text-white font-bold"
                        style={{ backgroundColor: wave.color }}
                      >
                        {wave.postUsername.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onViewProfile(wave.postHandle)}
                        className="font-medium text-sm hover:underline"
                      >
                        {wave.postUsername}
                      </button>
                      <span className="text-xs text-neutral-400">
                        @{wave.postHandle}
                      </span>
                    </div>

                    <button
                      onClick={() => onViewPost(wave.postId)}
                      className="block text-left text-sm text-neutral-600 dark:text-neutral-300 line-clamp-2 hover:underline mt-1"
                    >
                      {wave.postText}
                    </button>

                    <div className="flex items-center gap-3 mt-2 text-xs text-neutral-400">
                      <span>❤️ {wave.initialLikes}</span>
                      <span>🌊 {Math.round(wave.maxRadius)}km max</span>
                      <span>👥 {wave.reachedCount} touchés</span>
                      <span>• {timeAgo(wave.startedAt)}</span>
                    </div>
                  </div>

                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full"
                    style={{ backgroundColor: wave.color + "20" }}
                  >
                    <span
                      className="text-xs font-bold"
                      style={{ color: wave.color }}
                    >
                      {wave.status === "completed" ? "✓" : "⚡"}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {recentEvents.length === 0 && (
              <div className="text-center py-12">
                <span className="text-5xl">🌊</span>
                <p className="mt-4 text-neutral-500">Pas encore d'ondes virales</p>
                <p className="text-sm text-neutral-400">
                  Les posts qui deviennent viraux déclenchent des ondes visibles !
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Hook to manage wave animations
export function useWaveAnimation() {
  const updateWaves = useLiveWavesStore(state => state.updateWaves);
  const cleanupWaves = useLiveWavesStore(state => state.cleanupWaves);
  const lastTimeRef = useRef(Date.now());

  useEffect(() => {
    let animationId: number;

    const animate = () => {
      const now = Date.now();
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;

      updateWaves(delta);
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    // Cleanup old waves every 30 seconds
    const cleanupInterval = setInterval(cleanupWaves, 30000);

    return () => {
      cancelAnimationFrame(animationId);
      clearInterval(cleanupInterval);
    };
  }, [updateWaves, cleanupWaves]);
}

// Hook to check if wave reached current user
export function useWaveNotifications(
  userLat: number | null,
  userLon: number | null,
  userHandle: string | null
) {
  const waves = useLiveWavesStore(state => state.getActiveWaves());
  const markUserReached = useLiveWavesStore(state => state.markUserReached);
  const [pendingNotification, setPendingNotification] = useState<LiveWave | null>(null);

  useEffect(() => {
    if (!userLat || !userLon || !userHandle) return;

    for (const wave of waves) {
      if (shouldNotifyWave(wave, userLat, userLon, userHandle)) {
        markUserReached(wave.id, userHandle);
        setPendingNotification(wave);
        break;
      }
    }
  }, [waves, userLat, userLon, userHandle, markUserReached]);

  const dismissNotification = useCallback(() => {
    setPendingNotification(null);
  }, []);

  return { pendingNotification, dismissNotification };
}

// Map layer data generator for MapLibre
export function generateWaveGeoJSON(waves: LiveWave[]): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];

  for (const wave of waves) {
    if (wave.status === "completed") continue;

    // Generate circle approximation
    const points = 64;
    const coordinates: [number, number][] = [];

    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2;
      // Approximate conversion: 1 degree ≈ 111km at equator
      const latOffset = (wave.currentRadius / 111) * Math.cos(angle);
      const lonOffset = (wave.currentRadius / (111 * Math.cos(wave.origin.lat * Math.PI / 180))) * Math.sin(angle);

      coordinates.push([
        wave.origin.lon + lonOffset,
        wave.origin.lat + latOffset,
      ]);
    }

    features.push({
      type: "Feature",
      properties: {
        id: wave.id,
        color: wave.color,
        intensity: wave.intensity,
        status: wave.status,
      },
      geometry: {
        type: "LineString",
        coordinates,
      },
    });

    // Origin point
    features.push({
      type: "Feature",
      properties: {
        id: `${wave.id}-origin`,
        color: wave.color,
        intensity: wave.intensity,
        isOrigin: true,
      },
      geometry: {
        type: "Point",
        coordinates: [wave.origin.lon, wave.origin.lat],
      },
    });
  }

  return {
    type: "FeatureCollection",
    features,
  };
}
