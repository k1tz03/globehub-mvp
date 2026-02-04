"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { clsx } from "clsx";
import type { Post, User, InterestCategory } from "@/lib/types";
import { INTEREST_LABELS } from "@/lib/types";
import { ScoredPost } from "@/lib/useRecommendationStore";

interface ForYouSectionProps {
  forYouPosts: ScoredPost[];
  userStats: {
    totalLikes: number;
    totalComments: number;
    totalViews: number;
    streakDays: number;
    topInterests: { interest: InterestCategory; score: number }[];
    favoriteAuthors: { handle: string; score: number }[];
    recentSearches: string[];
  } | null;
  currentUser: User | null;
  onPostClick?: (post: Post) => void;
  onLike?: (post: Post) => void;
  onComment?: (post: Post) => void;
}

export function ForYouSection({
  forYouPosts,
  userStats,
  currentUser,
  onPostClick,
  onLike,
  onComment,
}: ForYouSectionProps) {
  const [showStats, setShowStats] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Ne montrer que les top 10 posts
  const topPosts = useMemo(() => forYouPosts.slice(0, 10), [forYouPosts]);

  if (!currentUser || topPosts.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-fuchsia-500/10 via-purple-500/10 to-amber-500/10 dark:from-fuchsia-500/5 dark:via-purple-500/5 dark:to-amber-500/5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-fuchsia-200/30 px-4 py-3 dark:border-fuchsia-800/30">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-amber-500 text-lg text-white shadow-lg shadow-fuchsia-500/30">
            ✨
          </div>
          <div>
            <h3 className="font-bold text-neutral-900 dark:text-white">Pour toi</h3>
            <p className="text-xs text-neutral-500">Basé sur tes intérêts</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowStats(!showStats)}
          className={clsx(
            "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
            showStats 
              ? "bg-fuchsia-500 text-white" 
              : "bg-white/50 text-neutral-600 hover:bg-white dark:bg-neutral-800/50 dark:text-neutral-400"
          )}
        >
          {showStats ? "Masquer stats" : "📊 Voir pourquoi"}
        </button>
      </div>

      {/* Stats Panel */}
      {showStats && userStats && (
        <div className="border-b border-fuchsia-200/30 bg-white/50 px-4 py-4 dark:border-fuchsia-800/30 dark:bg-neutral-900/50">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Top intérêts */}
            <div>
              <h4 className="mb-2 text-xs font-bold text-neutral-500">🎯 Tes intérêts</h4>
              <div className="flex flex-wrap gap-1.5">
                {userStats.topInterests.slice(0, 5).map((item) => (
                  <span
                    key={item.interest}
                    className="inline-flex items-center gap-1 rounded-full bg-fuchsia-100 px-2 py-0.5 text-xs font-medium text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400"
                  >
                    {INTEREST_LABELS[item.interest].split(" ")[0]}
                    <span className="text-fuchsia-400">{item.score}%</span>
                  </span>
                ))}
                {userStats.topInterests.length === 0 && (
                  <span className="text-xs text-neutral-400">Interagis pour personnaliser</span>
                )}
              </div>
            </div>
            
            {/* Auteurs favoris */}
            <div>
              <h4 className="mb-2 text-xs font-bold text-neutral-500">❤️ Auteurs favoris</h4>
              <div className="flex flex-wrap gap-1.5">
                {userStats.favoriteAuthors.slice(0, 3).map((author) => (
                  <span
                    key={author.handle}
                    className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  >
                    @{author.handle}
                  </span>
                ))}
                {userStats.favoriteAuthors.length === 0 && (
                  <span className="text-xs text-neutral-400">Like des posts pour voir</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Streak */}
          {userStats.streakDays > 1 && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-3 py-2">
              <span className="text-lg">🔥</span>
              <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                {userStats.streakDays} jours consécutifs !
              </span>
            </div>
          )}
        </div>
      )}

      {/* Posts horizontaux */}
      <div 
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto px-4 py-4 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {topPosts.map((scoredPost, idx) => (
          <ForYouCard
            key={scoredPost.post.id}
            scoredPost={scoredPost}
            index={idx}
            onClick={() => onPostClick?.(scoredPost.post)}
            onLike={() => onLike?.(scoredPost.post)}
            onComment={() => onComment?.(scoredPost.post)}
          />
        ))}
      </div>
    </div>
  );
}

// Carte de post recommandé
function ForYouCard({
  scoredPost,
  index,
  onClick,
  onLike,
  onComment,
}: {
  scoredPost: ScoredPost;
  index: number;
  onClick?: () => void;
  onLike?: () => void;
  onComment?: () => void;
}) {
  const { post, score, matchReasons } = scoredPost;
  const [isHovered, setIsHovered] = useState(false);

  // Tronquer le texte
  const truncatedText = post.text.length > 100 
    ? post.text.slice(0, 100) + "..." 
    : post.text;

  // Couleur du badge de score
  const scoreColor = score >= 70 
    ? "from-emerald-500 to-teal-500" 
    : score >= 50 
      ? "from-fuchsia-500 to-purple-500" 
      : "from-amber-500 to-orange-500";

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={clsx(
        "group relative flex-shrink-0 w-64 cursor-pointer rounded-xl border bg-white p-4 transition-all duration-200",
        "hover:shadow-lg hover:shadow-fuchsia-500/10 hover:-translate-y-1",
        "dark:bg-neutral-900 dark:border-neutral-800",
        isHovered ? "border-fuchsia-300 dark:border-fuchsia-700" : "border-neutral-200"
      )}
    >
      {/* Badge de position */}
      {index < 3 && (
        <div className={clsx(
          "absolute -top-2 -left-2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white shadow-lg",
          index === 0 ? "bg-gradient-to-br from-amber-400 to-amber-600" :
          index === 1 ? "bg-gradient-to-br from-neutral-300 to-neutral-500" :
          "bg-gradient-to-br from-amber-600 to-amber-800"
        )}>
          {index + 1}
        </div>
      )}

      {/* Score badge */}
      <div className={clsx(
        "absolute -top-2 -right-2 rounded-full bg-gradient-to-r px-2 py-0.5 text-xs font-bold text-white shadow-lg",
        scoreColor
      )}>
        {score}%
      </div>

      {/* Header - Avatar et nom */}
      <div className="mb-3 flex items-center gap-2">
        <div className="h-8 w-8 overflow-hidden rounded-full bg-gradient-to-br from-fuchsia-500/20 to-amber-500/20">
          {post.avatar ? (
            <img src={post.avatar} alt={post.author} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-bold text-fuchsia-600">
              {post.author[0].toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-neutral-900 dark:text-white">
            {post.author}
          </p>
          <p className="truncate text-xs text-neutral-500">@{post.handle}</p>
        </div>
      </div>

      {/* Contenu */}
      <p className="mb-3 text-sm text-neutral-700 dark:text-neutral-300 line-clamp-3">
        {truncatedText}
      </p>

      {/* Image miniature */}
      {post.media?.type === "image" && (
        <div className="mb-3 h-24 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
          <img 
            src={post.media.url} 
            alt="" 
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}

      {/* Raisons du match */}
      {matchReasons.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {matchReasons.map((reason, i) => (
            <span
              key={i}
              className="rounded-full bg-fuchsia-50 px-2 py-0.5 text-xs font-medium text-fuchsia-600 dark:bg-fuchsia-900/30 dark:text-fuchsia-400"
            >
              {reason}
            </span>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-neutral-500">
        <button
          onClick={(e) => { e.stopPropagation(); onLike?.(); }}
          className="flex items-center gap-1 transition-colors hover:text-rose-500"
        >
          <span>❤️</span>
          <span>{post.likes}</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onComment?.(); }}
          className="flex items-center gap-1 transition-colors hover:text-fuchsia-500"
        >
          <span>💬</span>
          <span>{post.comments.length}</span>
        </button>
        <span className="flex items-center gap-1">
          <span>👁️</span>
          <span>{post.views}</span>
        </span>
      </div>

      {/* Hover overlay */}
      {isHovered && (
        <div className="absolute inset-x-0 bottom-0 h-1 rounded-b-xl bg-gradient-to-r from-fuchsia-500 via-purple-500 to-amber-500" />
      )}
    </div>
  );
}

// Bannière de bienvenue pour les nouveaux utilisateurs
export function WelcomeForYouBanner({ 
  userInterests,
  onDismiss 
}: { 
  userInterests: InterestCategory[];
  onDismiss: () => void;
}) {
  return (
    <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-fuchsia-500 to-amber-500 p-6 text-white shadow-xl shadow-fuchsia-500/20">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold">🎉 Bienvenue sur ton feed personnalisé !</h3>
          <p className="mt-2 text-sm text-white/80">
            On a noté tes centres d'intérêt :
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {userInterests.map((interest) => (
              <span
                key={interest}
                className="rounded-full bg-white/20 px-3 py-1 text-sm font-medium backdrop-blur-sm"
              >
                {INTEREST_LABELS[interest]}
              </span>
            ))}
          </div>
          <p className="mt-4 text-sm text-white/80">
            Plus tu interagis (likes, commentaires, recherches), plus tes suggestions seront pertinentes !
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Mini widget de profil d'intérêts
export function InterestProfileWidget({
  userStats,
}: {
  userStats: {
    topInterests: { interest: InterestCategory; score: number }[];
    streakDays: number;
    totalLikes: number;
    totalComments: number;
  } | null;
}) {
  if (!userStats) return null;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <h4 className="mb-3 text-sm font-bold text-neutral-900 dark:text-white">
        📊 Ton profil d'intérêts
      </h4>
      
      {/* Barres de progression */}
      <div className="space-y-2">
        {userStats.topInterests.slice(0, 5).map((item) => (
          <div key={item.interest}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-neutral-600 dark:text-neutral-400">
                {INTEREST_LABELS[item.interest]}
              </span>
              <span className="font-medium text-fuchsia-600">{item.score}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-amber-500 transition-all duration-500"
                style={{ width: `${item.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-neutral-100 pt-4 dark:border-neutral-800">
        <div className="text-center">
          <p className="text-lg font-bold text-fuchsia-600">{userStats.totalLikes}</p>
          <p className="text-xs text-neutral-500">Likes</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-purple-600">{userStats.totalComments}</p>
          <p className="text-xs text-neutral-500">Comments</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-amber-600">{userStats.streakDays}🔥</p>
          <p className="text-xs text-neutral-500">Streak</p>
        </div>
      </div>
    </div>
  );
}
