"use client";

import { create } from "zustand";

export interface LiveWave {
  id: string;
  postId: string;
  postHandle: string;
  postUsername: string;
  postText: string;
  postAvatar?: string;

  // Origin point
  origin: { lat: number; lon: number };
  originName?: string;

  // Wave state
  currentRadius: number; // km
  maxRadius: number; // km - based on virality
  speed: number; // km per second
  intensity: number; // 0-1, fades as it expands
  color: string; // Wave color based on category

  // Timestamps
  startedAt: string;
  peakAt?: string;

  // Stats at wave creation
  initialLikes: number;
  likeVelocity: number; // likes per minute at trigger

  // Users touched by the wave
  reachedUsers: string[]; // handles
  reachedCount: number;

  // Status
  status: "expanding" | "peak" | "fading" | "completed";
}

export interface WaveParticle {
  id: string;
  waveId: string;
  angle: number; // radians
  distance: number; // km from origin
  opacity: number;
}

interface LiveWavesState {
  waves: LiveWave[];
  particles: Map<string, WaveParticle[]>;
  ready: boolean;

  // Actions
  triggerWave: (data: {
    postId: string;
    postHandle: string;
    postUsername: string;
    postText: string;
    postAvatar?: string;
    origin: { lat: number; lon: number };
    originName?: string;
    likes: number;
    likeVelocity: number;
    category?: string;
  }) => LiveWave;

  // Update wave expansion (call in animation loop)
  updateWaves: (deltaMs: number) => void;

  // Check if a position is touched by any active wave
  isPositionInWave: (lat: number, lon: number) => LiveWave | null;

  // Get active waves for rendering
  getActiveWaves: () => LiveWave[];

  // Mark user as reached by wave
  markUserReached: (waveId: string, userHandle: string) => void;

  // Get wave particles for visual effect
  getWaveParticles: (waveId: string) => WaveParticle[];

  // Clean up completed waves
  cleanupWaves: () => void;

  // Get recent viral events for feed
  getRecentViralEvents: (limit?: number) => LiveWave[];
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// Distance Haversine en km
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Calculate max radius based on virality
function calculateMaxRadius(likes: number, velocity: number): number {
  // Base: 50km, scales with likes and velocity
  const base = 50;
  const likeBonus = Math.min(likes * 5, 500); // Max 500km from likes
  const velocityBonus = Math.min(velocity * 20, 300); // Max 300km from velocity
  return base + likeBonus + velocityBonus;
}

// Calculate wave speed based on virality
function calculateSpeed(likes: number, velocity: number): number {
  // Base: 10km/s, faster for more viral posts
  const base = 10;
  const boost = Math.min((likes + velocity * 5) / 10, 50);
  return base + boost;
}

// Get wave color based on category
function getWaveColor(category?: string): string {
  switch (category) {
    case "alert":
      return "#ef4444"; // Red
    case "event":
      return "#f59e0b"; // Amber
    case "news":
      return "#3b82f6"; // Blue
    case "vibe":
    default:
      return "#d946ef"; // Fuchsia
  }
}

// Generate particles for wave visualization
function generateParticles(waveId: string, count: number): WaveParticle[] {
  const particles: WaveParticle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      id: `${waveId}-p${i}`,
      waveId,
      angle: (i / count) * Math.PI * 2,
      distance: 0,
      opacity: 1,
    });
  }
  return particles;
}

const STORAGE_KEY = "globehub_live_waves_v1";

// Demo waves
const demoWaves: LiveWave[] = [];

export const useLiveWavesStore = create<LiveWavesState>((set, get) => ({
  waves: demoWaves,
  particles: new Map(),
  ready: true,

  triggerWave: (data) => {
    const maxRadius = calculateMaxRadius(data.likes, data.likeVelocity);
    const speed = calculateSpeed(data.likes, data.likeVelocity);

    const wave: LiveWave = {
      id: `wave_${uid()}`,
      postId: data.postId,
      postHandle: data.postHandle,
      postUsername: data.postUsername,
      postText: data.postText,
      postAvatar: data.postAvatar,
      origin: data.origin,
      originName: data.originName,
      currentRadius: 0,
      maxRadius,
      speed,
      intensity: 1,
      color: getWaveColor(data.category),
      startedAt: new Date().toISOString(),
      initialLikes: data.likes,
      likeVelocity: data.likeVelocity,
      reachedUsers: [],
      reachedCount: 0,
      status: "expanding",
    };

    // Generate particles
    const particles = generateParticles(wave.id, 24);
    const newParticlesMap = new Map(get().particles);
    newParticlesMap.set(wave.id, particles);

    set({
      waves: [...get().waves, wave],
      particles: newParticlesMap,
    });

    return wave;
  },

  updateWaves: (deltaMs) => {
    const { waves, particles } = get();
    const deltaSeconds = deltaMs / 1000;

    let hasChanges = false;
    const updatedWaves = waves.map(wave => {
      if (wave.status === "completed") return wave;

      hasChanges = true;
      const newRadius = wave.currentRadius + wave.speed * deltaSeconds;

      // Check if reached max
      if (newRadius >= wave.maxRadius) {
        return {
          ...wave,
          currentRadius: wave.maxRadius,
          intensity: 0,
          status: "completed" as const,
        };
      }

      // Calculate fading intensity
      const progress = newRadius / wave.maxRadius;
      const newIntensity = Math.max(0, 1 - progress * 0.8);

      // Update status
      let newStatus = wave.status;
      if (progress > 0.8) {
        newStatus = "fading";
      } else if (progress > 0.4 && !wave.peakAt) {
        newStatus = "peak";
      }

      return {
        ...wave,
        currentRadius: newRadius,
        intensity: newIntensity,
        status: newStatus,
        peakAt: newStatus === "peak" && !wave.peakAt ? new Date().toISOString() : wave.peakAt,
      };
    });

    // Update particles
    const updatedParticles = new Map(particles);
    for (const wave of updatedWaves) {
      if (wave.status === "completed") {
        updatedParticles.delete(wave.id);
        continue;
      }

      const waveParticles = updatedParticles.get(wave.id);
      if (waveParticles) {
        const updated = waveParticles.map(p => ({
          ...p,
          distance: wave.currentRadius,
          opacity: wave.intensity,
        }));
        updatedParticles.set(wave.id, updated);
      }
    }

    if (hasChanges) {
      set({ waves: updatedWaves, particles: updatedParticles });
    }
  },

  isPositionInWave: (lat, lon) => {
    const { waves } = get();

    for (const wave of waves) {
      if (wave.status === "completed") continue;

      const distance = haversineKm(lat, lon, wave.origin.lat, wave.origin.lon);

      // Check if position is within the wave ring (with some thickness)
      const ringThickness = Math.max(10, wave.currentRadius * 0.1);
      const innerRadius = wave.currentRadius - ringThickness;
      const outerRadius = wave.currentRadius + ringThickness;

      if (distance >= innerRadius && distance <= outerRadius) {
        return wave;
      }
    }

    return null;
  },

  getActiveWaves: () => {
    return get().waves.filter(w => w.status !== "completed");
  },

  markUserReached: (waveId, userHandle) => {
    const { waves } = get();

    const updatedWaves = waves.map(w => {
      if (w.id !== waveId) return w;
      if (w.reachedUsers.includes(userHandle)) return w;

      return {
        ...w,
        reachedUsers: [...w.reachedUsers, userHandle],
        reachedCount: w.reachedCount + 1,
      };
    });

    set({ waves: updatedWaves });
  },

  getWaveParticles: (waveId) => {
    return get().particles.get(waveId) || [];
  },

  cleanupWaves: () => {
    const { waves, particles } = get();
    const activeWaves = waves.filter(w => w.status !== "completed");
    const activeIds = new Set(activeWaves.map(w => w.id));

    const cleanedParticles = new Map<string, WaveParticle[]>();
    for (const [id, p] of particles) {
      if (activeIds.has(id)) {
        cleanedParticles.set(id, p);
      }
    }

    set({ waves: activeWaves, particles: cleanedParticles });
  },

  getRecentViralEvents: (limit = 10) => {
    const { waves } = get();
    return [...waves]
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
      .slice(0, limit);
  },
}));

// Helper hook to check if current user should see wave notification
export function shouldNotifyWave(
  wave: LiveWave,
  userLat: number,
  userLon: number,
  userHandle: string
): boolean {
  // Don't notify the post author
  if (wave.postHandle === userHandle) return false;

  // Don't notify if already reached
  if (wave.reachedUsers.includes(userHandle)) return false;

  // Check if user is within wave
  const distance = haversineKm(userLat, userLon, wave.origin.lat, wave.origin.lon);
  const ringThickness = Math.max(10, wave.currentRadius * 0.1);

  return distance <= wave.currentRadius + ringThickness;
}
