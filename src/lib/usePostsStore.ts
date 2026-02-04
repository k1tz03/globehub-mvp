"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { mockPosts } from "./mockPosts";
import type { Post, PostStatus, Comment, Report, ReportReason, ReportCategory, SocialPlatform } from "./types";

const POSTS_KEY = "globehub_posts_v5";
const REPORTS_KEY = "globehub_reports_v2";
const FEATURED_KEY = "globehub_featured_v1";

function safeParse<T>(json: string | null): T | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// Calculer le score de viralité
function calculateViralityScore(post: Post): number {
  const ageHours = (Date.now() - new Date(post.createdAtISO).getTime()) / (1000 * 60 * 60);
  const decayFactor = Math.max(0.1, 1 - ageHours / 168); // Decay sur 7 jours
  
  const likesScore = post.likes * 2;
  const commentsScore = post.comments.length * 5;
  const sharesScore = (post.shares ?? 0) * 10;
  const viewsScore = (post.views ?? 0) * 0.1;
  
  return Math.round((likesScore + commentsScore + sharesScore + viewsScore) * decayFactor);
}

export function usePostsStore(currentUserHandle?: string) {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [featuredPostId, setFeaturedPostId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Charger les données
  useEffect(() => {
    const existingPosts = safeParse<Post[]>(localStorage.getItem(POSTS_KEY));
    if (existingPosts && existingPosts.length) {
      // Migrer les anciens posts
      const migratedPosts = existingPosts.map((p) => ({
        ...p,
        shares: p.shares ?? 0,
        views: p.views ?? Math.floor(Math.random() * 1000),
        viralityScore: p.viralityScore ?? 0,
      }));
      // Recalculer les scores de viralité
      const withScores = migratedPosts.map((p) => ({
        ...p,
        viralityScore: calculateViralityScore(p),
      }));
      setPosts(withScores);
      localStorage.setItem(POSTS_KEY, JSON.stringify(withScores));
    } else {
      const initialPosts = mockPosts.map((p) => ({
        ...p,
        shares: 0,
        views: Math.floor(Math.random() * 1000),
        viralityScore: calculateViralityScore(p as Post),
      }));
      localStorage.setItem(POSTS_KEY, JSON.stringify(initialPosts));
      setPosts(initialPosts);
    }

    const existingReports = safeParse<Report[]>(localStorage.getItem(REPORTS_KEY));
    if (existingReports) {
      setReports(existingReports);
    }

    const savedFeatured = localStorage.getItem(FEATURED_KEY);
    if (savedFeatured) {
      setFeaturedPostId(savedFeatured);
    }

    setReady(true);
  }, []);

  // Mettre à jour les scores de viralité périodiquement (optimisé)
  useEffect(() => {
    if (!ready || !posts) return;

    const interval = setInterval(() => {
      setPosts((prev) => {
        if (!prev || prev.length === 0) return prev;

        // Ne recalculer que pour les posts récents (dernières 24h)
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        let hasChanges = false;

        const updated = prev.map((p) => {
          const postTime = new Date(p.createdAtISO).getTime();
          if (postTime > oneDayAgo) {
            const newScore = calculateViralityScore(p);
            if (newScore !== p.viralityScore) {
              hasChanges = true;
              return { ...p, viralityScore: newScore };
            }
          }
          return p;
        });

        // Ne sauvegarder que si des changements
        if (hasChanges) {
          localStorage.setItem(POSTS_KEY, JSON.stringify(updated));
          return updated;
        }
        return prev;
      });
    }, 300000); // Toutes les 5 minutes au lieu de 1 minute

    return () => clearInterval(interval);
  }, [ready, posts?.length]); // Dépend seulement de posts.length, pas de posts entier

  // Ajouter un post
  const addPost = useCallback((p: Omit<Post, "shares" | "views" | "viralityScore">) => {
    const newPost: Post = {
      ...p,
      shares: 0,
      views: 0,
      viralityScore: 0,
    };
    setPosts((prev) => {
      const next = [newPost, ...(prev ?? [])];
      localStorage.setItem(POSTS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Toggle like
  const toggleLike = useCallback((postId: string, userHandle: string) => {
    if (!userHandle) return;
    
    setPosts((prev) => {
      if (!prev) return prev;
      const next = prev.map((p) => {
        if (p.id === postId) {
          const likedBy = p.likedBy || [];
          const isLiked = likedBy.includes(userHandle);
          const updated = {
            ...p,
            likedBy: isLiked 
              ? likedBy.filter((h) => h !== userHandle)
              : [...likedBy, userHandle],
            likes: isLiked ? Math.max(0, (p.likes || 0) - 1) : (p.likes || 0) + 1,
          };
          return { ...updated, viralityScore: calculateViralityScore(updated) };
        }
        return p;
      });
      localStorage.setItem(POSTS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Ajouter un commentaire
  const addComment = useCallback((postId: string, text: string, authorId: string, author: string, handle: string) => {
    if (!handle) return;

    const comment: Comment = {
      id: `c_${uid()}`,
      authorId,
      author,
      handle,
      text: text.trim(),
      createdAtISO: new Date().toISOString(),
      likes: 0,
    };

    setPosts((prev) => {
      if (!prev) return prev;
      const next = prev.map((p) => {
        if (p.id === postId) {
          const updated = { ...p, comments: [...p.comments, comment] };
          return { ...updated, viralityScore: calculateViralityScore(updated) };
        }
        return p;
      });
      localStorage.setItem(POSTS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Partager un post
  const sharePost = useCallback((postId: string) => {
    setPosts((prev) => {
      if (!prev) return prev;
      const next = prev.map((p) => {
        if (p.id === postId) {
          const updated = { ...p, shares: (p.shares ?? 0) + 1 };
          return { ...updated, viralityScore: calculateViralityScore(updated) };
        }
        return p;
      });
      localStorage.setItem(POSTS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Incrémenter les vues
  const incrementViews = useCallback((postId: string) => {
    setPosts((prev) => {
      if (!prev) return prev;
      const next = prev.map((p) => {
        if (p.id === postId) {
          return { ...p, views: (p.views ?? 0) + 1 };
        }
        return p;
      });
      localStorage.setItem(POSTS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Supprimer un post (soft delete)
  const deletePost = useCallback((postId: string) => {
    setPosts((prev) => {
      if (!prev) return prev;
      const next = prev.map((p) => {
        if (p.id === postId) {
          return { ...p, status: "deleted" as const };
        }
        return p;
      });
      localStorage.setItem(POSTS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Signaler un post
  const reportPost = useCallback((
    postId: string, 
    reporterId: string, 
    reporterHandle: string,
    reason: ReportReason, 
    details?: string
  ) => {
    const report: Report = {
      id: `r_${uid()}`,
      category: "post",
      targetId: postId,
      reporterId,
      reporterHandle,
      reason,
      details,
      createdAt: new Date().toISOString(),
      status: "pending",
    };

    setReports((prev) => {
      const next = [...prev, report];
      localStorage.setItem(REPORTS_KEY, JSON.stringify(next));
      return next;
    });

    // Incrémenter le compteur de reports
    setPosts((prev) => {
      if (!prev) return prev;
      const next = prev.map((p) => {
        if (p.id === postId) {
          const newReports = (p.reports ?? 0) + 1;
          // Auto-flag si trop de signalements
          if (newReports >= 3) {
            return { 
              ...p, 
              reports: newReports, 
              status: "flagged" as const,
              autoFlagged: true,
              flagReason: `${newReports} signalements`
            };
          }
          return { ...p, reports: newReports };
        }
        return p;
      });
      localStorage.setItem(POSTS_KEY, JSON.stringify(next));
      return next;
    });

    return report;
  }, []);

  // Signaler un utilisateur
  const reportUser = useCallback((
    targetUserId: string,
    reporterId: string,
    reporterHandle: string,
    reason: ReportReason,
    details?: string
  ) => {
    const report: Report = {
      id: `r_${uid()}`,
      category: "user",
      targetId: targetUserId,
      reporterId,
      reporterHandle,
      reason,
      details,
      createdAt: new Date().toISOString(),
      status: "pending",
    };

    setReports((prev) => {
      const next = [...prev, report];
      localStorage.setItem(REPORTS_KEY, JSON.stringify(next));
      return next;
    });

    return report;
  }, []);

  // Modération: changer le statut d'un post
  const moderatePost = useCallback((postId: string, status: PostStatus, moderatorHandle?: string) => {
    setPosts((prev) => {
      if (!prev) return prev;
      const next = prev.map((p): Post => {
        if (p.id === postId) {
          return {
            ...p,
            status,
            moderatedAt: new Date().toISOString(),
            moderatedBy: moderatorHandle || currentUserHandle,
            autoFlagged: false,
          };
        }
        return p;
      });
      localStorage.setItem(POSTS_KEY, JSON.stringify(next));
      return next;
    });
  }, [currentUserHandle]);

  // Résoudre un report
  const resolveReport = useCallback((reportId: string, status: "reviewed" | "dismissed" | "actioned", actionTaken?: string) => {
    setReports((prev) => {
      const next = prev.map((r) => {
        if (r.id === reportId) {
          return { 
            ...r, 
            status, 
            reviewedAt: new Date().toISOString(),
            actionTaken,
          };
        }
        return r;
      });
      localStorage.setItem(REPORTS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Mettre en avant un post (featured)
  const setFeaturedPost = useCallback((postId: string | null, duration?: number) => {
    setFeaturedPostId(postId);
    if (postId) {
      localStorage.setItem(FEATURED_KEY, postId);
      
      // Marquer le post comme featured
      setPosts((prev) => {
        if (!prev) return prev;
        const next = prev.map((p) => {
          if (p.id === postId) {
            return { 
              ...p, 
              isFeatured: true,
              kind: "featured" as const,
              featuredUntil: duration 
                ? new Date(Date.now() + duration * 60 * 60 * 1000).toISOString()
                : undefined
            };
          }
          // Retirer featured des autres
          if (p.isFeatured) {
            return { ...p, isFeatured: false, kind: "normal" as const };
          }
          return p;
        });
        localStorage.setItem(POSTS_KEY, JSON.stringify(next));
        return next;
      });
    } else {
      localStorage.removeItem(FEATURED_KEY);
    }
  }, []);

  // Épingler un post
  const togglePinPost = useCallback((postId: string) => {
    setPosts((prev) => {
      if (!prev) return prev;
      const next = prev.map((p) => {
        if (p.id === postId) {
          return { ...p, isPinned: !p.isPinned };
        }
        return p;
      });
      localStorage.setItem(POSTS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Obtenir les posts d'un utilisateur
  const getPostsByHandle = useCallback((handle: string) => {
    return (posts ?? []).filter((p) => p.handle === handle && p.status !== "deleted");
  }, [posts]);

  // Vérifier si l'utilisateur a liké un post
  const hasLiked = useCallback((postId: string, userHandle: string) => {
    const post = (posts ?? []).find((p) => p.id === postId);
    return (post?.likedBy || []).includes(userHandle);
  }, [posts]);

  // Générer un lien de partage
  const getShareUrl = useCallback((postId: string): string => {
    // En production, ce serait l'URL réelle
    return `https://globehub.app/post/${postId}`;
  }, []);

  // Générer le texte de partage pour les réseaux sociaux
  const getShareText = useCallback((postId: string, platform: SocialPlatform): string => {
    const post = (posts ?? []).find((p) => p.id === postId);
    if (!post) return "";

    const text = post.text.slice(0, 200);
    const url = getShareUrl(postId);
    
    switch (platform) {
      case "twitter":
        return `${text}${text.length >= 200 ? "..." : ""}\n\n🌍 Via @GlobeHub\n${url}`;
      case "facebook":
      case "instagram":
        return `${text}\n\n#GlobeHub #Trending`;
      default:
        return `${text}\n\n${url}`;
    }
  }, [posts, getShareUrl]);

  // Posts visibles
  const visiblePosts = useMemo(() => {
    return (posts ?? []).filter((p) => p.status === "active" || p.status === "flagged");
  }, [posts]);

  // Tous les posts (admin)
  const allPosts = useMemo(() => {
    return (posts ?? []).filter((p) => p.status !== "deleted");
  }, [posts]);

  // Posts tendance
  const trendingPosts = useMemo(() => {
    return visiblePosts
      .filter((p) => p.viralityScore > 10)
      .sort((a, b) => b.viralityScore - a.viralityScore)
      .slice(0, 20);
  }, [visiblePosts]);

  // Posts viraux (pour les popups sur la map)
  const viralPosts = useMemo(() => {
    return visiblePosts
      .filter((p) => p.viralityScore >= 50 && p.lat && p.lon)
      .sort((a, b) => b.viralityScore - a.viralityScore)
      .slice(0, 5);
  }, [visiblePosts]);

  // Post featured actuel
  const featuredPost = useMemo(() => {
    if (!featuredPostId) return null;
    const post = visiblePosts.find((p) => p.id === featuredPostId);
    if (!post) return null;
    
    // Vérifier si la période de featured est expirée
    if (post.featuredUntil && new Date(post.featuredUntil) < new Date()) {
      return null;
    }
    return post;
  }, [featuredPostId, visiblePosts]);

  // Reports en attente
  const pendingReports = useMemo(() => {
    return reports.filter((r) => r.status === "pending");
  }, [reports]);

  // Reports par catégorie
  const reportsByCategory = useMemo(() => {
    return {
      post: reports.filter((r) => r.category === "post"),
      user: reports.filter((r) => r.category === "user"),
      message: reports.filter((r) => r.category === "message"),
    };
  }, [reports]);

  // Alias pour la page admin
  const featurePost = useCallback((postId: string, durationHours: number) => {
    setFeaturedPost(postId, durationHours);
  }, [setFeaturedPost]);

  const removeFeature = useCallback((postId: string) => {
    setPosts((prev) => {
      if (!prev) return prev;
      const next = prev.map((p) => {
        if (p.id === postId) {
          return { ...p, isFeatured: false, kind: "normal" as const, featuredUntil: undefined };
        }
        return p;
      });
      localStorage.setItem(POSTS_KEY, JSON.stringify(next));
      return next;
    });
    if (featuredPostId === postId) {
      setFeaturedPostId(null);
      localStorage.removeItem(FEATURED_KEY);
    }
  }, [featuredPostId]);

  // Promouvoir un post (boost admin)
  const promotePost = useCallback((postId: string, adminHandle: string, boostScore: number = 10) => {
    setPosts((prev) => {
      if (!prev) return prev;
      const next = prev.map((p) => {
        if (p.id === postId) {
          return { 
            ...p, 
            isPromotedByAdmin: true, 
            promotedBy: adminHandle,
            viralityScore: (p.viralityScore || 0) + boostScore * 10,
          };
        }
        return p;
      });
      localStorage.setItem(POSTS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Retirer la promotion d'un post
  const unpromotePost = useCallback((postId: string) => {
    setPosts((prev) => {
      if (!prev) return prev;
      const next = prev.map((p) => {
        if (p.id === postId) {
          return { 
            ...p, 
            isPromotedByAdmin: false, 
            promotedBy: undefined,
            viralityScore: calculateViralityScore(p), // Recalculer le score normal
          };
        }
        return p;
      });
      localStorage.setItem(POSTS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return {
    posts: visiblePosts,
    allPosts,
    trendingPosts,
    viralPosts,
    featuredPost,
    reports,
    pendingReports,
    reportsByCategory,
    ready: posts !== null,
    addPost,
    toggleLike,
    addComment,
    sharePost,
    incrementViews,
    deletePost,
    reportPost,
    reportUser,
    moderatePost,
    resolveReport,
    setFeaturedPost,
    featurePost,
    removeFeature,
    promotePost,
    unpromotePost,
    togglePinPost,
    getPostsByHandle,
    hasLiked,
    getShareUrl,
    getShareText,
  };
}
