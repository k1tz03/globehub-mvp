"use client";

import { create } from "zustand";

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

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export type CapsuleRevealMode =
  | "proximity" // Révélée quand quelqu'un passe à proximité
  | "date" // Révélée à une date précise
  | "crowd"; // Révélée quand X personnes sont dans la zone

export interface TimeCapsule {
  id: string;
  creatorId: string;
  creatorHandle: string;
  creatorUsername: string;
  creatorAvatar?: string;

  // Contenu
  text: string;
  mediaUrl?: string;

  // Position
  location: { lat: number; lon: number };
  locationName?: string;
  radius: number; // km pour la détection de proximité

  // Mode de révélation
  revealMode: CapsuleRevealMode;
  revealDate?: string; // Pour mode "date"
  revealCrowdSize?: number; // Pour mode "crowd" (nombre de personnes requises)

  // État
  status: "buried" | "revealed" | "expired";
  createdAt: string;
  revealedAt?: string;

  // Découvreurs
  discoveredBy: Array<{
    handle: string;
    username: string;
    avatar?: string;
    discoveredAt: string;
  }>;
  firstDiscoverer?: string;

  // Réactions
  reactions: {
    amazed: string[]; // handles
    touched: string[];
    funny: string[];
  };

  // Stats
  viewCount: number;
  shareCount: number;
}

export interface CapsuleHint {
  id: string;
  direction: "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";
  distance: "proche" | "moyen" | "loin"; // <500m, 500m-2km, >2km
  emoji: string;
}

interface TimeCapsuleState {
  capsules: TimeCapsule[];
  ready: boolean;

  // Actions
  createCapsule: (data: {
    creatorId: string;
    creatorHandle: string;
    creatorUsername: string;
    creatorAvatar?: string;
    text: string;
    mediaUrl?: string;
    location: { lat: number; lon: number };
    locationName?: string;
    revealMode: CapsuleRevealMode;
    revealDate?: string;
    revealCrowdSize?: number;
  }) => TimeCapsule;

  // Révéler une capsule
  revealCapsule: (capsuleId: string, discovererHandle: string, discovererUsername: string, discovererAvatar?: string) => boolean;

  // Vérifier si des capsules peuvent être révélées à cette position
  checkProximityCapsules: (lat: number, lon: number, userHandle: string) => TimeCapsule[];

  // Vérifier les capsules par date
  checkDateCapsules: () => TimeCapsule[];

  // Vérifier les capsules par foule
  checkCrowdCapsules: (activeUsersInArea: Array<{ lat: number; lon: number; handle: string }>) => TimeCapsule[];

  // Obtenir les indices pour les capsules proches non révélées
  getNearbyHints: (lat: number, lon: number, userHandle: string) => CapsuleHint[];

  // Réagir à une capsule
  reactToCapsule: (capsuleId: string, userHandle: string, reaction: "amazed" | "touched" | "funny") => void;

  // Obtenir les capsules de l'utilisateur
  getUserCapsules: (handle: string) => TimeCapsule[];

  // Obtenir les capsules découvertes par l'utilisateur
  getDiscoveredCapsules: (handle: string) => TimeCapsule[];

  // Stats
  getTotalBuriedCapsules: () => number;
  getTotalRevealedCapsules: () => number;
}

const STORAGE_KEY = "globehub_time_capsules_v1";

// Capsules de démo
const defaultCapsules: TimeCapsule[] = [
  {
    id: "capsule_demo_1",
    creatorId: "usr_camille",
    creatorHandle: "camille",
    creatorUsername: "Camille",
    text: "Si tu trouves ce message, sache que j'ai passé ici le plus beau coucher de soleil de ma vie. Regarde vers l'ouest à 19h, tu comprendras. ✨",
    location: { lat: 48.8584, lon: 2.2945 }, // Tour Eiffel
    locationName: "Tour Eiffel",
    radius: 0.3,
    revealMode: "proximity",
    status: "buried",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    discoveredBy: [],
    reactions: { amazed: [], touched: [], funny: [] },
    viewCount: 0,
    shareCount: 0,
  },
  {
    id: "capsule_demo_2",
    creatorId: "usr_noah",
    creatorHandle: "noah",
    creatorUsername: "Noah",
    text: "Message du futur ! Si tu lis ça, le café ici fait toujours le meilleur expresso de Paris ? Dis-moi en commentaire ! ☕",
    location: { lat: 48.8606, lon: 2.3376 }, // Le Marais
    locationName: "Le Marais",
    radius: 0.2,
    revealMode: "date",
    revealDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Demain
    status: "buried",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    discoveredBy: [],
    reactions: { amazed: [], touched: [], funny: [] },
    viewCount: 0,
    shareCount: 0,
  },
  {
    id: "capsule_demo_3",
    creatorId: "usr_emma",
    creatorHandle: "emma",
    creatorUsername: "Emma",
    text: "Ce message s'ouvrira quand 5 personnes seront réunies ici. Organisons un flash mob ! 🎉💃",
    location: { lat: 48.8530, lon: 2.3499 },
    locationName: "Place des Vosges",
    radius: 0.1,
    revealMode: "crowd",
    revealCrowdSize: 5,
    status: "buried",
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    discoveredBy: [],
    reactions: { amazed: [], touched: [], funny: [] },
    viewCount: 0,
    shareCount: 0,
  },
];

function safeParse<T>(json: string | null): T | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

function getDirection(fromLat: number, fromLon: number, toLat: number, toLon: number): CapsuleHint["direction"] {
  const dLat = toLat - fromLat;
  const dLon = toLon - fromLon;
  const angle = (Math.atan2(dLon, dLat) * 180) / Math.PI;

  // Normaliser à 0-360
  const normalized = (angle + 360) % 360;

  if (normalized < 22.5 || normalized >= 337.5) return "N";
  if (normalized < 67.5) return "NE";
  if (normalized < 112.5) return "E";
  if (normalized < 157.5) return "SE";
  if (normalized < 202.5) return "S";
  if (normalized < 247.5) return "SW";
  if (normalized < 292.5) return "W";
  return "NW";
}

function getDistanceCategory(distanceKm: number): CapsuleHint["distance"] {
  if (distanceKm < 0.5) return "proche";
  if (distanceKm < 2) return "moyen";
  return "loin";
}

const DIRECTION_EMOJIS: Record<CapsuleHint["direction"], string> = {
  N: "⬆️",
  NE: "↗️",
  E: "➡️",
  SE: "↘️",
  S: "⬇️",
  SW: "↙️",
  W: "⬅️",
  NW: "↖️",
};

export const useTimeCapsuleStore = create<TimeCapsuleState>((set, get) => ({
  capsules: [],
  ready: false,

  // Initialisation
  ...(() => {
    if (typeof window !== "undefined") {
      const saved = safeParse<TimeCapsule[]>(localStorage.getItem(STORAGE_KEY));
      if (saved) {
        return { capsules: saved, ready: true };
      }
    }
    return { capsules: defaultCapsules, ready: true };
  })(),

  createCapsule: (data) => {
    const capsule: TimeCapsule = {
      id: `capsule_${uid()}`,
      creatorId: data.creatorId,
      creatorHandle: data.creatorHandle,
      creatorUsername: data.creatorUsername,
      creatorAvatar: data.creatorAvatar,
      text: data.text,
      mediaUrl: data.mediaUrl,
      location: data.location,
      locationName: data.locationName,
      radius: 0.2, // 200m par défaut
      revealMode: data.revealMode,
      revealDate: data.revealDate,
      revealCrowdSize: data.revealCrowdSize,
      status: "buried",
      createdAt: new Date().toISOString(),
      discoveredBy: [],
      reactions: { amazed: [], touched: [], funny: [] },
      viewCount: 0,
      shareCount: 0,
    };

    const newCapsules = [...get().capsules, capsule];
    set({ capsules: newCapsules });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(newCapsules));

    return capsule;
  },

  revealCapsule: (capsuleId, discovererHandle, discovererUsername, discovererAvatar) => {
    const { capsules } = get();
    const capsule = capsules.find(c => c.id === capsuleId);

    if (!capsule || capsule.status !== "buried") return false;

    // Ne pas se découvrir soi-même
    if (capsule.creatorHandle === discovererHandle) return false;

    // Déjà découvert par cet utilisateur ?
    if (capsule.discoveredBy.some(d => d.handle === discovererHandle)) return false;

    const now = new Date().toISOString();
    const isFirstDiscoverer = capsule.discoveredBy.length === 0;

    const updatedCapsules = capsules.map(c => {
      if (c.id !== capsuleId) return c;

      return {
        ...c,
        status: "revealed" as const,
        revealedAt: isFirstDiscoverer ? now : c.revealedAt,
        firstDiscoverer: isFirstDiscoverer ? discovererHandle : c.firstDiscoverer,
        discoveredBy: [
          ...c.discoveredBy,
          {
            handle: discovererHandle,
            username: discovererUsername,
            avatar: discovererAvatar,
            discoveredAt: now,
          },
        ],
        viewCount: c.viewCount + 1,
      };
    });

    set({ capsules: updatedCapsules });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCapsules));

    return true;
  },

  checkProximityCapsules: (lat, lon, userHandle) => {
    const { capsules } = get();

    return capsules.filter(capsule => {
      if (capsule.status !== "buried") return false;
      if (capsule.revealMode !== "proximity") return false;
      if (capsule.creatorHandle === userHandle) return false;

      const distance = haversineKm(lat, lon, capsule.location.lat, capsule.location.lon);
      return distance <= capsule.radius;
    });
  },

  checkDateCapsules: () => {
    const { capsules } = get();
    const now = new Date();

    const toReveal = capsules.filter(capsule => {
      if (capsule.status !== "buried") return false;
      if (capsule.revealMode !== "date") return false;
      if (!capsule.revealDate) return false;

      return new Date(capsule.revealDate) <= now;
    });

    // Auto-révéler les capsules par date
    if (toReveal.length > 0) {
      const updatedCapsules = capsules.map(c => {
        if (toReveal.find(r => r.id === c.id)) {
          return {
            ...c,
            status: "revealed" as const,
            revealedAt: new Date().toISOString(),
          };
        }
        return c;
      });

      set({ capsules: updatedCapsules });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCapsules));
    }

    return toReveal;
  },

  checkCrowdCapsules: (activeUsersInArea) => {
    const { capsules } = get();

    const toReveal = capsules.filter(capsule => {
      if (capsule.status !== "buried") return false;
      if (capsule.revealMode !== "crowd") return false;
      if (!capsule.revealCrowdSize) return false;

      // Compter les utilisateurs dans le rayon de la capsule
      const usersNearby = activeUsersInArea.filter(user => {
        const distance = haversineKm(user.lat, user.lon, capsule.location.lat, capsule.location.lon);
        return distance <= capsule.radius;
      });

      return usersNearby.length >= capsule.revealCrowdSize;
    });

    // Auto-révéler
    if (toReveal.length > 0) {
      const updatedCapsules = capsules.map(c => {
        if (toReveal.find(r => r.id === c.id)) {
          return {
            ...c,
            status: "revealed" as const,
            revealedAt: new Date().toISOString(),
          };
        }
        return c;
      });

      set({ capsules: updatedCapsules });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCapsules));
    }

    return toReveal;
  },

  getNearbyHints: (lat, lon, userHandle) => {
    const { capsules } = get();

    const hints: CapsuleHint[] = [];

    for (const capsule of capsules) {
      if (capsule.status !== "buried") continue;
      if (capsule.creatorHandle === userHandle) continue;

      const distance = haversineKm(lat, lon, capsule.location.lat, capsule.location.lon);

      // N'afficher les indices que pour les capsules à moins de 5km
      if (distance > 5) continue;

      const direction = getDirection(lat, lon, capsule.location.lat, capsule.location.lon);
      const distanceCategory = getDistanceCategory(distance);

      hints.push({
        id: capsule.id,
        direction,
        distance: distanceCategory,
        emoji: DIRECTION_EMOJIS[direction],
      });
    }

    return hints;
  },

  reactToCapsule: (capsuleId, userHandle, reaction) => {
    const { capsules } = get();

    const updatedCapsules = capsules.map(c => {
      if (c.id !== capsuleId) return c;

      const newReactions = { ...c.reactions };

      // Toggle reaction
      if (newReactions[reaction].includes(userHandle)) {
        newReactions[reaction] = newReactions[reaction].filter(h => h !== userHandle);
      } else {
        // Remove from other reactions first
        newReactions.amazed = newReactions.amazed.filter(h => h !== userHandle);
        newReactions.touched = newReactions.touched.filter(h => h !== userHandle);
        newReactions.funny = newReactions.funny.filter(h => h !== userHandle);
        // Add to new reaction
        newReactions[reaction] = [...newReactions[reaction], userHandle];
      }

      return { ...c, reactions: newReactions };
    });

    set({ capsules: updatedCapsules });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCapsules));
  },

  getUserCapsules: (handle) => {
    return get().capsules.filter(c => c.creatorHandle === handle);
  },

  getDiscoveredCapsules: (handle) => {
    return get().capsules.filter(c =>
      c.discoveredBy.some(d => d.handle === handle)
    );
  },

  getTotalBuriedCapsules: () => {
    return get().capsules.filter(c => c.status === "buried").length;
  },

  getTotalRevealedCapsules: () => {
    return get().capsules.filter(c => c.status === "revealed").length;
  },
}));
