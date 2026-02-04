"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";
import type { HotZone } from "@/lib/useEngagementBoostStore";

interface HotZoneOverlayProps {
  hotZones: HotZone[];
  mapProjection: (coords: { lat: number; lon: number }) => { x: number; y: number } | null;
  onZoneClick?: (zone: HotZone) => void;
}

const intensityConfig = {
  warm: {
    color: "from-amber-400/30 to-orange-400/20",
    borderColor: "border-amber-400/50",
    pulseColor: "bg-amber-400",
    emoji: "🌡️",
    label: "Zone active",
  },
  hot: {
    color: "from-orange-500/40 to-red-500/30",
    borderColor: "border-orange-500/60",
    pulseColor: "bg-orange-500",
    emoji: "🔥",
    label: "Hot Zone",
  },
  fire: {
    color: "from-red-500/50 to-rose-600/40",
    borderColor: "border-red-500/70",
    pulseColor: "bg-red-500",
    emoji: "🔥🔥",
    label: "Fire Zone",
  },
  explosive: {
    color: "from-fuchsia-500/60 to-red-600/50",
    borderColor: "border-fuchsia-500/80",
    pulseColor: "bg-fuchsia-500",
    emoji: "💥",
    label: "EXPLOSIVE",
  },
};

export function HotZoneMarker({ 
  zone, 
  position, 
  onClick 
}: { 
  zone: HotZone; 
  position: { x: number; y: number }; 
  onClick?: () => void;
}) {
  const config = intensityConfig[zone.intensity];
  const [isHovered, setIsHovered] = useState(false);

  // Taille basée sur l'intensité
  const baseSize = zone.intensity === "explosive" ? 120 : 
                   zone.intensity === "fire" ? 100 : 
                   zone.intensity === "hot" ? 80 : 60;

  return (
    <div
      className="pointer-events-auto absolute cursor-pointer"
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -50%)",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Cercle de zone avec animation */}
      <div
        className={clsx(
          "rounded-full bg-gradient-radial transition-all duration-500",
          config.color,
          isHovered ? "scale-110" : "scale-100"
        )}
        style={{ width: baseSize, height: baseSize }}
      >
        {/* Pulse externe */}
        <div
          className={clsx(
            "absolute inset-0 rounded-full border-2 animate-ping",
            config.borderColor
          )}
          style={{ animationDuration: zone.intensity === "explosive" ? "0.8s" : "1.5s" }}
        />
        
        {/* Pulse interne */}
        <div
          className={clsx(
            "absolute inset-2 rounded-full opacity-50",
            config.pulseColor
          )}
          style={{
            animation: `pulse ${zone.intensity === "explosive" ? "0.5s" : "1s"} ease-in-out infinite`,
          }}
        />

        {/* Centre avec emoji */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={clsx(
            "text-2xl drop-shadow-lg",
            zone.intensity === "explosive" && "animate-bounce"
          )}>
            {config.emoji}
          </span>
        </div>
      </div>

      {/* Label au survol */}
      {isHovered && (
        <div className="absolute left-1/2 -translate-x-1/2 -top-16 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="rounded-xl bg-white px-3 py-2 shadow-xl dark:bg-neutral-900 whitespace-nowrap">
            <div className="flex items-center gap-2">
              <span className="text-lg">{config.emoji}</span>
              <div>
                <p className="text-sm font-bold text-neutral-800 dark:text-white">
                  {config.label}
                </p>
                <p className="text-xs text-neutral-500">
                  {zone.postCount} posts · {zone.userCount} personnes
                </p>
              </div>
            </div>
            {zone.city && (
              <p className="text-xs text-neutral-400 mt-1">📍 {zone.city}</p>
            )}
          </div>
          {/* Flèche */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white dark:border-t-neutral-900" />
        </div>
      )}
    </div>
  );
}

export default function HotZoneOverlay({ hotZones, mapProjection, onZoneClick }: HotZoneOverlayProps) {
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(new Map());

  useEffect(() => {
    const newPositions = new Map<string, { x: number; y: number }>();
    
    for (const zone of hotZones) {
      const pos = mapProjection({ lat: zone.center.lat, lon: zone.center.lon });
      if (pos) {
        newPositions.set(zone.id, pos);
      }
    }
    
    setPositions(newPositions);
  }, [hotZones, mapProjection]);

  if (hotZones.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-20">
      {hotZones.map((zone) => {
        const position = positions.get(zone.id);
        if (!position) return null;

        return (
          <HotZoneMarker
            key={zone.id}
            zone={zone}
            position={position}
            onClick={() => onZoneClick?.(zone)}
          />
        );
      })}

      {/* Notification Hot Zone active */}
      {hotZones.some((z) => z.intensity === "explosive" || z.intensity === "fire") && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top duration-500">
          <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-red-500 to-fuchsia-500 px-4 py-2 text-white shadow-xl">
            <span className="animate-bounce">🔥</span>
            <span className="text-sm font-bold">
              {hotZones.filter((z) => z.intensity === "explosive" || z.intensity === "fire").length} Hot Zone{hotZones.length > 1 ? "s" : ""} active{hotZones.length > 1 ? "s" : ""} !
            </span>
            <span className="animate-bounce">🔥</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Mini composant pour afficher dans le feed
export function HotZoneBadge({ zone }: { zone: HotZone }) {
  const config = intensityConfig[zone.intensity];
  
  return (
    <span className={clsx(
      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
      zone.intensity === "explosive" && "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300",
      zone.intensity === "fire" && "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
      zone.intensity === "hot" && "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
      zone.intensity === "warm" && "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    )}>
      <span>{config.emoji}</span>
      <span>{config.label}</span>
    </span>
  );
}
