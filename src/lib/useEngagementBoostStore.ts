"use client";

import { create } from "zustand";
import type { Post } from "./types";

export interface HotZone {
  id: string;
  center: { lat: number; lon: number };
  radius: number; // en km
  postCount: number;
  userCount: number;
  intensity: "warm" | "hot" | "fire" | "explosive"; // Niveaux d'intensité
  startedAt: string;
  lastActivityAt: string;
  topPosts: string[]; // IDs des posts les plus populaires
  city?: string;
  country?: string;
}

export interface ViralPrediction {
  postId: string;
  score: number; // 0-100
  confidence: "low" | "medium" | "high";
  predictedPeakTime: string; // ISO date
  factors: {
    earlyEngagement: number;
    authorInfluence: number;
    contentQuality: number;
    timing: number;
    location: number;
  };
  boostedBy: string[]; // User IDs who boosted
  boostCount: number;
}

// Prédiction AVANT publication
export interface PrePublishPrediction {
  score: number; // 0-100
  label: "faible" | "moyen" | "bon" | "excellent" | "viral";
  factors: {
    timing: { score: number; label: string; tip?: string };
    content: { score: number; label: string; tip?: string };
    media: { score: number; label: string; tip?: string };
    location: { score: number; label: string; tip?: string };
    hashtags: { score: number; label: string; tip?: string };
    category: { score: number; label: string; tip?: string };
  };
  tips: string[];
}

export interface Challenge {
  id: string;
  type: "location" | "category" | "time" | "social";
  title: string;
  description: string;
  emoji: string;
  targetLocation?: { lat: number; lon: number; radius: number; name: string };
  targetCategory?: string;
  startDate: string;
  endDate: string;
  reward: {
    type: "badge" | "visibility" | "points";
    value: string | number;
    badgeEmoji?: string;
  };
  participants: string[]; // User handles
  completedBy: string[]; // User handles who completed
  leaderboard: Array<{ handle: string; score: number; completedAt?: string }>;
  isActive: boolean;
}

interface EngagementBoostState {
  // Hot Zones
  hotZones: HotZone[];

  // Viral Predictions
  viralPredictions: Map<string, ViralPrediction>;

  // Challenges
  activeChallenges: Challenge[];
  userChallengeProgress: Map<string, { challengeId: string; progress: number; completed: boolean }[]>;

  // Actions
  detectHotZones: (posts: Post[]) => void;
  predictVirality: (post: Post, allPosts: Post[]) => ViralPrediction;
  predictPrePublish: (params: {
    text: string;
    category: string;
    hasMedia: boolean;
    geoMode: "none" | "approximate" | "precise";
    location?: { lat: number; lon: number };
  }) => PrePublishPrediction;
  boostPost: (postId: string, userHandle: string) => void;

  // Challenge actions
  joinChallenge: (challengeId: string, userHandle: string) => void;
  checkChallengeCompletion: (post: Post, userHandle: string) => string | null; // Returns challenge ID if completed
  generateDailyChallenges: (userLocation?: { lat: number; lon: number }) => void;

  // Helpers
  getHotZoneAt: (lat: number, lon: number) => HotZone | null;
  getViralPrediction: (postId: string) => ViralPrediction | null;
  isInHotZone: (lat: number, lon: number) => boolean;
}

// Calcul de distance Haversine
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Clustering optimisé pour détecter les zones denses
// Limite le nombre de posts pour éviter O(n²) avec beaucoup de posts
const MAX_POSTS_FOR_CLUSTERING = 200;

function clusterPosts(posts: Post[], radiusKm: number = 5): Array<{ center: { lat: number; lon: number }; posts: Post[] }> {
  // Limiter aux posts les plus récents pour éviter les calculs excessifs
  const sortedPosts = [...posts]
    .filter(p => p.lat && p.lon)
    .sort((a, b) => new Date(b.createdAtISO).getTime() - new Date(a.createdAtISO).getTime())
    .slice(0, MAX_POSTS_FOR_CLUSTERING);

  const clusters: Array<{ center: { lat: number; lon: number }; posts: Post[] }> = [];
  const used = new Set<string>();

  for (const post of sortedPosts) {
    if (used.has(post.id)) continue;

    const cluster: Post[] = [post];
    used.add(post.id);

    for (const other of sortedPosts) {
      if (used.has(other.id)) continue;
      if (haversineKm(post.lat!, post.lon!, other.lat!, other.lon!) <= radiusKm) {
        cluster.push(other);
        used.add(other.id);
      }
    }

    if (cluster.length >= 3) { // Minimum 3 posts pour former un cluster
      const avgLat = cluster.reduce((sum, p) => sum + (p.lat || 0), 0) / cluster.length;
      const avgLon = cluster.reduce((sum, p) => sum + (p.lon || 0), 0) / cluster.length;
      clusters.push({ center: { lat: avgLat, lon: avgLon }, posts: cluster });
    }
  }

  return clusters;
}

// Génération de challenges quotidiens
function generateChallenges(userLocation?: { lat: number; lon: number }): Challenge[] {
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  
  const challenges: Challenge[] = [
    {
      id: `daily-vibe-${now.toISOString().split('T')[0]}`,
      type: "category",
      title: "Vibe Check",
      description: "Poste 3 vibes aujourd'hui",
      emoji: "✨",
      targetCategory: "vibe",
      startDate: now.toISOString(),
      endDate: endOfDay.toISOString(),
      reward: { type: "badge", value: "Vibe Master", badgeEmoji: "✨" },
      participants: [],
      completedBy: [],
      leaderboard: [],
      isActive: true,
    },
    {
      id: `daily-news-${now.toISOString().split('T')[0]}`,
      type: "category",
      title: "Info Reporter",
      description: "Partage une actualité locale",
      emoji: "📰",
      targetCategory: "news",
      startDate: now.toISOString(),
      endDate: endOfDay.toISOString(),
      reward: { type: "visibility", value: 2 }, // 2x visibility boost
      participants: [],
      completedBy: [],
      leaderboard: [],
      isActive: true,
    },
    {
      id: `daily-social-${now.toISOString().split('T')[0]}`,
      type: "social",
      title: "Social Butterfly",
      description: "Like 10 posts et commente 3 fois",
      emoji: "🦋",
      startDate: now.toISOString(),
      endDate: endOfDay.toISOString(),
      reward: { type: "points", value: 500 },
      participants: [],
      completedBy: [],
      leaderboard: [],
      isActive: true,
    },
  ];

  // Challenge géolocalisé si on a la position
  if (userLocation) {
    challenges.push({
      id: `daily-local-${now.toISOString().split('T')[0]}`,
      type: "location",
      title: "Local Explorer",
      description: "Poste depuis ta zone",
      emoji: "📍",
      targetLocation: { ...userLocation, radius: 10, name: "Ta zone" },
      startDate: now.toISOString(),
      endDate: endOfDay.toISOString(),
      reward: { type: "badge", value: "Local Legend", badgeEmoji: "🏆" },
      participants: [],
      completedBy: [],
      leaderboard: [],
      isActive: true,
    });
  }

  // Challenge Hot Zone (si des hot zones existent)
  challenges.push({
    id: `daily-hotzone-${now.toISOString().split('T')[0]}`,
    type: "location",
    title: "Hot Zone Hunter",
    description: "Poste depuis une Hot Zone 🔥",
    emoji: "🔥",
    startDate: now.toISOString(),
    endDate: endOfDay.toISOString(),
    reward: { type: "visibility", value: 3 }, // 3x visibility boost
    participants: [],
    completedBy: [],
    leaderboard: [],
    isActive: true,
  });

  return challenges;
}

export const useEngagementBoostStore = create<EngagementBoostState>((set, get) => ({
  hotZones: [],
  viralPredictions: new Map(),
  activeChallenges: [],
  userChallengeProgress: new Map(),

  detectHotZones: (posts: Post[]) => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentPosts = posts.filter(
      (p) => new Date(p.createdAtISO).getTime() > oneHourAgo && p.lat && p.lon
    );

    const clusters = clusterPosts(recentPosts, 5);
    
    const hotZones: HotZone[] = clusters
      .filter((c) => c.posts.length >= 5) // Minimum 5 posts récents pour être "hot"
      .map((cluster) => {
        const uniqueUsers = new Set(cluster.posts.map((p) => p.handle));
        const postCount = cluster.posts.length;
        const userCount = uniqueUsers.size;
        
        // Calculer l'intensité
        let intensity: HotZone["intensity"] = "warm";
        if (postCount >= 20 || userCount >= 15) intensity = "explosive";
        else if (postCount >= 15 || userCount >= 10) intensity = "fire";
        else if (postCount >= 10 || userCount >= 7) intensity = "hot";

        // Top posts par likes
        const topPosts = [...cluster.posts]
          .sort((a, b) => b.likes - a.likes)
          .slice(0, 5)
          .map((p) => p.id);

        return {
          id: `hz-${cluster.center.lat.toFixed(2)}-${cluster.center.lon.toFixed(2)}`,
          center: cluster.center,
          radius: 5,
          postCount,
          userCount,
          intensity,
          startedAt: cluster.posts.reduce((earliest, p) => 
            new Date(p.createdAtISO) < new Date(earliest) ? p.createdAtISO : earliest,
            cluster.posts[0].createdAtISO
          ),
          lastActivityAt: cluster.posts.reduce((latest, p) => 
            new Date(p.createdAtISO) > new Date(latest) ? p.createdAtISO : latest,
            cluster.posts[0].createdAtISO
          ),
          topPosts,
        };
      });

    set({ hotZones });
  },

  predictVirality: (post: Post, allPosts: Post[]) => {
    const now = Date.now();
    const postAge = now - new Date(post.createdAtISO).getTime();
    const ageMinutes = postAge / 60000;

    // Facteurs de prédiction
    const factors = {
      // Engagement précoce (likes/comments dans les premières minutes)
      earlyEngagement: Math.min(100, ((post.likes + post.comments.length * 3) / Math.max(1, ageMinutes)) * 10),
      
      // Influence de l'auteur (basé sur les posts précédents)
      authorInfluence: Math.min(100, 
        allPosts.filter((p) => p.handle === post.handle).reduce((sum, p) => sum + p.likes, 0) / 10
      ),
      
      // Qualité du contenu (présence média, longueur texte)
      contentQuality: Math.min(100,
        (post.media ? 40 : 0) + 
        (post.text.length > 50 ? 20 : 0) + 
        (post.text.length > 100 ? 20 : 0) +
        (post.text.includes("!") || post.text.includes("?") ? 10 : 0) +
        (/[😀-🙏🌀-🗿🚀-🛿🇦-🇿✂-➰Ⓜ-🉑]+/u.test(post.text) ? 10 : 0)
      ),
      
      // Timing (heures de pointe: 12h-14h, 18h-22h)
      timing: (() => {
        const hour = new Date(post.createdAtISO).getHours();
        if ((hour >= 12 && hour <= 14) || (hour >= 18 && hour <= 22)) return 100;
        if ((hour >= 10 && hour <= 16) || (hour >= 17 && hour <= 23)) return 70;
        return 40;
      })(),
      
      // Location (dans une hot zone?)
      location: (() => {
        if (!post.lat || !post.lon) return 30;
        const inHotZone = get().isInHotZone(post.lat, post.lon);
        return inHotZone ? 100 : 50;
      })(),
    };

    // Score global pondéré
    const score = Math.round(
      factors.earlyEngagement * 0.35 +
      factors.authorInfluence * 0.15 +
      factors.contentQuality * 0.20 +
      factors.timing * 0.15 +
      factors.location * 0.15
    );

    // Confidence basée sur l'âge du post
    let confidence: ViralPrediction["confidence"] = "low";
    if (ageMinutes > 30 && score > 60) confidence = "high";
    else if (ageMinutes > 15 && score > 40) confidence = "medium";

    // Prédiction du pic
    const peakTime = new Date(now + (score > 70 ? 2 : score > 50 ? 4 : 8) * 60 * 60 * 1000);

    const prediction: ViralPrediction = {
      postId: post.id,
      score,
      confidence,
      predictedPeakTime: peakTime.toISOString(),
      factors,
      boostedBy: [],
      boostCount: 0,
    };

    const predictions = new Map(get().viralPredictions);
    predictions.set(post.id, prediction);
    set({ viralPredictions: predictions });

    return prediction;
  },

  boostPost: (postId: string, userHandle: string) => {
    const predictions = new Map(get().viralPredictions);
    const prediction = predictions.get(postId);

    if (prediction && !prediction.boostedBy.includes(userHandle)) {
      prediction.boostedBy.push(userHandle);
      prediction.boostCount++;
      // Augmenter le score avec les boosts
      prediction.score = Math.min(100, prediction.score + 2);
      predictions.set(postId, prediction);
      set({ viralPredictions: predictions });
    }
  },

  predictPrePublish: ({ text, category, hasMedia, geoMode, location }) => {
    const tips: string[] = [];
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay(); // 0 = Sunday

    // === TIMING ===
    let timingScore = 40;
    let timingLabel = "Heure calme";
    let timingTip: string | undefined;

    // Prime time: 12h-14h, 18h-22h en semaine
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isPrimeTime = (hour >= 12 && hour <= 14) || (hour >= 18 && hour <= 22);
    const isGoodTime = (hour >= 10 && hour <= 23);

    if (isPrimeTime && !isWeekend) {
      timingScore = 100;
      timingLabel = "Prime time ! 🔥";
    } else if (isPrimeTime && isWeekend) {
      timingScore = 90;
      timingLabel = "Bon timing weekend";
    } else if (isGoodTime) {
      timingScore = 70;
      timingLabel = "Horaire correct";
    } else {
      timingTip = "Poste entre 12h-14h ou 18h-22h pour plus de visibilité";
      tips.push("⏰ " + timingTip);
    }

    // === CONTENT ===
    let contentScore = 30;
    let contentLabel = "Texte court";
    let contentTip: string | undefined;

    const textLength = text.trim().length;
    const hasEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(text);
    const hasQuestion = text.includes("?");
    const hasExclamation = text.includes("!");
    const hashtagCount = (text.match(/#\w+/g) || []).length;

    if (textLength >= 100) contentScore += 30;
    else if (textLength >= 50) contentScore += 20;
    else if (textLength >= 20) contentScore += 10;
    else {
      contentTip = "Un texte plus long engage davantage";
      tips.push("📝 " + contentTip);
    }

    if (hasEmoji) contentScore += 15;
    else tips.push("😊 Ajoute des emojis pour plus d'engagement");

    if (hasQuestion) contentScore += 10;
    if (hasExclamation) contentScore += 5;

    if (contentScore >= 80) contentLabel = "Excellent contenu !";
    else if (contentScore >= 60) contentLabel = "Bon contenu";
    else if (contentScore >= 40) contentLabel = "Contenu correct";

    // === HASHTAGS ===
    let hashtagScore = 50;
    let hashtagLabel = "Pas de hashtag";
    let hashtagTip: string | undefined;

    if (hashtagCount >= 3 && hashtagCount <= 5) {
      hashtagScore = 100;
      hashtagLabel = "Hashtags parfaits !";
    } else if (hashtagCount >= 1 && hashtagCount <= 2) {
      hashtagScore = 70;
      hashtagLabel = "Quelques hashtags";
      hashtagTip = "2-4 hashtags c'est l'idéal";
    } else if (hashtagCount > 5) {
      hashtagScore = 60;
      hashtagLabel = "Trop de hashtags";
      hashtagTip = "Limite-toi à 3-5 hashtags";
      tips.push("# Réduis à 3-5 hashtags pour plus d'impact");
    } else {
      hashtagTip = "Ajoute 2-4 hashtags pertinents";
      tips.push("# Ajoute des hashtags pour être découvert");
    }

    // === MEDIA ===
    let mediaScore = hasMedia ? 100 : 30;
    let mediaLabel = hasMedia ? "Média inclus ✓" : "Pas de média";
    let mediaTip: string | undefined;

    if (!hasMedia) {
      mediaTip = "Les posts avec média ont 3x plus d'engagement";
      tips.push("📷 Ajoute une image ou vidéo !");
    }

    // === LOCATION ===
    let locationScore = 40;
    let locationLabel = "Pas de géoloc";
    let locationTip: string | undefined;

    if (geoMode === "precise") {
      locationScore = 100;
      locationLabel = "Position précise ✓";

      // Bonus Hot Zone
      if (location && get().isInHotZone(location.lat, location.lon)) {
        locationScore = 120; // Bonus!
        locationLabel = "Hot Zone ! 🔥";
      }
    } else if (geoMode === "approximate") {
      locationScore = 70;
      locationLabel = "Position approx.";
      locationTip = "La position précise booste la visibilité locale";
    } else {
      locationTip = "Active la géolocalisation pour apparaître sur la carte";
      tips.push("📍 Active la géoloc pour être visible sur le globe");
    }

    // === CATEGORY ===
    let categoryScore = 60;
    let categoryLabel = "Catégorie standard";

    // Certaines catégories performent mieux à certains moments
    if (category === "event" && (dayOfWeek === 5 || dayOfWeek === 6)) {
      categoryScore = 100;
      categoryLabel = "Events trending le weekend !";
    } else if (category === "news" && hour >= 7 && hour <= 10) {
      categoryScore = 90;
      categoryLabel = "News matinales 📰";
    } else if (category === "vibe") {
      categoryScore = 80;
      categoryLabel = "Vibes populaires ✨";
    } else if (category === "alert") {
      categoryScore = 95;
      categoryLabel = "Alertes prioritaires ⚠️";
    }

    // === SCORE FINAL ===
    const weights = {
      timing: 0.20,
      content: 0.25,
      media: 0.20,
      location: 0.15,
      hashtags: 0.10,
      category: 0.10,
    };

    const finalScore = Math.min(100, Math.round(
      timingScore * weights.timing +
      contentScore * weights.content +
      mediaScore * weights.media +
      locationScore * weights.location +
      hashtagScore * weights.hashtags +
      categoryScore * weights.category
    ));

    let label: PrePublishPrediction["label"] = "faible";
    if (finalScore >= 85) label = "viral";
    else if (finalScore >= 70) label = "excellent";
    else if (finalScore >= 55) label = "bon";
    else if (finalScore >= 40) label = "moyen";

    return {
      score: finalScore,
      label,
      factors: {
        timing: { score: Math.min(100, timingScore), label: timingLabel, tip: timingTip },
        content: { score: Math.min(100, contentScore), label: contentLabel, tip: contentTip },
        media: { score: Math.min(100, mediaScore), label: mediaLabel, tip: mediaTip },
        location: { score: Math.min(100, locationScore), label: locationLabel, tip: locationTip },
        hashtags: { score: Math.min(100, hashtagScore), label: hashtagLabel, tip: hashtagTip },
        category: { score: Math.min(100, categoryScore), label: categoryLabel },
      },
      tips: tips.slice(0, 3), // Max 3 tips
    };
  },

  joinChallenge: (challengeId: string, userHandle: string) => {
    set((state) => ({
      activeChallenges: state.activeChallenges.map((c) =>
        c.id === challengeId && !c.participants.includes(userHandle)
          ? { ...c, participants: [...c.participants, userHandle] }
          : c
      ),
    }));
  },

  checkChallengeCompletion: (post: Post, userHandle: string) => {
    const { activeChallenges } = get();
    
    for (const challenge of activeChallenges) {
      if (challenge.completedBy.includes(userHandle)) continue;
      if (!challenge.participants.includes(userHandle)) continue;

      let completed = false;

      if (challenge.type === "category" && challenge.targetCategory) {
        completed = post.category === challenge.targetCategory;
      }

      if (challenge.type === "location" && challenge.targetLocation && post.lat && post.lon) {
        const distance = haversineKm(
          post.lat, post.lon,
          challenge.targetLocation.lat, challenge.targetLocation.lon
        );
        completed = distance <= challenge.targetLocation.radius;
      }

      // Hot Zone Hunter special case
      if (challenge.id.includes("hotzone") && post.lat && post.lon) {
        completed = get().isInHotZone(post.lat, post.lon);
      }

      if (completed) {
        set((state) => ({
          activeChallenges: state.activeChallenges.map((c) =>
            c.id === challenge.id
              ? { 
                  ...c, 
                  completedBy: [...c.completedBy, userHandle],
                  leaderboard: [...c.leaderboard, { handle: userHandle, score: 100, completedAt: new Date().toISOString() }]
                }
              : c
          ),
        }));
        return challenge.id;
      }
    }

    return null;
  },

  generateDailyChallenges: (userLocation) => {
    const challenges = generateChallenges(userLocation);
    set({ activeChallenges: challenges });
  },

  getHotZoneAt: (lat: number, lon: number) => {
    return get().hotZones.find((hz) => 
      haversineKm(lat, lon, hz.center.lat, hz.center.lon) <= hz.radius
    ) || null;
  },

  getViralPrediction: (postId: string) => {
    return get().viralPredictions.get(postId) || null;
  },

  isInHotZone: (lat: number, lon: number) => {
    return get().hotZones.some((hz) => 
      haversineKm(lat, lon, hz.center.lat, hz.center.lon) <= hz.radius
    );
  },
}));
