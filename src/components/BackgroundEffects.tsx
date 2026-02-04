"use client";

import { useEffect, useRef, useState } from "react";
import type { BackgroundEvent } from "@/lib/types";

interface BackgroundEffectsProps {
  event: BackgroundEvent | null;
}

// Particle class for animations
class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  rotation: number;
  rotationSpeed: number;
  type: "confetti" | "snow" | "firework" | "heart" | "star";

  constructor(canvas: HTMLCanvasElement, type: Particle["type"], colors: string[]) {
    this.type = type;
    this.color = colors[Math.floor(Math.random() * colors.length)];
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.1;
    this.maxLife = 200 + Math.random() * 200;
    this.life = this.maxLife;

    switch (type) {
      case "snow":
        this.x = Math.random() * canvas.width;
        this.y = -10;
        this.vx = (Math.random() - 0.5) * 1;
        this.vy = 1 + Math.random() * 2;
        this.size = 2 + Math.random() * 4;
        break;
      case "confetti":
        this.x = Math.random() * canvas.width;
        this.y = -10;
        this.vx = (Math.random() - 0.5) * 3;
        this.vy = 2 + Math.random() * 3;
        this.size = 8 + Math.random() * 8;
        break;
      case "firework":
        this.x = canvas.width / 2 + (Math.random() - 0.5) * canvas.width * 0.5;
        this.y = canvas.height;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = -10 - Math.random() * 5;
        this.size = 3 + Math.random() * 3;
        break;
      case "heart":
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + 10;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = -2 - Math.random() * 2;
        this.size = 10 + Math.random() * 10;
        break;
      case "star":
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = 0;
        this.vy = 0;
        this.size = 2 + Math.random() * 3;
        this.maxLife = 100 + Math.random() * 100;
        this.life = Math.random() * this.maxLife;
        break;
      default:
        this.x = Math.random() * canvas.width;
        this.y = -10;
        this.vx = 0;
        this.vy = 2;
        this.size = 5;
    }
  }

  update(canvas: HTMLCanvasElement) {
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.rotationSpeed;
    this.life--;

    // Type-specific physics
    if (this.type === "snow") {
      this.vx += (Math.random() - 0.5) * 0.1;
      this.vx = Math.max(-1, Math.min(1, this.vx));
    } else if (this.type === "confetti") {
      this.vy += 0.05; // gravity
      this.vx *= 0.99;
    } else if (this.type === "firework") {
      this.vy += 0.15; // gravity
      this.vx *= 0.98;
    } else if (this.type === "star") {
      // Twinkle effect
      return this.life > 0;
    }

    // Check bounds
    if (this.type === "heart") {
      return this.y > -this.size && this.life > 0;
    }
    return this.y < canvas.height + this.size && this.life > 0;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.globalAlpha = Math.min(1, this.life / 50);

    switch (this.type) {
      case "snow":
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        break;

      case "confetti":
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
        break;

      case "firework":
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        // Glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fill();
        break;

      case "heart":
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(0, this.size / 4);
        ctx.bezierCurveTo(-this.size / 2, -this.size / 4, -this.size / 2, this.size / 2, 0, this.size);
        ctx.bezierCurveTo(this.size / 2, this.size / 2, this.size / 2, -this.size / 4, 0, this.size / 4);
        ctx.fill();
        break;

      case "star":
        const alpha = Math.sin(this.life * 0.1) * 0.5 + 0.5;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
          const x = Math.cos(angle) * this.size;
          const y = Math.sin(angle) * this.size;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        break;
    }

    ctx.restore();
  }
}

// Event configurations
const eventConfigs: Record<string, { particleType: Particle["type"]; colors: string[]; density: number }> = {
  new_year: {
    particleType: "firework",
    colors: ["#FFD700", "#FF6B6B", "#4ECDC4", "#A855F7", "#F59E0B", "#EC4899"],
    density: 3,
  },
  christmas: {
    particleType: "snow",
    colors: ["#FFFFFF", "#E0F2FE", "#DBEAFE"],
    density: 50,
  },
  halloween: {
    particleType: "star",
    colors: ["#F97316", "#A855F7", "#FBBF24"],
    density: 30,
  },
  valentine: {
    particleType: "heart",
    colors: ["#EC4899", "#F43F5E", "#FB7185"],
    density: 20,
  },
  custom: {
    particleType: "confetti",
    colors: ["#A855F7", "#3B82F6", "#10B981", "#F59E0B", "#EF4444"],
    density: 30,
  },
  sponsored: {
    particleType: "confetti",
    colors: ["#A855F7", "#EC4899", "#3B82F6"],
    density: 20,
  },
};

export function BackgroundEffects({ event }: BackgroundEffectsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!event || event.type === "none") {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const config = eventConfigs[event.type] || eventConfigs.custom;
    particlesRef.current = [];

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spawn new particles
      if (particlesRef.current.length < config.density * 2) {
        if (Math.random() < 0.1) {
          particlesRef.current.push(new Particle(canvas, config.particleType, config.colors));
        }
      }

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter((p) => {
        const alive = p.update(canvas);
        if (alive) p.draw(ctx);
        return alive;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [event]);

  if (!isVisible) return null;

  return (
    <>
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-[5]"
        style={{ mixBlendMode: event?.type === "christmas" ? "normal" : "screen" }}
      />
      {/* Sponsor badge if sponsored */}
      {event?.type === "sponsored" && event.sponsorName && (
        <div className="fixed bottom-4 left-4 z-[6] flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 text-xs text-white backdrop-blur-sm">
          {event.sponsorLogo && (
            <img src={event.sponsorLogo} alt="" className="h-4 w-4 rounded-full" />
          )}
          <span>Sponsorisé par {event.sponsorName}</span>
        </div>
      )}
    </>
  );
}

// Test component to preview effects
export function BackgroundEffectsPreview({ type }: { type: string }) {
  const mockEvent: BackgroundEvent = {
    id: "preview",
    name: "Preview",
    type: type as BackgroundEvent["type"],
    isActive: true,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 86400000).toISOString(),
    cssClass: "",
    priority: 100,
    createdAt: new Date().toISOString(),
  };

  return <BackgroundEffects event={mockEvent} />;
}
