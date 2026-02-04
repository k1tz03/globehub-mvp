"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import type { Post, User, InterestCategory } from "./types";

// Réexporter InterestCategory pour les composants
export type { InterestCategory } from "./types";

// === LISTE DES CATÉGORIES D'INTÉRÊTS (pour l'UI) ===
export const INTEREST_CATEGORIES: { id: InterestCategory; label: string; emoji: string }[] = [
  { id: "music", label: "Musique", emoji: "🎵" },
  { id: "sports", label: "Sport", emoji: "⚽" },
  { id: "travel", label: "Voyage", emoji: "✈️" },
  { id: "food", label: "Gastronomie", emoji: "🍕" },
  { id: "tech", label: "Tech", emoji: "💻" },
  { id: "art", label: "Art", emoji: "🎨" },
  { id: "fashion", label: "Mode", emoji: "👗" },
  { id: "gaming", label: "Gaming", emoji: "🎮" },
  { id: "nature", label: "Nature", emoji: "🌿" },
  { id: "politics", label: "Politique", emoji: "🏛️" },
  { id: "science", label: "Science", emoji: "🔬" },
  { id: "cinema", label: "Cinéma", emoji: "🎬" },
  { id: "photography", label: "Photo", emoji: "📷" },
  { id: "fitness", label: "Fitness", emoji: "💪" },
  { id: "business", label: "Business", emoji: "💼" },
  { id: "lifestyle", label: "Lifestyle", emoji: "✨" },
];

const USER_ACTIVITY_KEY = "globehub_user_activity_v2";

function safeParse<T>(json: string | null): T | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

// === MOTS-CLÉS PAR INTÉRÊT (enrichis) ===
export const INTEREST_KEYWORDS: Record<InterestCategory, string[]> = {
  music: ["musique", "concert", "album", "chanson", "artiste", "spotify", "festival", "guitar", "piano", "dj", "rap", "rock", "jazz", "playlist", "lyrics", "song", "singer", "band", "tour", "live"],
  sports: ["football", "basket", "tennis", "match", "équipe", "champion", "coupe", "sport", "jeux olympiques", "goal", "rugby", "natation", "athlétisme", "psg", "om", "nba", "fifa", "ligue", "stade", "victoire"],
  travel: ["voyage", "vacances", "plage", "avion", "hotel", "tourisme", "découverte", "pays", "roadtrip", "backpack", "destination", "visite", "aventure", "explore", "trip", "world", "passport", "fly", "island", "city trip"],
  food: ["restaurant", "cuisine", "recette", "gastronomie", "chef", "plat", "dessert", "vin", "café", "brunch", "food", "délicieux", "saveur", "miam", "gourmand", "bistro", "menu", "ingrédient", "cooking", "foodie"],
  tech: ["technologie", "startup", "app", "innovation", "ai", "crypto", "coding", "developer", "smartphone", "gadget", "ia", "robot", "software", "hardware", "web3", "python", "javascript", "apple", "google", "meta"],
  art: ["art", "musée", "exposition", "peinture", "sculpture", "galerie", "artiste", "œuvre", "création", "design", "dessin", "créatif", "illustration", "street art", "contemporain", "canvas", "vernissage", "artistic", "museum"],
  fashion: ["mode", "fashion", "vêtements", "style", "tendance", "outfit", "marque", "luxe", "accessoire", "défilé", "look", "vintage", "shopping", "collection", "streetwear", "brand", "chic", "couture", "trend", "wear"],
  gaming: ["jeu", "gaming", "gamer", "console", "playstation", "xbox", "nintendo", "esport", "stream", "twitch", "fortnite", "minecraft", "cod", "lol", "fps", "rpg", "videogame", "play", "level", "game"],
  nature: ["nature", "randonnée", "montagne", "forêt", "animaux", "environnement", "écologie", "jardin", "fleurs", "mer", "océan", "sunset", "paysage", "sauvage", "bio", "wildlife", "outdoor", "hiking", "green", "earth"],
  politics: ["politique", "élection", "gouvernement", "président", "loi", "débat", "parti", "vote", "démocratie", "réforme", "europe", "assemblée", "ministre", "macron", "maire", "sénat", "droite", "gauche", "citoyen", "nation"],
  science: ["science", "recherche", "découverte", "espace", "médecine", "physique", "chimie", "biologie", "astronomie", "nasa", "vaccin", "étude", "expérience", "labo", "climat", "mars", "quantique", "atome", "cellule", "adn"],
  cinema: ["film", "cinéma", "série", "netflix", "acteur", "réalisateur", "oscar", "blockbuster", "streaming", "binge", "disney", "marvel", "hbo", "prime", "anime", "trailer", "movie", "saison", "épisode", "hollywood"],
  photography: ["photo", "photographie", "shooting", "portrait", "paysage", "camera", "objectif", "lightroom", "editing", "instagram", "pose", "filter", "sunset", "street", "macro", "dslr", "lens", "shot", "capture", "pic"],
  fitness: ["fitness", "gym", "musculation", "yoga", "running", "marathon", "workout", "health", "nutrition", "crossfit", "entraînement", "cardio", "protein", "abs", "muscle", "sport", "training", "exercise", "body", "fit"],
  business: ["business", "entreprise", "entrepreneur", "startup", "investissement", "finance", "marketing", "carrière", "networking", "linkedin", "freelance", "ceo", "growth", "pitch", "funding", "money", "job", "work", "success", "profit"],
  lifestyle: ["lifestyle", "bien-être", "routine", "morning", "minimalisme", "productivité", "self-care", "motivation", "life", "daily", "gratitude", "zen", "meditation", "balance", "happy", "vibes", "mood", "chill", "relax", "wellness"],
};

// === TYPES ===
export interface UserActivity {
  userId: string;
  
  // Interactions avec posts
  likedPosts: { postId: string; authorHandle: string; timestamp: string; detectedInterests: InterestCategory[] }[];
  commentedPosts: { postId: string; authorHandle: string; timestamp: string; detectedInterests: InterestCategory[] }[];
  viewedPosts: { postId: string; viewDuration: number; timestamp: string; detectedInterests: InterestCategory[] }[];
  sharedPosts: { postId: string; timestamp: string }[];
  
  // Recherches
  searchHistory: { query: string; timestamp: string; detectedInterests: InterestCategory[] }[];
  
  // Scores d'intérêt dynamiques (0-100)
  interestScores: Record<InterestCategory, number>;
  
  // Auteurs préférés
  favoriteAuthors: { handle: string; score: number }[];
  
  // Stats
  lastUpdated: string;
  totalInteractions: number;
  streakDays: number;
  lastActiveDate: string;
}

export interface ScoredPost {
  post: Post;
  score: number;
  matchReasons: string[];
}

// === DÉTECTION DES INTÉRÊTS ===
export function detectInterestsFromText(text: string): InterestCategory[] {
  const textLower = text.toLowerCase();
  const detected: InterestCategory[] = [];
  const scores: Record<string, number> = {};
  
  for (const [interest, keywords] of Object.entries(INTEREST_KEYWORDS)) {
    let matchCount = 0;
    for (const keyword of keywords) {
      if (textLower.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    }
    if (matchCount > 0) {
      scores[interest] = matchCount;
    }
  }
  
  // Retourner les intérêts triés par nombre de matches
  return Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([interest]) => interest as InterestCategory);
}

// === INITIALISATION ===
function createInitialActivity(userId: string, userInterests: InterestCategory[]): UserActivity {
  const interestScores: Record<InterestCategory, number> = {} as Record<InterestCategory, number>;
  
  // Initialiser tous les scores à 0
  for (const interest of Object.keys(INTEREST_KEYWORDS) as InterestCategory[]) {
    interestScores[interest] = 0;
  }
  
  // Boost initial pour les intérêts déclarés lors de l'inscription (50 points)
  for (const interest of userInterests) {
    interestScores[interest] = 50;
  }
  
  return {
    userId,
    likedPosts: [],
    commentedPosts: [],
    viewedPosts: [],
    sharedPosts: [],
    searchHistory: [],
    interestScores,
    favoriteAuthors: [],
    lastUpdated: new Date().toISOString(),
    totalInteractions: 0,
    streakDays: 1,
    lastActiveDate: new Date().toISOString().split("T")[0],
  };
}

// === HOOK PRINCIPAL ===
export function useRecommendationStore(currentUser: User | null, allPosts: Post[]) {
  const [userActivity, setUserActivity] = useState<UserActivity | null>(null);
  const [ready, setReady] = useState(false);

  // Charger l'activité utilisateur
  useEffect(() => {
    if (!currentUser) {
      setUserActivity(null);
      setReady(true);
      return;
    }

    const key = `${USER_ACTIVITY_KEY}_${currentUser.id}`;
    const saved = safeParse<UserActivity>(localStorage.getItem(key));
    
    if (saved) {
      // Mettre à jour le streak journalier
      const today = new Date().toISOString().split("T")[0];
      const lastActive = saved.lastActiveDate;
      
      if (lastActive !== today) {
        const lastDate = new Date(lastActive);
        const todayDate = new Date(today);
        const daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          saved.streakDays += 1;
        } else if (daysDiff > 1) {
          saved.streakDays = 1;
        }
        saved.lastActiveDate = today;
      }
      
      setUserActivity(saved);
    } else {
      // Créer une nouvelle activité avec les intérêts de l'utilisateur
      const newActivity = createInitialActivity(currentUser.id, currentUser.engagement.interests);
      setUserActivity(newActivity);
      localStorage.setItem(key, JSON.stringify(newActivity));
    }
    
    setReady(true);
  }, [currentUser]);

  // Sauvegarder l'activité
  const saveActivity = useCallback((activity: UserActivity) => {
    if (!currentUser) return;
    const key = `${USER_ACTIVITY_KEY}_${currentUser.id}`;
    activity.lastUpdated = new Date().toISOString();
    localStorage.setItem(key, JSON.stringify(activity));
    setUserActivity(activity);
  }, [currentUser]);

  // === ENREGISTREMENT DES INTERACTIONS ===

  // 💖 Enregistrer un like
  const recordLike = useCallback((post: Post) => {
    if (!userActivity) return;
    
    const detectedInterests = detectInterestsFromText(post.text);
    const newActivity = { ...userActivity };
    
    // Éviter les doublons
    if (newActivity.likedPosts.some(l => l.postId === post.id)) return;
    
    // Ajouter le like
    newActivity.likedPosts = [
      { postId: post.id, authorHandle: post.handle, timestamp: new Date().toISOString(), detectedInterests },
      ...newActivity.likedPosts.slice(0, 199),
    ];
    newActivity.totalInteractions++;
    
    // Augmenter les scores d'intérêt (+8 points par like)
    for (const interest of detectedInterests) {
      newActivity.interestScores[interest] = Math.min(100, (newActivity.interestScores[interest] || 0) + 8);
    }
    
    // Mettre à jour les auteurs favoris (+5)
    const authorIdx = newActivity.favoriteAuthors.findIndex(a => a.handle === post.handle);
    if (authorIdx >= 0) {
      newActivity.favoriteAuthors[authorIdx].score += 5;
    } else {
      newActivity.favoriteAuthors.push({ handle: post.handle, score: 5 });
    }
    newActivity.favoriteAuthors.sort((a, b) => b.score - a.score);
    newActivity.favoriteAuthors = newActivity.favoriteAuthors.slice(0, 30);
    
    saveActivity(newActivity);
  }, [userActivity, saveActivity]);

  // 💔 Enregistrer un unlike
  const recordUnlike = useCallback((postId: string) => {
    if (!userActivity) return;
    
    const likedPost = userActivity.likedPosts.find(l => l.postId === postId);
    if (!likedPost) return;
    
    const newActivity = { ...userActivity };
    newActivity.likedPosts = newActivity.likedPosts.filter(l => l.postId !== postId);
    
    // Réduire légèrement les scores d'intérêt (-3 points)
    for (const interest of likedPost.detectedInterests) {
      newActivity.interestScores[interest] = Math.max(0, (newActivity.interestScores[interest] || 0) - 3);
    }
    
    saveActivity(newActivity);
  }, [userActivity, saveActivity]);

  // 💬 Enregistrer un commentaire
  const recordComment = useCallback((post: Post) => {
    if (!userActivity) return;
    
    const detectedInterests = detectInterestsFromText(post.text);
    const newActivity = { ...userActivity };
    
    // Un commentaire a plus de poids qu'un like
    newActivity.commentedPosts = [
      { postId: post.id, authorHandle: post.handle, timestamp: new Date().toISOString(), detectedInterests },
      ...newActivity.commentedPosts.slice(0, 99),
    ];
    newActivity.totalInteractions++;
    
    // +12 points par commentaire (plus que le like)
    for (const interest of detectedInterests) {
      newActivity.interestScores[interest] = Math.min(100, (newActivity.interestScores[interest] || 0) + 12);
    }
    
    // Auteur favori +8
    const authorIdx = newActivity.favoriteAuthors.findIndex(a => a.handle === post.handle);
    if (authorIdx >= 0) {
      newActivity.favoriteAuthors[authorIdx].score += 8;
    } else {
      newActivity.favoriteAuthors.push({ handle: post.handle, score: 8 });
    }
    newActivity.favoriteAuthors.sort((a, b) => b.score - a.score);
    
    saveActivity(newActivity);
  }, [userActivity, saveActivity]);

  // 👁️ Enregistrer une vue (seulement si durée > 3 secondes)
  const recordView = useCallback((post: Post, durationMs: number) => {
    if (!userActivity || durationMs < 3000) return;
    
    // Éviter les doublons récents (moins d'1 minute)
    const recentView = userActivity.viewedPosts.find(v => 
      v.postId === post.id && 
      Date.now() - new Date(v.timestamp).getTime() < 60000
    );
    if (recentView) return;
    
    const detectedInterests = detectInterestsFromText(post.text);
    const newActivity = { ...userActivity };
    
    newActivity.viewedPosts = [
      { postId: post.id, viewDuration: durationMs, timestamp: new Date().toISOString(), detectedInterests },
      ...newActivity.viewedPosts.slice(0, 499),
    ];
    
    // Points basés sur la durée de vue (max +5 points pour 30s+)
    const viewPoints = Math.min(5, Math.floor(durationMs / 6000));
    for (const interest of detectedInterests) {
      newActivity.interestScores[interest] = Math.min(100, (newActivity.interestScores[interest] || 0) + viewPoints);
    }
    
    saveActivity(newActivity);
  }, [userActivity, saveActivity]);

  // 🔍 Enregistrer une recherche
  const recordSearch = useCallback((query: string) => {
    if (!userActivity || !query.trim()) return;
    
    const detectedInterests = detectInterestsFromText(query);
    const newActivity = { ...userActivity };
    
    newActivity.searchHistory = [
      { query: query.toLowerCase().trim(), timestamp: new Date().toISOString(), detectedInterests },
      ...newActivity.searchHistory.slice(0, 49),
    ];
    
    // Les recherches ont un fort impact (+15 points)
    for (const interest of detectedInterests) {
      newActivity.interestScores[interest] = Math.min(100, (newActivity.interestScores[interest] || 0) + 15);
    }
    
    saveActivity(newActivity);
  }, [userActivity, saveActivity]);

  // 📤 Enregistrer un partage
  const recordShare = useCallback((postId: string) => {
    if (!userActivity) return;
    
    const newActivity = { ...userActivity };
    newActivity.sharedPosts = [
      { postId, timestamp: new Date().toISOString() },
      ...newActivity.sharedPosts.slice(0, 49),
    ];
    newActivity.totalInteractions++;
    
    saveActivity(newActivity);
  }, [userActivity, saveActivity]);

  // === ALGORITHME DE SCORING "POUR TOI" ===

  const scorePost = useCallback((post: Post): ScoredPost => {
    if (!userActivity || !currentUser) {
      return { post, score: post.viralityScore, matchReasons: [] };
    }

    let score = 0;
    const matchReasons: string[] = [];
    
    // === 1. MATCH D'INTÉRÊTS (max 40 points) ===
    // Basé sur les préférences choisies + l'historique de likes/commentaires/recherches
    const postInterests = detectInterestsFromText(post.text);
    let interestScore = 0;
    for (const interest of postInterests) {
      interestScore += (userActivity.interestScores[interest] || 0);
    }
    const avgInterestScore = postInterests.length > 0 ? interestScore / postInterests.length : 0;
    const interestPoints = Math.min(40, avgInterestScore * 0.4);
    score += interestPoints;
    if (interestPoints > 20) {
      matchReasons.push("🎯 Pour toi");
    }

    // === 2. AUTEUR FAVORI (max 20 points) ===
    // Basé sur l'historique des likes/commentaires
    const authorFav = userActivity.favoriteAuthors.find(a => a.handle === post.handle);
    const authorPoints = Math.min(20, (authorFav?.score || 0) * 0.8);
    score += authorPoints;
    if (authorPoints > 10) {
      matchReasons.push("❤️ Auteur suivi");
    }

    // === 3. VIRALITÉ (max 15 points) ===
    const viralPoints = Math.min(15, post.viralityScore * 0.15);
    score += viralPoints;
    if (post.viralityScore > 70) {
      matchReasons.push("🔥 Tendance");
    }

    // === 4. FRAÎCHEUR (max 15 points) ===
    const ageHours = (Date.now() - new Date(post.createdAtISO).getTime()) / (1000 * 60 * 60);
    let freshnessPoints = 0;
    if (ageHours < 1) {
      freshnessPoints = 15;
      matchReasons.push("⚡ Nouveau");
    } else if (ageHours < 6) {
      freshnessPoints = 12;
    } else if (ageHours < 24) {
      freshnessPoints = 8;
    } else if (ageHours < 72) {
      freshnessPoints = 4;
    }
    score += freshnessPoints;

    // === 5. ENGAGEMENT DU POST (max 10 points) ===
    const engagementRate = post.views > 0 
      ? ((post.likes + post.comments.length * 2 + post.shares * 3) / post.views) 
      : 0;
    score += Math.min(10, engagementRate * 40);

    // === 6. BONUS FEATURED/PROMOTED ===
    if (post.isFeatured) {
      score += 10;
      matchReasons.push("⭐ Sélection");
    }
    if (post.isPromotedByAdmin) {
      score += (post.promotionPriority || 1) * 5;
    }

    // === 7. MALUS: déjà vu récemment ===
    const recentlyViewed = userActivity.viewedPosts.slice(0, 30).map(v => v.postId);
    if (recentlyViewed.includes(post.id)) {
      score *= 0.5;
    }

    // === 8. MALUS: propre post ===
    if (post.handle === currentUser.handle) {
      score *= 0.3;
    }

    return {
      post,
      score: Math.min(100, Math.round(score)),
      matchReasons: matchReasons.slice(0, 2),
    };
  }, [userActivity, currentUser]);

  // === POSTS RECOMMANDÉS "POUR TOI" ===

  const forYouPosts = useMemo((): ScoredPost[] => {
    if (!currentUser || allPosts.length === 0) return [];

    // Filtrer les posts actifs, non bloqués
    const blockedUsers = currentUser.blockedUsers || [];
    const eligiblePosts = allPosts.filter(p => 
      p.status === "active" && 
      !blockedUsers.includes(p.handle)
    );

    // Scorer tous les posts
    const scored = eligiblePosts.map(post => scorePost(post));

    // Trier par score décroissant
    scored.sort((a, b) => b.score - a.score);

    // Ajouter un peu de diversité: mélanger légèrement le top 10
    const top10 = scored.slice(0, 10);
    const rest = scored.slice(10);
    
    // Shuffle partiel pour la diversité
    for (let i = Math.min(4, top10.length - 1); i > 0; i--) {
      if (Math.random() < 0.4) {
        const j = Math.floor(Math.random() * (i + 1));
        [top10[i], top10[j]] = [top10[j], top10[i]];
      }
    }

    return [...top10, ...rest];
  }, [allPosts, currentUser, scorePost]);

  // === POSTS TENDANCES ===

  const trendingPosts = useMemo((): Post[] => {
    return allPosts
      .filter(p => p.status === "active")
      .sort((a, b) => {
        const scoreA = a.viralityScore * 2 + a.likes + a.comments.length * 3 + (a.peakViewsPerMinute || 0) * 10;
        const scoreB = b.viralityScore * 2 + b.likes + b.comments.length * 3 + (b.peakViewsPerMinute || 0) * 10;
        return scoreB - scoreA;
      })
      .slice(0, 20);
  }, [allPosts]);

  // === STATISTIQUES UTILISATEUR ===

  const userStats = useMemo(() => {
    if (!userActivity) return null;

    // Top 5 intérêts
    const topInterests = (Object.entries(userActivity.interestScores) as [InterestCategory, number][])
      .filter(([_, score]) => score > 10)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([interest, score]) => ({ 
        interest, 
        score: Math.round(score) 
      }));

    return {
      totalLikes: userActivity.likedPosts.length,
      totalComments: userActivity.commentedPosts.length,
      totalViews: userActivity.viewedPosts.length,
      totalSearches: userActivity.searchHistory.length,
      streakDays: userActivity.streakDays,
      topInterests,
      favoriteAuthors: userActivity.favoriteAuthors.slice(0, 5),
      recentSearches: userActivity.searchHistory.slice(0, 5).map(s => s.query),
    };
  }, [userActivity]);

  // === SUGGESTIONS DE RECHERCHE ===

  const searchSuggestions = useMemo(() => {
    if (!userActivity) return [];
    
    const suggestions: string[] = [];
    
    // Ajouter les recherches récentes
    suggestions.push(...userActivity.searchHistory.slice(0, 3).map(s => s.query));
    
    // Ajouter des mots-clés basés sur les top intérêts
    const topInterests = (Object.entries(userActivity.interestScores) as [InterestCategory, number][])
      .filter(([_, score]) => score > 30)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([interest]) => interest);
    
    for (const interest of topInterests) {
      const keywords = INTEREST_KEYWORDS[interest];
      if (keywords) {
        suggestions.push(keywords[Math.floor(Math.random() * 5)]);
      }
    }
    
    return [...new Set(suggestions)].slice(0, 6);
  }, [userActivity]);

  return {
    ready,
    
    // Enregistrement des interactions
    recordLike,
    recordUnlike,
    recordComment,
    recordView,
    recordSearch,
    recordShare,
    
    // Recommandations
    forYouPosts,
    trendingPosts,
    scorePost,
    
    // Stats et suggestions
    userStats,
    searchSuggestions,
    userActivity,
  };
}
