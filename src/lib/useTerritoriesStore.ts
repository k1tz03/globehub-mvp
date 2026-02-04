"use client";

import { create } from "zustand";
import type { Post } from "./types";

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

export interface Territory {
  id: string;
  name: string;
  emoji: string;
  center: { lat: number; lon: number };
  radius: number; // km

  // Stats
  totalPosts: number;
  totalLikes: number;
  activeUsers: number;

  // Current Mayor
  mayor: {
    handle: string;
    username: string;
    avatar?: string;
    score: number;
    since: string;
    streak: number; // jours consécutifs en tant que maire
  } | null;

  // Challenger (2ème place)
  challenger: {
    handle: string;
    username: string;
    score: number;
    gap: number; // points de retard
  } | null;

  // Leaderboard
  leaderboard: Array<{
    rank: number;
    handle: string;
    username: string;
    avatar?: string;
    score: number;
    postCount: number;
    likesReceived: number;
  }>;

  // History
  previousMayors: Array<{
    handle: string;
    from: string;
    to: string;
  }>;

  // Activity
  lastActivityAt: string;
  isContested: boolean; // true si le challenger est à moins de 10% du maire
}

export interface MayorBadge {
  territoryId: string;
  territoryName: string;
  emoji: string;
  since: string;
  streak: number;
}

interface TerritoriesState {
  territories: Map<string, Territory>;
  userTerritoryStats: Map<string, Map<string, { score: number; postCount: number; likesReceived: number }>>;
  ready: boolean;

  // Actions
  computeTerritories: (
    posts: Post[],
    users: Array<{ handle: string; username: string; avatar?: string }>
  ) => void;

  getTerritoryAt: (lat: number, lon: number) => Territory | null;
  getUserMayorBadges: (handle: string) => MayorBadge[];
  getMayorLeaderboard: () => Array<{ handle: string; username: string; avatar?: string; territoriesCount: number; totalStreak: number }>;

  // Check if user can become mayor
  checkMayorChange: (territoryId: string) => { changed: boolean; newMayor?: string; previousMayor?: string };
}

// Grille de territoires prédéfinis (grandes villes + grille générique)
const PREDEFINED_TERRITORIES: Array<{ name: string; emoji: string; lat: number; lon: number; radius: number }> = [
  // France
  { name: "Paris Centre", emoji: "🗼", lat: 48.8566, lon: 2.3522, radius: 5 },
  { name: "Paris Nord", emoji: "🎭", lat: 48.8900, lon: 2.3522, radius: 5 },
  { name: "Paris Sud", emoji: "🎓", lat: 48.8200, lon: 2.3522, radius: 5 },
  { name: "La Défense", emoji: "🏢", lat: 48.8918, lon: 2.2382, radius: 3 },
  { name: "Lyon", emoji: "🦁", lat: 45.7640, lon: 4.8357, radius: 8 },
  { name: "Marseille", emoji: "⚓", lat: 43.2965, lon: 5.3698, radius: 8 },
  { name: "Toulouse", emoji: "🚀", lat: 43.6047, lon: 1.4442, radius: 8 },
  { name: "Nice", emoji: "🌴", lat: 43.7102, lon: 7.2620, radius: 6 },
  { name: "Bordeaux", emoji: "🍷", lat: 44.8378, lon: -0.5792, radius: 7 },

  // Europe
  { name: "London", emoji: "🇬🇧", lat: 51.5074, lon: -0.1278, radius: 10 },
  { name: "Berlin", emoji: "🇩🇪", lat: 52.5200, lon: 13.4050, radius: 10 },
  { name: "Barcelona", emoji: "🇪🇸", lat: 41.3851, lon: 2.1734, radius: 8 },
  { name: "Amsterdam", emoji: "🇳🇱", lat: 52.3676, lon: 4.9041, radius: 6 },
  { name: "Rome", emoji: "🇮🇹", lat: 41.9028, lon: 12.4964, radius: 8 },

  // Monde
  { name: "New York", emoji: "🗽", lat: 40.7128, lon: -74.0060, radius: 10 },
  { name: "Tokyo", emoji: "🗾", lat: 35.6762, lon: 139.6503, radius: 12 },
  { name: "Sydney", emoji: "🦘", lat: -33.8688, lon: 151.2093, radius: 10 },
  { name: "Dubai", emoji: "🏜️", lat: 25.2048, lon: 55.2708, radius: 8 },
];

// Générer un ID de territoire basé sur les coordonnées
function getTerritoryId(lat: number, lon: number): string {
  // Check predefined territories first
  for (const t of PREDEFINED_TERRITORIES) {
    if (haversineKm(lat, lon, t.lat, t.lon) <= t.radius) {
      return `territory-${t.name.toLowerCase().replace(/\s+/g, "-")}`;
    }
  }

  // Generic grid (10km cells)
  const gridSize = 0.09; // ~10km
  const gridLat = Math.floor(lat / gridSize) * gridSize;
  const gridLon = Math.floor(lon / gridSize) * gridSize;
  return `territory-${gridLat.toFixed(2)}-${gridLon.toFixed(2)}`;
}

// Obtenir les infos du territoire
function getTerritoryInfo(lat: number, lon: number): { name: string; emoji: string; center: { lat: number; lon: number }; radius: number } {
  // Check predefined territories first
  for (const t of PREDEFINED_TERRITORIES) {
    if (haversineKm(lat, lon, t.lat, t.lon) <= t.radius) {
      return {
        name: t.name,
        emoji: t.emoji,
        center: { lat: t.lat, lon: t.lon },
        radius: t.radius,
      };
    }
  }

  // Generic territory
  const gridSize = 0.09;
  const gridLat = Math.floor(lat / gridSize) * gridSize + gridSize / 2;
  const gridLon = Math.floor(lon / gridSize) * gridSize + gridSize / 2;

  return {
    name: `Zone ${gridLat.toFixed(1)}°, ${gridLon.toFixed(1)}°`,
    emoji: "📍",
    center: { lat: gridLat, lon: gridLon },
    radius: 5,
  };
}

// Calculer le score d'un utilisateur (posts + likes reçus pondérés)
function calculateScore(postCount: number, likesReceived: number): number {
  // Chaque post vaut 10 points, chaque like reçu vaut 2 points
  return postCount * 10 + likesReceived * 2;
}

const STORAGE_KEY = "globehub_territories_v1";

export const useTerritoriesStore = create<TerritoriesState>((set, get) => ({
  territories: new Map(),
  userTerritoryStats: new Map(),
  ready: false,

  computeTerritories: (posts, users) => {
    // Grouper les posts par territoire
    const territoryPosts = new Map<string, Post[]>();
    const territoryInfo = new Map<string, ReturnType<typeof getTerritoryInfo>>();

    for (const post of posts) {
      if (!post.lat || !post.lon) continue;

      const id = getTerritoryId(post.lat, post.lon);
      const existing = territoryPosts.get(id) || [];
      existing.push(post);
      territoryPosts.set(id, existing);

      if (!territoryInfo.has(id)) {
        territoryInfo.set(id, getTerritoryInfo(post.lat, post.lon));
      }
    }

    const territories = new Map<string, Territory>();
    const userTerritoryStats = new Map<string, Map<string, { score: number; postCount: number; likesReceived: number }>>();

    for (const [id, tPosts] of territoryPosts) {
      const info = territoryInfo.get(id)!;

      // Calculer les stats par utilisateur
      const userStats = new Map<string, { postCount: number; likesReceived: number }>();

      for (const post of tPosts) {
        const stats = userStats.get(post.handle) || { postCount: 0, likesReceived: 0 };
        stats.postCount++;
        stats.likesReceived += post.likes;
        userStats.set(post.handle, stats);
      }

      // Créer le leaderboard
      const leaderboard = Array.from(userStats.entries())
        .map(([handle, stats]) => {
          const user = users.find(u => u.handle === handle);
          const score = calculateScore(stats.postCount, stats.likesReceived);
          return {
            handle,
            username: user?.username || handle,
            avatar: user?.avatar,
            score,
            postCount: stats.postCount,
            likesReceived: stats.likesReceived,
          };
        })
        .sort((a, b) => b.score - a.score)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

      // Déterminer le maire
      const topUser = leaderboard[0];
      const secondUser = leaderboard[1];

      const mayor = topUser && topUser.score > 0 ? {
        handle: topUser.handle,
        username: topUser.username,
        avatar: topUser.avatar,
        score: topUser.score,
        since: new Date().toISOString(), // Simplified - should track actual date
        streak: 1,
      } : null;

      const challenger = secondUser ? {
        handle: secondUser.handle,
        username: secondUser.username,
        score: secondUser.score,
        gap: topUser ? topUser.score - secondUser.score : 0,
      } : null;

      // Vérifier si le territoire est contesté
      const isContested = mayor && challenger && challenger.gap < mayor.score * 0.1;

      // Stats globales
      const totalPosts = tPosts.length;
      const totalLikes = tPosts.reduce((sum, p) => sum + p.likes, 0);
      const activeUsers = userStats.size;

      const territory: Territory = {
        id,
        name: info.name,
        emoji: info.emoji,
        center: info.center,
        radius: info.radius,
        totalPosts,
        totalLikes,
        activeUsers,
        mayor,
        challenger,
        leaderboard: leaderboard.slice(0, 10),
        previousMayors: [],
        lastActivityAt: tPosts.sort((a, b) =>
          new Date(b.createdAtISO).getTime() - new Date(a.createdAtISO).getTime()
        )[0]?.createdAtISO || new Date().toISOString(),
        isContested: isContested ?? false,
      };

      territories.set(id, territory);

      // Update user territory stats
      for (const [handle, stats] of userStats) {
        let userStats = userTerritoryStats.get(handle);
        if (!userStats) {
          userStats = new Map();
          userTerritoryStats.set(handle, userStats);
        }
        userStats.set(id, {
          score: calculateScore(stats.postCount, stats.likesReceived),
          postCount: stats.postCount,
          likesReceived: stats.likesReceived,
        });
      }
    }

    set({ territories, userTerritoryStats, ready: true });

    // Save to localStorage
    try {
      const serialized = JSON.stringify({
        territories: Array.from(territories.entries()),
        stats: Array.from(userTerritoryStats.entries()).map(([handle, stats]) => [
          handle,
          Array.from(stats.entries()),
        ]),
      });
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch {
      // Ignore
    }
  },

  getTerritoryAt: (lat, lon) => {
    const { territories } = get();

    for (const [, territory] of territories) {
      const distance = haversineKm(lat, lon, territory.center.lat, territory.center.lon);
      if (distance <= territory.radius) {
        return territory;
      }
    }

    return null;
  },

  getUserMayorBadges: (handle) => {
    const { territories } = get();
    const badges: MayorBadge[] = [];

    for (const [, territory] of territories) {
      if (territory.mayor?.handle === handle) {
        badges.push({
          territoryId: territory.id,
          territoryName: territory.name,
          emoji: territory.emoji,
          since: territory.mayor.since,
          streak: territory.mayor.streak,
        });
      }
    }

    return badges;
  },

  getMayorLeaderboard: () => {
    const { territories } = get();
    const mayorStats = new Map<string, { username: string; avatar?: string; territoriesCount: number; totalStreak: number }>();

    for (const [, territory] of territories) {
      if (territory.mayor) {
        const existing = mayorStats.get(territory.mayor.handle) || {
          username: territory.mayor.username,
          avatar: territory.mayor.avatar,
          territoriesCount: 0,
          totalStreak: 0,
        };
        existing.territoriesCount++;
        existing.totalStreak += territory.mayor.streak;
        mayorStats.set(territory.mayor.handle, existing);
      }
    }

    return Array.from(mayorStats.entries())
      .map(([handle, stats]) => ({ handle, ...stats }))
      .sort((a, b) => b.territoriesCount - a.territoriesCount || b.totalStreak - a.totalStreak);
  },

  checkMayorChange: (territoryId) => {
    const { territories } = get();
    const territory = territories.get(territoryId);

    if (!territory) {
      return { changed: false };
    }

    const currentMayor = territory.mayor?.handle;
    const topUser = territory.leaderboard[0];

    if (topUser && topUser.handle !== currentMayor) {
      return {
        changed: true,
        newMayor: topUser.handle,
        previousMayor: currentMayor,
      };
    }

    return { changed: false };
  },
}));
