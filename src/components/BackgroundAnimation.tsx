"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { BackgroundEventType } from "@/lib/types";

interface BackgroundAnimationProps {
  type: BackgroundEventType;
  isActive: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  speed: number;
  angle: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
}

const eventConfigs: Record<BackgroundEventType, {
  colors: string[];
  particleCount: number;
  shapes: ("circle" | "star" | "heart" | "snowflake" | "confetti")[];
  gravity: number;
  wind: number;
}> = {
  none: { colors: [], particleCount: 0, shapes: [], gravity: 0, wind: 0 },
  new_year: {
    colors: ["#FFD700", "#FF6B6B", "#4ECDC4", "#A855F7", "#F472B6", "#FFFFFF"],
    particleCount: 100,
    shapes: ["confetti", "star"],
    gravity: 0.02,
    wind: 0.01,
  },
  chinese_new_year: {
    colors: ["#FF0000", "#FFD700", "#FF6B00", "#FFFFFF"],
    particleCount: 90,
    shapes: ["confetti", "star", "circle"],
    gravity: 0.02,
    wind: 0.015,
  },
  christmas: {
    colors: ["#FFFFFF", "#E8E8E8", "#B0E0E6"],
    particleCount: 80,
    shapes: ["snowflake"],
    gravity: 0.01,
    wind: 0.02,
  },
  halloween: {
    colors: ["#FF6B00", "#8B00FF", "#FFD700", "#00FF00"],
    particleCount: 50,
    shapes: ["star", "circle"],
    gravity: 0.005,
    wind: 0.015,
  },
  valentine: {
    colors: ["#FF69B4", "#FF1493", "#FFB6C1", "#FFFFFF"],
    particleCount: 70,
    shapes: ["heart", "confetti"],
    gravity: 0.015,
    wind: 0.01,
  },
  easter: {
    colors: ["#FFB6C1", "#98FB98", "#87CEEB", "#DDA0DD", "#FFFACD"],
    particleCount: 60,
    shapes: ["circle", "confetti"],
    gravity: 0.01,
    wind: 0.01,
  },
  summer: {
    colors: ["#FFD700", "#FF6347", "#00CED1", "#32CD32", "#FF69B4"],
    particleCount: 50,
    shapes: ["star", "circle"],
    gravity: 0.005,
    wind: 0.02,
  },
  custom: {
    colors: ["#A855F7", "#EC4899", "#3B82F6", "#10B981"],
    particleCount: 60,
    shapes: ["confetti", "circle"],
    gravity: 0.015,
    wind: 0.01,
  },
  sponsored: {
    colors: ["#FFD700", "#FFA500", "#FF4500"],
    particleCount: 40,
    shapes: ["star", "confetti"],
    gravity: 0.01,
    wind: 0.005,
  },
};

export function BackgroundAnimation({ type, isActive }: BackgroundAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const drawShape = useCallback((ctx: CanvasRenderingContext2D, p: Particle, shape: string) => {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.globalAlpha = p.opacity;
    ctx.fillStyle = p.color;
    ctx.strokeStyle = p.color;

    switch (shape) {
      case "circle":
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case "star":
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
          const x = Math.cos(angle) * p.size;
          const y = Math.sin(angle) * p.size;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        break;
        
      case "heart":
        ctx.beginPath();
        const s = p.size / 2;
        ctx.moveTo(0, s * 0.3);
        ctx.bezierCurveTo(-s, -s * 0.5, -s, s * 0.5, 0, s);
        ctx.bezierCurveTo(s, s * 0.5, s, -s * 0.5, 0, s * 0.3);
        ctx.fill();
        break;
        
      case "snowflake":
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          const angle = (i * Math.PI) / 3;
          const len = p.size;
          ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
          ctx.stroke();
          const branchLen = len * 0.4;
          const branchStart = len * 0.5;
          ctx.moveTo(Math.cos(angle) * branchStart, Math.sin(angle) * branchStart);
          ctx.lineTo(
            Math.cos(angle) * branchStart + Math.cos(angle + 0.5) * branchLen,
            Math.sin(angle) * branchStart + Math.sin(angle + 0.5) * branchLen
          );
          ctx.moveTo(Math.cos(angle) * branchStart, Math.sin(angle) * branchStart);
          ctx.lineTo(
            Math.cos(angle) * branchStart + Math.cos(angle - 0.5) * branchLen,
            Math.sin(angle) * branchStart + Math.sin(angle - 0.5) * branchLen
          );
          ctx.stroke();
        }
        break;
        
      case "confetti":
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        break;
    }
    
    ctx.restore();
  }, []);

  useEffect(() => {
    if (!isActive || type === "none" || !canvasRef.current || dimensions.width === 0) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const config = eventConfigs[type];
    
    particlesRef.current = Array.from({ length: config.particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * dimensions.width,
      y: Math.random() * dimensions.height - dimensions.height,
      size: Math.random() * 8 + 4,
      color: config.colors[Math.floor(Math.random() * config.colors.length)],
      speed: Math.random() * 2 + 1,
      angle: Math.random() * Math.PI * 2,
      opacity: Math.random() * 0.7 + 0.3,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.1,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      particlesRef.current.forEach((p) => {
        p.y += p.speed + config.gravity * 10;
        p.x += Math.sin(p.angle) * 0.5 + config.wind * 10;
        p.angle += 0.02;
        p.rotation += p.rotationSpeed;

        if (p.y > dimensions.height + 20) {
          p.y = -20;
          p.x = Math.random() * dimensions.width;
        }
        if (p.x < -20) p.x = dimensions.width + 20;
        if (p.x > dimensions.width + 20) p.x = -20;

        const shape = config.shapes[p.id % config.shapes.length];
        drawShape(ctx, p, shape);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [type, isActive, dimensions, drawShape]);

  if (!isActive || type === "none") return null;

  return (
    <canvas
      ref={canvasRef}
      width={dimensions.width}
      height={dimensions.height}
      className="pointer-events-none fixed inset-0 z-0"
      style={{ opacity: 0.8 }}
    />
  );
}

// Composant de feux d'artifice pour le Nouvel An
export function FireworksAnimation({ isActive }: { isActive: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  useEffect(() => {
    if (!isActive || !canvasRef.current || dimensions.width === 0) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    interface FireworkParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      life: number;
      maxLife: number;
    }

    const particles: FireworkParticle[] = [];
    const colors = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#A855F7", "#F472B6", "#FFFFFF", "#00FF88"];

    const createExplosion = (x: number, y: number) => {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const count = 50 + Math.floor(Math.random() * 50);
      
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.2;
        const speed = 2 + Math.random() * 4;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color,
          life: 100,
          maxLife: 100,
        });
      }
    };

    let lastExplosion = 0;
    
    const animate = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      if (Date.now() - lastExplosion > 800 + Math.random() * 1200) {
        createExplosion(
          Math.random() * dimensions.width,
          Math.random() * dimensions.height * 0.5 + dimensions.height * 0.1
        );
        lastExplosion = Date.now();
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.vx *= 0.99;
        p.vy *= 0.99;
        p.life--;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, dimensions]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      width={dimensions.width}
      height={dimensions.height}
      className="pointer-events-none fixed inset-0 z-0"
    />
  );
}

// Test du Nouvel An
export function NewYearTest() {
  const [showFireworks, setShowFireworks] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <button
        onClick={() => setShowFireworks(!showFireworks)}
        className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-lg"
      >
        {showFireworks ? "Stop Fireworks" : "🎆 Test Fireworks"}
      </button>
      <button
        onClick={() => setShowConfetti(!showConfetti)}
        className="rounded-xl bg-fuchsia-500 px-4 py-2 text-sm font-medium text-white shadow-lg"
      >
        {showConfetti ? "Stop Confetti" : "🎊 Test Confetti"}
      </button>
      
      <FireworksAnimation isActive={showFireworks} />
      <BackgroundAnimation type="new_year" isActive={showConfetti} />
    </div>
  );
}
