"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { clsx } from "clsx";
import type { BackgroundEvent, BackgroundEventType } from "@/lib/types";

type AnimatedBackgroundProps = {
  event: BackgroundEvent | null;
};

type Particle = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  emoji: string;
  scale: number;
};

// === CONFIGURATIONS PAR TYPE D'ÉVÉNEMENT ===

const EVENT_CONFIGS: Record<string, {
  particleCount: number;
  emojis: string[];
  colors: string[];
  gradient: string;
  speed: number;
  glow?: boolean;
}> = {
  new_year: {
    particleCount: 80,
    emojis: ["✨", "🎆", "🎇", "⭐", "🌟", "💫", "🎊", "🎉", "🥂", "🍾"],
    colors: ["#FFD700", "#FF69B4", "#00CED1", "#FF6347", "#9370DB", "#7FFF00"],
    gradient: "from-purple-900/30 via-fuchsia-900/10 to-amber-900/30",
    speed: 0.3,
    glow: true,
  },
  chinese_new_year: {
    particleCount: 70,
    emojis: ["🧧", "🐉", "🏮", "🎊", "💮", "🎆", "✨", "🔴", "🐲", "🧨"],
    colors: ["#FF0000", "#FFD700", "#FF4500", "#DC143C", "#FF6347"],
    gradient: "from-red-900/40 via-amber-900/20 to-red-800/40",
    speed: 0.25,
    glow: true,
  },
  christmas: {
    particleCount: 60,
    emojis: ["❄️", "🎄", "⭐", "🎁", "🔔", "❄", "✨", "🎅", "⛄", "🦌"],
    colors: ["#FFFFFF", "#FF0000", "#00FF00", "#FFD700", "#87CEEB"],
    gradient: "from-emerald-900/30 via-sky-900/10 to-rose-900/30",
    speed: 0.4,
  },
  halloween: {
    particleCount: 50,
    emojis: ["🎃", "👻", "🦇", "🕷️", "💀", "🌙", "🕸️", "🖤", "🔮", "⚰️"],
    colors: ["#FF6600", "#800080", "#000000", "#FFFF00", "#4B0082"],
    gradient: "from-orange-900/40 via-purple-900/20 to-black/40",
    speed: 0.35,
  },
  valentine: {
    particleCount: 60,
    emojis: ["❤️", "💕", "💖", "💗", "💘", "💝", "🌹", "✨", "💑", "💋"],
    colors: ["#FF1493", "#FF69B4", "#DC143C", "#FFB6C1", "#FF0000"],
    gradient: "from-pink-900/30 via-rose-900/20 to-red-900/30",
    speed: 0.2,
    glow: true,
  },
  easter: {
    particleCount: 50,
    emojis: ["🐣", "🐰", "🥚", "🌸", "🌷", "🦋", "✨", "🌼", "🐥", "🌈"],
    colors: ["#FFB6C1", "#98FB98", "#DDA0DD", "#FFFF00", "#87CEEB"],
    gradient: "from-pink-900/20 via-green-900/10 to-purple-900/20",
    speed: 0.25,
  },
  summer: {
    particleCount: 40,
    emojis: ["☀️", "🌴", "🏖️", "🌊", "🍦", "🌺", "🐚", "✨", "🌅", "🍹"],
    colors: ["#FFD700", "#FF6347", "#00CED1", "#FF69B4", "#32CD32"],
    gradient: "from-amber-900/20 via-sky-900/10 to-orange-900/20",
    speed: 0.2,
  },
  sponsored: {
    particleCount: 25,
    emojis: ["✨", "⭐", "💫"],
    colors: ["#FFD700", "#FFA500", "#FFFFFF"],
    gradient: "from-transparent via-amber-900/5 to-transparent",
    speed: 0.15,
  },
};

export default function AnimatedBackground({ event }: AnimatedBackgroundProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const customStyleRef = useRef<HTMLStyleElement | null>(null);
  const customScriptCleanup = useRef<(() => void) | null>(null);

  const config = useMemo(() => {
    if (!event || event.type === "none" || event.type === "custom") return null;
    return EVENT_CONFIGS[event.type] || EVENT_CONFIGS.new_year;
  }, [event]);

  // Injecter le CSS personnalisé
  useEffect(() => {
    if (event?.customCSS) {
      const style = document.createElement("style");
      style.id = `bg-event-style-${event.id}`;
      style.textContent = event.customCSS;
      document.head.appendChild(style);
      customStyleRef.current = style;
      
      return () => {
        if (customStyleRef.current) {
          customStyleRef.current.remove();
          customStyleRef.current = null;
        }
      };
    }
  }, [event?.customCSS, event?.id]);

  // Exécuter le JS personnalisé
  useEffect(() => {
    if (event?.customJS && containerRef.current) {
      try {
        const container = containerRef.current;
        // Créer une fonction avec le code personnalisé
        const fn = new Function("container", "event", `
          try {
            ${event.customJS}
          } catch(e) {
            console.error("Erreur dans le JS personnalisé:", e);
          }
        `);
        const cleanup = fn(container, event);
        
        if (typeof cleanup === "function") {
          customScriptCleanup.current = cleanup;
        }
        
        return () => {
          if (customScriptCleanup.current) {
            customScriptCleanup.current();
            customScriptCleanup.current = null;
          }
        };
      } catch (error) {
        console.error("Erreur d'initialisation du JS personnalisé:", error);
      }
    }
  }, [event?.customJS, event]);

  // Animation des particules
  useEffect(() => {
    if (!event || !event.isActive || !config) {
      setParticles([]);
      return;
    }

    // Créer les particules
    const newParticles: Particle[] = [];
    for (let i = 0; i < config.particleCount; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 120 - 20,
        vx: (Math.random() - 0.5) * 0.4,
        vy: Math.random() * config.speed + config.speed / 2,
        size: Math.random() * 20 + 14,
        color: config.colors[Math.floor(Math.random() * config.colors.length)],
        opacity: Math.random() * 0.6 + 0.4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 3,
        emoji: config.emojis[Math.floor(Math.random() * config.emojis.length)],
        scale: 1,
      });
    }
    setParticles(newParticles);

    // Animation loop
    const animate = () => {
      setParticles((prev) =>
        prev.map((p) => {
          let newY = p.y + p.vy;
          let newX = p.x + p.vx;
          let newRotation = p.rotation + p.rotationSpeed;
          let newScale = p.scale;

          // Reset particle
          if (newY > 105) {
            newY = -10;
            newX = Math.random() * 100;
          }
          if (newX < -5) newX = 105;
          if (newX > 105) newX = -5;

          // Pulsation pour certains événements
          if (event.type === "valentine" || event.type === "chinese_new_year") {
            newScale = 1 + Math.sin(Date.now() / 500 + p.id) * 0.15;
          }

          return { ...p, x: newX, y: newY, rotation: newRotation, scale: newScale };
        })
      );
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [event, config]);

  if (!event || !event.isActive) return null;

  return (
    <div
      ref={containerRef}
      id={`animated-bg-${event.id}`}
      className={clsx(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden",
        event.cssClass
      )}
    >
      {/* Gradient de fond */}
      {config && (
        <div className={clsx("absolute inset-0 bg-gradient-to-b transition-all duration-1000", config.gradient)} />
      )}

      {/* Particules */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute will-change-transform"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            opacity: p.opacity,
            transform: `rotate(${p.rotation}deg) scale(${p.scale})`,
            fontSize: `${p.size}px`,
            color: p.color,
            textShadow: config?.glow ? `0 0 10px ${p.color}, 0 0 20px ${p.color}` : "none",
            filter: event.type === "valentine" ? `drop-shadow(0 0 5px ${p.color})` : "none",
          }}
        >
          {p.emoji}
        </div>
      ))}

      {/* === EFFETS SPÉCIAUX PAR TYPE === */}

      {/* NOUVEL AN */}
      {event.type === "new_year" && (
        <>
          {/* Feux d'artifice */}
          {[
            { x: 15, y: 20, color: "#FFD700", delay: 0 },
            { x: 75, y: 15, color: "#FF69B4", delay: 0.7 },
            { x: 45, y: 25, color: "#00CED1", delay: 1.4 },
            { x: 85, y: 30, color: "#9370DB", delay: 2.1 },
            { x: 25, y: 35, color: "#FF6347", delay: 2.8 },
          ].map((fw, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${fw.x}%`,
                top: `${fw.y}%`,
                animation: `firework 2s ease-out infinite`,
                animationDelay: `${fw.delay}s`,
              }}
            >
              {[...Array(8)].map((_, j) => (
                <div
                  key={j}
                  className="absolute h-0.5 w-6 rounded-full origin-left"
                  style={{
                    backgroundColor: fw.color,
                    transform: `rotate(${j * 45}deg)`,
                    boxShadow: `0 0 8px ${fw.color}`,
                  }}
                />
              ))}
            </div>
          ))}

          {/* Texte 2026 */}
          <div className="absolute left-1/2 top-[12%] -translate-x-1/2">
            <div 
              className="text-5xl font-black animate-bounce"
              style={{
                background: "linear-gradient(90deg, #FFD700, #FF69B4, #00CED1)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow: "0 0 30px rgba(255,215,0,0.5)",
              }}
            >
              ✨ 2026 ✨
            </div>
          </div>
        </>
      )}

      {/* NOUVEL AN CHINOIS */}
      {event.type === "chinese_new_year" && (
        <>
          {/* Lanternes suspendues */}
          {[10, 30, 70, 90].map((x, i) => (
            <div
              key={i}
              className="absolute top-0 flex flex-col items-center"
              style={{
                left: `${x}%`,
                animation: `swing 3s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
              }}
            >
              <div className="h-8 w-0.5 bg-gradient-to-b from-amber-600 to-red-600" />
              <div 
                className="text-4xl"
                style={{ filter: "drop-shadow(0 0 15px #FF0000)" }}
              >
                🏮
              </div>
            </div>
          ))}

          {/* Dragon */}
          <div 
            className="absolute top-[18%] left-1/2 -translate-x-1/2"
            style={{ animation: "dragonFloat 4s ease-in-out infinite" }}
          >
            <span className="text-6xl" style={{ filter: "drop-shadow(0 0 20px #FFD700)" }}>
              🐉
            </span>
          </div>

          {/* Caractère Fu (福) inversé = bonne fortune qui arrive */}
          <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2">
            <div 
              className="text-7xl font-bold rotate-180 text-red-600"
              style={{ 
                textShadow: "0 0 20px #FFD700, 0 0 40px #FF0000",
                animation: "glow 2s ease-in-out infinite alternate",
              }}
            >
              福
            </div>
            <p className="text-center text-xs text-amber-400 mt-2">Bonne Fortune</p>
          </div>

          {/* Pétards */}
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute text-2xl"
              style={{
                left: `${10 + i * 20}%`,
                top: `${60 + Math.random() * 20}%`,
                animation: `cracker 0.5s ease-out infinite`,
                animationDelay: `${i * 0.2}s`,
              }}
            >
              🧨
            </div>
          ))}
        </>
      )}

      {/* NOËL */}
      {event.type === "christmas" && (
        <>
          {/* Guirlandes */}
          <div className="absolute top-0 left-0 right-0 flex justify-around py-2">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="h-3 w-3 rounded-full animate-pulse"
                style={{
                  backgroundColor: ["#FF0000", "#00FF00", "#0000FF", "#FFD700", "#FF69B4"][i % 5],
                  animationDelay: `${i * 0.15}s`,
                  boxShadow: `0 0 10px ${["#FF0000", "#00FF00", "#0000FF", "#FFD700", "#FF69B4"][i % 5]}`,
                }}
              />
            ))}
          </div>

          {/* Étoile */}
          <div 
            className="absolute top-[8%] left-1/2 -translate-x-1/2 text-5xl animate-pulse"
            style={{ filter: "drop-shadow(0 0 20px #FFD700)" }}
          >
            ⭐
          </div>
        </>
      )}

      {/* HALLOWEEN */}
      {event.type === "halloween" && (
        <>
          {/* Lune */}
          <div 
            className="absolute top-[8%] right-[12%] text-7xl opacity-90"
            style={{ filter: "drop-shadow(0 0 30px #FFFF00)" }}
          >
            🌕
          </div>

          {/* Chauves-souris volantes */}
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute text-3xl"
              style={{
                top: `${15 + i * 10}%`,
                animation: `flyBat ${8 + i * 2}s linear infinite`,
                animationDelay: `${i * 2}s`,
              }}
            >
              🦇
            </div>
          ))}

          {/* Brouillard */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-purple-900/60 to-transparent" />
        </>
      )}

      {/* SAINT-VALENTIN */}
      {event.type === "valentine" && (
        <>
          {/* Cœurs flottants */}
          {[20, 50, 80].map((x, i) => (
            <div
              key={i}
              className="absolute bottom-0 text-4xl"
              style={{
                left: `${x}%`,
                animation: `heartFloat 6s ease-out infinite`,
                animationDelay: `${i * 1.5}s`,
              }}
            >
              ❤️
            </div>
          ))}

          {/* Grand cœur central */}
          <div className="absolute top-[15%] left-1/2 -translate-x-1/2">
            <div 
              className="text-6xl animate-pulse"
              style={{ filter: "drop-shadow(0 0 20px #FF1493)" }}
            >
              💕
            </div>
          </div>
        </>
      )}

      {/* SPONSORISÉ */}
      {event.type === "sponsored" && (
        <>
          {event.sponsorLogo && (
            <div className="absolute bottom-4 right-4 opacity-70 hover:opacity-100 transition-opacity pointer-events-auto">
              <img src={event.sponsorLogo} alt={event.sponsorName} className="h-10 rounded" />
            </div>
          )}
          {event.sponsorName && (
            <div className="absolute bottom-4 left-4 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-neutral-700 backdrop-blur-sm dark:bg-neutral-900/90 dark:text-neutral-300 pointer-events-auto">
              ✨ Sponsorisé par {event.sponsorName}
            </div>
          )}
        </>
      )}

      {/* CONTENU HTML PERSONNALISÉ */}
      {event.customHTML && (
        <div 
          className="absolute inset-0"
          dangerouslySetInnerHTML={{ __html: event.customHTML }}
        />
      )}

      {/* STYLES D'ANIMATION */}
      <style jsx global>{`
        @keyframes firework {
          0% { transform: scale(0); opacity: 1; }
          50% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes swing {
          0%, 100% { transform: rotate(-8deg); }
          50% { transform: rotate(8deg); }
        }
        @keyframes dragonFloat {
          0%, 100% { transform: translateX(-50%) translateY(0) rotate(-5deg); }
          50% { transform: translateX(-50%) translateY(-25px) rotate(5deg); }
        }
        @keyframes glow {
          from { filter: drop-shadow(0 0 20px #FFD700); }
          to { filter: drop-shadow(0 0 40px #FF0000); }
        }
        @keyframes cracker {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.3); }
        }
        @keyframes flyBat {
          0% { left: -50px; }
          100% { left: calc(100% + 50px); }
        }
        @keyframes heartFloat {
          0% { transform: translateY(0) scale(0.5); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) scale(1.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
