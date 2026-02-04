"use client";

import { create } from "zustand";
import type { Post, PostCategory } from "./types";

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

export interface LocationSignature {
  id: string;
  center: { lat: number; lon: number };
  radius: number; // km

  // Identité du lieu
  name?: string;
  emoji?: string;

  // Stats
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  uniqueContributors: number;
  firstPostDate: string;
  lastActivityDate: string;

  // Best content
  legendaryPost?: {
    id: string;
    text: string;
    author: string;
    handle: string;
    likes: number;
    createdAt: string;
  };

  // Top contributors
  topContributors: Array<{
    handle: string;
    username: string;
    postCount: number;
    totalLikes: number;
    avatar?: string;
  }>;

  // Mood/Vibe analysis
  dominantMood: PostCategory;
  moodDistribution: Record<PostCategory, number>;

  // Activity level
  activityLevel: "dormant" | "calm" | "active" | "buzzing" | "legendary";

  // Achievements unlocked at this location
  achievements: Array<{
    id: string;
    name: string;
    emoji: string;
    unlockedBy: string;
    unlockedAt: string;
  }>;
}

interface LocationSignaturesState {
  signatures: Map<string, LocationSignature>;
  ready: boolean;

  // Actions
  computeSignatures: (posts: Post[], users: Array<{ handle: string; username: string; avatar?: string }>) => void;
  getSignatureAt: (lat: number, lon: number) => LocationSignature | null;
  getSignatureById: (id: string) => LocationSignature | null;
  getNearbySignatures: (lat: number, lon: number, radiusKm: number) => LocationSignature[];
}

// Générer un ID de zone basé sur les coordonnées (grille de ~5km)
function getZoneId(lat: number, lon: number): string {
  const gridSize = 0.045; // ~5km à l'équateur
  const gridLat = Math.floor(lat / gridSize) * gridSize;
  const gridLon = Math.floor(lon / gridSize) * gridSize;
  return `zone-${gridLat.toFixed(3)}-${gridLon.toFixed(3)}`;
}

// Déterminer le niveau d'activité
function getActivityLevel(posts: Post[]): LocationSignature["activityLevel"] {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const oneWeek = 7 * oneDay;

  const recentPosts = posts.filter(p => now - new Date(p.createdAtISO).getTime() < oneDay);
  const weekPosts = posts.filter(p => now - new Date(p.createdAtISO).getTime() < oneWeek);

  const totalLikes = posts.reduce((sum, p) => sum + p.likes, 0);

  if (totalLikes >= 1000 || posts.length >= 100) return "legendary";
  if (recentPosts.length >= 10 || weekPosts.length >= 30) return "buzzing";
  if (recentPosts.length >= 3 || weekPosts.length >= 10) return "active";
  if (weekPosts.length >= 1) return "calm";
  return "dormant";
}

// Déterminer l'emoji du lieu basé sur le mood dominant
function getMoodEmoji(mood: PostCategory): string {
  const emojis: Record<PostCategory, string> = {
    vibe: "✨",
    news: "📰",
    event: "🎉",
    alert: "⚠️",
  };
  return emojis[mood] || "📍";
}

const STORAGE_KEY = "globehub_location_signatures_v1";

export const useLocationSignaturesStore = create<LocationSignaturesState>((set, get) => ({
  signatures: new Map(),
  ready: false,

  computeSignatures: (posts, users) => {
    // Grouper les posts par zone
    const zones = new Map<string, Post[]>();

    for (const post of posts) {
      if (!post.lat || !post.lon) continue;

      const zoneId = getZoneId(post.lat, post.lon);
      const existing = zones.get(zoneId) || [];
      existing.push(post);
      zones.set(zoneId, existing);
    }

    const signatures = new Map<string, LocationSignature>();

    for (const [zoneId, zonePosts] of zones) {
      // Minimum 3 posts pour créer une signature
      if (zonePosts.length < 3) continue;

      // Calculer le centre moyen
      const avgLat = zonePosts.reduce((sum, p) => sum + (p.lat || 0), 0) / zonePosts.length;
      const avgLon = zonePosts.reduce((sum, p) => sum + (p.lon || 0), 0) / zonePosts.length;

      // Stats de base
      const totalLikes = zonePosts.reduce((sum, p) => sum + p.likes, 0);
      const totalComments = zonePosts.reduce((sum, p) => sum + p.comments.length, 0);
      const uniqueHandles = new Set(zonePosts.map(p => p.handle));

      // Trouver le post légendaire (le plus liké)
      const sortedByLikes = [...zonePosts].sort((a, b) => b.likes - a.likes);
      const topPost = sortedByLikes[0];
      const legendaryPost = topPost && topPost.likes >= 5 ? {
        id: topPost.id,
        text: topPost.text.slice(0, 100) + (topPost.text.length > 100 ? "..." : ""),
        author: topPost.author,
        handle: topPost.handle,
        likes: topPost.likes,
        createdAt: topPost.createdAtISO,
      } : undefined;

      // Top contributeurs
      const contributorStats = new Map<string, { postCount: number; totalLikes: number }>();
      for (const post of zonePosts) {
        const stats = contributorStats.get(post.handle) || { postCount: 0, totalLikes: 0 };
        stats.postCount++;
        stats.totalLikes += post.likes;
        contributorStats.set(post.handle, stats);
      }

      const topContributors = Array.from(contributorStats.entries())
        .sort((a, b) => b[1].totalLikes - a[1].totalLikes)
        .slice(0, 5)
        .map(([handle, stats]) => {
          const user = users.find(u => u.handle === handle);
          return {
            handle,
            username: user?.username || handle,
            avatar: user?.avatar,
            ...stats,
          };
        });

      // Mood distribution
      const moodCounts: Record<PostCategory, number> = { vibe: 0, news: 0, event: 0, alert: 0 };
      for (const post of zonePosts) {
        moodCounts[post.category]++;
      }

      const dominantMood = (Object.entries(moodCounts) as [PostCategory, number][])
        .sort((a, b) => b[1] - a[1])[0][0];

      // Dates
      const sortedByDate = [...zonePosts].sort(
        (a, b) => new Date(a.createdAtISO).getTime() - new Date(b.createdAtISO).getTime()
      );

      // Achievements
      const achievements: LocationSignature["achievements"] = [];

      // Premier post
      if (sortedByDate.length > 0) {
        achievements.push({
          id: "first-post",
          name: "Pionnier",
          emoji: "🏴",
          unlockedBy: sortedByDate[0].handle,
          unlockedAt: sortedByDate[0].createdAtISO,
        });
      }

      // 100 likes
      if (totalLikes >= 100) {
        achievements.push({
          id: "100-likes",
          name: "Lieu populaire",
          emoji: "❤️",
          unlockedBy: sortedByLikes[0].handle,
          unlockedAt: new Date().toISOString(),
        });
      }

      // 10 contributeurs
      if (uniqueHandles.size >= 10) {
        achievements.push({
          id: "10-contributors",
          name: "Communauté active",
          emoji: "👥",
          unlockedBy: Array.from(uniqueHandles)[9],
          unlockedAt: new Date().toISOString(),
        });
      }

      const signature: LocationSignature = {
        id: zoneId,
        center: { lat: avgLat, lon: avgLon },
        radius: 2.5,
        emoji: getMoodEmoji(dominantMood),
        totalPosts: zonePosts.length,
        totalLikes,
        totalComments,
        uniqueContributors: uniqueHandles.size,
        firstPostDate: sortedByDate[0].createdAtISO,
        lastActivityDate: sortedByDate[sortedByDate.length - 1].createdAtISO,
        legendaryPost,
        topContributors,
        dominantMood,
        moodDistribution: moodCounts,
        activityLevel: getActivityLevel(zonePosts),
        achievements,
      };

      signatures.set(zoneId, signature);
    }

    set({ signatures, ready: true });

    // Sauvegarder en localStorage
    try {
      const serialized = JSON.stringify(Array.from(signatures.entries()));
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch {
      // Ignore storage errors
    }
  },

  getSignatureAt: (lat, lon) => {
    const { signatures } = get();

    for (const [, signature] of signatures) {
      const distance = haversineKm(lat, lon, signature.center.lat, signature.center.lon);
      if (distance <= signature.radius) {
        return signature;
      }
    }

    return null;
  },

  getSignatureById: (id) => {
    return get().signatures.get(id) || null;
  },

  getNearbySignatures: (lat, lon, radiusKm) => {
    const { signatures } = get();
    const nearby: LocationSignature[] = [];

    for (const [, signature] of signatures) {
      const distance = haversineKm(lat, lon, signature.center.lat, signature.center.lon);
      if (distance <= radiusKm) {
        nearby.push(signature);
      }
    }

    return nearby.sort((a, b) => b.totalLikes - a.totalLikes);
  },
}));
