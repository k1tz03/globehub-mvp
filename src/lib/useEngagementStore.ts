"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import type { Post, User, InterestCategory, Notification, NotificationType } from "./types";

const ENGAGEMENT_KEY = "globehub_engagement_v1";
const NOTIFICATIONS_KEY = "globehub_notifications_v1";
const VIEW_COUNTER_KEY = "globehub_view_counters_v1";

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function safeParse<T>(json: string | null): T | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

// Mots-clés pour détecter les intérêts dans les posts
const INTEREST_KEYWORDS: Record<InterestCategory, string[]> = {
  music: ["musique", "concert", "album", "chanson", "artiste", "spotify", "festival", "guitar", "piano", "dj"],
  sports: ["football", "basket", "tennis", "match", "équipe", "champion", "coupe", "sport", "jeux olympiques", "goal"],
  travel: ["voyage", "vacances", "plage", "avion", "hotel", "tourisme", "découverte", "pays", "roadtrip", "backpack"],
  food: ["restaurant", "cuisine", "recette", "gastronomie", "chef", "plat", "dessert", "vin", "café", "brunch"],
  tech: ["technologie", "startup", "app", "innovation", "ai", "crypto", "coding", "developer", "smartphone", "gadget"],
  art: ["art", "musée", "exposition", "peinture", "sculpture", "galerie", "artiste", "œuvre", "création", "design"],
  fashion: ["mode", "fashion", "vêtements", "style", "tendance", "outfit", "marque", "luxe", "accessoire", "défilé"],
  gaming: ["jeu", "gaming", "gamer", "console", "playstation", "xbox", "nintendo", "esport", "stream", "twitch"],
  nature: ["nature", "randonnée", "montagne", "forêt", "animaux", "environnement", "écologie", "jardin", "fleurs", "mer"],
  politics: ["politique", "élection", "gouvernement", "président", "loi", "débat", "parti", "vote", "démocratie", "réforme"],
  science: ["science", "recherche", "découverte", "espace", "médecine", "physique", "chimie", "biologie", "astronomie", "nasa"],
  cinema: ["film", "cinéma", "série", "netflix", "acteur", "réalisateur", "oscar", "blockbuster", "streaming", "binge"],
  photography: ["photo", "photographie", "shooting", "portrait", "paysage", "camera", "objectif", "lightroom", "editing", "instagram"],
  fitness: ["fitness", "gym", "musculation", "yoga", "running", "marathon", "workout", "health", "nutrition", "crossfit"],
  business: ["business", "entreprise", "entrepreneur", "startup", "investissement", "finance", "marketing", "carrière", "networking", "linkedin"],
  lifestyle: ["lifestyle", "bien-être", "routine", "morning", "minimalisme", "productivité", "self-care", "motivation", "life", "daily"],
};

// Détecter les intérêts d'un post
export function detectPostInterests(text: string): InterestCategory[] {
  const textLower = text.toLowerCase();
  const detected: InterestCategory[] = [];
  
  for (const [interest, keywords] of Object.entries(INTEREST_KEYWORDS)) {
    for (const keyword of keywords) {
      if (textLower.includes(keyword)) {
        detected.push(interest as InterestCategory);
        break;
      }
    }
  }
  
  return detected;
}

// Calculer le score de pertinence d'un post pour un utilisateur
export function calculateRelevanceScore(post: Post, user: User): number {
  let score = 0;
  const engagement = user.engagement;
  
  // 1. Match avec les intérêts de l'utilisateur (poids: 40%)
  const postInterests = post.detectedInterests || detectPostInterests(post.text);
  const interestMatch = postInterests.filter(i => engagement.interests.includes(i)).length;
  score += (interestMatch / Math.max(1, engagement.interests.length)) * 40;
  
  // 2. Viralité du post (poids: 25%)
  score += Math.min(25, post.viralityScore / 4);
  
  // 3. Engagement rate (poids: 15%)
  const engagementRate = post.views > 0 
    ? ((post.likes + post.comments.length * 2 + post.shares * 3) / post.views) * 100 
    : 0;
  score += Math.min(15, engagementRate * 5);
  
  // 4. Fraîcheur du post (poids: 10%)
  const ageHours = (Date.now() - new Date(post.createdAtISO).getTime()) / (1000 * 60 * 60);
  const freshnessScore = Math.max(0, 10 - (ageHours / 24) * 10);
  score += freshnessScore;
  
  // 5. Historique de l'utilisateur (poids: 10%)
  // Bonus si l'utilisateur a déjà interagi avec des posts similaires
  if (engagement.likedPostIds.some(id => {
    // Simplification: on check si l'auteur est le même
    return false; // À implémenter avec un vrai système de tags
  })) {
    score += 5;
  }
  
  // 6. Préférence de type de contenu
  if (post.media) {
    if (engagement.preferredContentType === "video" && (post.media.type === "video" || post.media.type === "youtube" || post.media.type === "tiktok")) {
      score += 5;
    } else if (engagement.preferredContentType === "image" && post.media.type === "image") {
      score += 5;
    }
  } else if (engagement.preferredContentType === "text") {
    score += 5;
  }
  
  // 7. Bonus pour les posts promus par admin
  if (post.isPromotedByAdmin) {
    score += (post.promotionPriority || 1) * 10;
  }
  
  // 8. Bonus pour les posts featured
  if (post.isFeatured) {
    score += 15;
  }
  
  return Math.min(100, score);
}

// Interface pour le compteur de vues en temps réel
export interface ViewCounter {
  postId: string;
  count: number;
  displayCount: number; // Ce qu'on affiche (animé)
  lastUpdate: string;
  isAnimating: boolean;
}

export function useEngagementStore(currentUser: User | null, allPosts: Post[]) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [viewCounters, setViewCounters] = useState<Record<string, ViewCounter>>({});
  const [ready, setReady] = useState(false);
  
  // Charger les données
  useEffect(() => {
    const savedNotifications = safeParse<Notification[]>(localStorage.getItem(NOTIFICATIONS_KEY));
    if (savedNotifications) {
      setNotifications(savedNotifications);
    }
    
    const savedCounters = safeParse<Record<string, ViewCounter>>(localStorage.getItem(VIEW_COUNTER_KEY));
    if (savedCounters) {
      setViewCounters(savedCounters);
    }
    
    setReady(true);
  }, []);
  
  // Sauvegarder les notifications
  const saveNotifications = useCallback((newNotifications: Notification[]) => {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(newNotifications));
    setNotifications(newNotifications);
  }, []);
  
  // Ajouter une notification
  const addNotification = useCallback((
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    link?: string
  ) => {
    const newNotification: Notification = {
      id: `notif_${uid()}`,
      userId,
      type,
      title,
      message,
      link,
      read: false,
      createdAt: new Date().toISOString(),
    };
    
    const newNotifications = [newNotification, ...notifications].slice(0, 100);
    saveNotifications(newNotifications);
    
    // Trigger browser notification si autorisé
    if (currentUser?.settings.pushNotifications && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(title, { body: message, icon: "/icon.png" });
      }
    }
    
    return newNotification;
  }, [notifications, saveNotifications, currentUser]);
  
  // Marquer comme lu
  const markNotificationAsRead = useCallback((notificationId: string) => {
    const newNotifications = notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    );
    saveNotifications(newNotifications);
  }, [notifications, saveNotifications]);
  
  // Marquer toutes comme lues
  const markAllAsRead = useCallback(() => {
    const newNotifications = notifications.map(n => ({ ...n, read: true }));
    saveNotifications(newNotifications);
  }, [notifications, saveNotifications]);
  
  // Supprimer une notification
  const deleteNotification = useCallback((notificationId: string) => {
    const newNotifications = notifications.filter(n => n.id !== notificationId);
    saveNotifications(newNotifications);
  }, [notifications, saveNotifications]);
  
  // Notifications de l'utilisateur courant
  const userNotifications = useMemo(() => {
    if (!currentUser) return [];
    return notifications.filter(n => n.userId === currentUser.id);
  }, [currentUser, notifications]);
  
  const unreadCount = useMemo(() => {
    return userNotifications.filter(n => !n.read).length;
  }, [userNotifications]);
  
  // === ALGORITHME DE SUGGESTIONS ===
  
  // Posts suggérés pour l'utilisateur
  const suggestedPosts = useMemo(() => {
    if (!currentUser || allPosts.length === 0) return [];
    
    // Filtrer les posts actifs et non bloqués
    const blockedUsers = currentUser.blockedUsers || [];
    const activePosts = allPosts.filter(p => 
      p.status === "active" && 
      !blockedUsers.includes(p.handle)
    );
    
    // Calculer le score pour chaque post
    const scoredPosts = activePosts.map(post => ({
      post,
      score: calculateRelevanceScore(post, currentUser),
    }));
    
    // Trier par score décroissant
    scoredPosts.sort((a, b) => b.score - a.score);
    
    // Retourner les top posts
    return scoredPosts.map(sp => sp.post);
  }, [currentUser, allPosts]);
  
  // Posts pour le défilement automatique (variété de contenu)
  const autoScrollPosts = useMemo(() => {
    if (!currentUser || suggestedPosts.length === 0) return [];
    
    const result: Post[] = [];
    const textPosts = suggestedPosts.filter(p => !p.media);
    const imagePosts = suggestedPosts.filter(p => p.media?.type === "image");
    const videoPosts = suggestedPosts.filter(p => 
      p.media?.type === "video" || p.media?.type === "youtube" || p.media?.type === "tiktok"
    );
    
    // Alterner les types de contenu (2 text, 1 image, 1 video, repeat)
    let textIdx = 0, imageIdx = 0, videoIdx = 0;
    
    for (let i = 0; i < 20; i++) {
      const cycle = i % 4;
      
      if (cycle < 2 && textIdx < textPosts.length) {
        result.push(textPosts[textIdx++]);
      } else if (cycle === 2 && imageIdx < imagePosts.length) {
        result.push(imagePosts[imageIdx++]);
      } else if (cycle === 3 && videoIdx < videoPosts.length) {
        result.push(videoPosts[videoIdx++]);
      } else {
        // Fallback: prendre n'importe quel post disponible
        const remaining = suggestedPosts.filter(p => !result.includes(p));
        if (remaining.length > 0) {
          result.push(remaining[0]);
        }
      }
    }
    
    return result;
  }, [currentUser, suggestedPosts]);
  
  // Posts tendances (tous utilisateurs)
  const trendingPosts = useMemo(() => {
    return allPosts
      .filter(p => p.status === "active")
      .sort((a, b) => {
        // Score composite: viralité + engagement récent
        const scoreA = a.viralityScore + (a.peakViewsPerMinute || 0) * 10;
        const scoreB = b.viralityScore + (b.peakViewsPerMinute || 0) * 10;
        return scoreB - scoreA;
      })
      .slice(0, 50);
  }, [allPosts]);
  
  // === COMPTEUR DE VUES EN TEMPS RÉEL ===
  
  // Incrémenter les vues d'un post (avec animation)
  const incrementViews = useCallback((postId: string, amount: number = 1) => {
    setViewCounters(prev => {
      const current = prev[postId] || { 
        postId, 
        count: 0, 
        displayCount: 0, 
        lastUpdate: new Date().toISOString(),
        isAnimating: false 
      };
      
      const newCounter: ViewCounter = {
        ...current,
        count: current.count + amount,
        lastUpdate: new Date().toISOString(),
        isAnimating: true,
      };
      
      const newCounters = { ...prev, [postId]: newCounter };
      localStorage.setItem(VIEW_COUNTER_KEY, JSON.stringify(newCounters));
      return newCounters;
    });
  }, []);
  
  // Mettre à jour le display count (pour l'animation)
  const updateDisplayCount = useCallback((postId: string, displayCount: number) => {
    setViewCounters(prev => {
      const current = prev[postId];
      if (!current) return prev;
      
      return {
        ...prev,
        [postId]: {
          ...current,
          displayCount,
          isAnimating: displayCount < current.count,
        },
      };
    });
  }, []);
  
  // Simuler des vues en temps réel pour les posts de l'utilisateur
  useEffect(() => {
    if (!currentUser) return;
    
    const userPosts = allPosts.filter(p => p.handle === currentUser.handle);
    if (userPosts.length === 0) return;
    
    // Simuler des vues entrantes
    const interval = setInterval(() => {
      userPosts.forEach(post => {
        // Plus le post est viral, plus il reçoit de vues
        const baseChance = 0.3 + (post.viralityScore / 100) * 0.5;
        if (Math.random() < baseChance) {
          const viewsToAdd = 1 + Math.floor(Math.random() * (post.viralityScore / 20));
          incrementViews(post.id, viewsToAdd);
        }
      });
    }, 2000);
    
    return () => clearInterval(interval);
  }, [currentUser, allPosts, incrementViews]);
  
  // Enregistrer une interaction (pour l'historique)
  const recordInteraction = useCallback((
    type: "view" | "like" | "comment" | "search",
    data: { postId?: string; query?: string }
  ) => {
    if (!currentUser) return;
    
    // Cette fonction met à jour l'engagement de l'utilisateur
    // En pratique, ça devrait être fait via useAuthStore
    const engagement = currentUser.engagement;
    
    if (type === "view" && data.postId) {
      if (!engagement.viewedPostIds.includes(data.postId)) {
        engagement.viewedPostIds.push(data.postId);
        if (engagement.viewedPostIds.length > 200) {
          engagement.viewedPostIds = engagement.viewedPostIds.slice(-200);
        }
      }
    }
    
    if (type === "search" && data.query) {
      engagement.searchHistory.unshift(data.query);
      if (engagement.searchHistory.length > 50) {
        engagement.searchHistory = engagement.searchHistory.slice(0, 50);
      }
    }
    
    engagement.lastActiveAt = new Date().toISOString();
  }, [currentUser]);
  
  // Demander la permission pour les notifications
  const requestNotificationPermission = useCallback(async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
    return false;
  }, []);
  
  return {
    // Notifications
    notifications: userNotifications,
    unreadCount,
    addNotification,
    markNotificationAsRead,
    markAllAsRead,
    deleteNotification,
    requestNotificationPermission,
    
    // Suggestions
    suggestedPosts,
    autoScrollPosts,
    trendingPosts,
    
    // Compteurs de vues
    viewCounters,
    incrementViews,
    updateDisplayCount,
    
    // Interactions
    recordInteraction,
    
    ready,
  };
}

// Hook pour l'animation du compteur
export function useAnimatedCounter(targetValue: number, duration: number = 1000) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    if (targetValue === displayValue) return;
    
    const startValue = displayValue;
    const difference = targetValue - startValue;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = Math.round(startValue + difference * easeOut);
      setDisplayValue(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [targetValue, duration, displayValue]);
  
  return displayValue;
}

// Formater un grand nombre
export function formatViewCount(count: number): string {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + "M";
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + "K";
  }
  return count.toString();
}
