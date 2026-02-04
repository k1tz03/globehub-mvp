"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { useAuthStore } from "@/lib/useAuthStore";
import { usePostsStore } from "@/lib/usePostsStore";
import { useStatsStore } from "@/lib/useStatsStore";
import { useReportsStore } from "@/lib/useReportsStore";
import { useGroupsStore } from "@/lib/useGroupsStore";
import { timeAgo } from "@/lib/time";
import type { Post, PostStatus, Report, ModerationRule } from "@/lib/types";
import { GROUP_VISIBILITY_LABELS, GROUP_ROLE_LABELS } from "@/lib/types";

type AdminTab = "dashboard" | "realtime" | "analytics" | "moderation" | "automod" | "reports" | "trending" | "searches" | "users" | "logs" | "groups";

// === SYSTÈME DE VEILLE H24 - MOTS CLÉS TENDANCIEUX ===
const SUSPICIOUS_KEYWORDS = {
  high: ["terrorisme", "attentat", "bombe", "tuer", "mort", "suicide", "arme", "drogue", "dealer", "cocaine", "héroïne", "pédophile", "nazi", "hitler"],
  medium: ["arnaque", "scam", "gratuit", "gagnez", "cliquez", "urgent", "violence", "haine", "nude", "xxx", "porn", "sexe", "crypto", "bitcoin"],
  low: ["viagra", "casino", "loterie", "promo", "offre", "réduction", "spam", "pub"],
};

// Patterns regex pour la détection
const SUSPICIOUS_PATTERNS = [
  { pattern: /bit\.ly|tinyurl|t\.co/gi, reason: "Liens raccourcis", score: 15 },
  { pattern: /\b(g[a4]gn[e3]r|gr[a4]tuit|cl[i1]qu[e3]z)\b/gi, reason: "Spam/Phishing", score: 25 },
  { pattern: /(.)\1{5,}/g, reason: "Caractères répétés", score: 10 },
  { pattern: /[A-Z]{10,}/g, reason: "Majuscules excessives", score: 15 },
  { pattern: /\d{10,}/g, reason: "Numéros suspects", score: 10 },
  { pattern: /(whatsapp|telegram|signal)\s*:?\s*\+?\d/gi, reason: "Contact externe", score: 20 },
];

// Analyser un post pour détecter du contenu tendancieux
function analyzePostContent(text: string): { score: number; reasons: string[]; severity: "low" | "medium" | "high" | "critical" } {
  const textLower = text.toLowerCase();
  const reasons: string[] = [];
  let score = 0;

  // Vérifier les mots clés par niveau de sévérité
  for (const keyword of SUSPICIOUS_KEYWORDS.high) {
    if (textLower.includes(keyword)) {
      score += 40;
      reasons.push(`🔴 "${keyword}"`);
    }
  }
  for (const keyword of SUSPICIOUS_KEYWORDS.medium) {
    if (textLower.includes(keyword)) {
      score += 25;
      reasons.push(`🟠 "${keyword}"`);
    }
  }
  for (const keyword of SUSPICIOUS_KEYWORDS.low) {
    if (textLower.includes(keyword)) {
      score += 10;
      reasons.push(`🟡 "${keyword}"`);
    }
  }

  // Vérifier les patterns regex
  for (const { pattern, reason, score: patternScore } of SUSPICIOUS_PATTERNS) {
    if (pattern.test(text)) {
      score += patternScore;
      reasons.push(reason);
    }
  }

  // Vérifier les liens externes multiples
  const linkCount = (text.match(/https?:\/\//g) || []).length;
  if (linkCount > 3) {
    score += 15;
    reasons.push(`${linkCount} liens externes`);
  }

  // Vérifier les emojis excessifs
  const emojiCount = (text.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  if (emojiCount > 15) {
    score += 10;
    reasons.push(`${emojiCount} emojis`);
  }

  // Déterminer la sévérité
  let severity: "low" | "medium" | "high" | "critical" = "low";
  if (score >= 80) severity = "critical";
  else if (score >= 50) severity = "high";
  else if (score >= 30) severity = "medium";

  return { score: Math.min(100, score), reasons, severity };
}

// === COMPOSANT PRINCIPAL ===
export default function AdminPage() {
  const router = useRouter();
  const { currentUser, users, ready: authReady, isModerator, isAdmin, toggleBan, changeRole } = useAuthStore();
  const { posts, ready: postsReady, moderatePost, featurePost, removeFeature, promotePost, unpromotePost } = usePostsStore(currentUser?.handle);
  const { 
    dailyStats, liveStats, searches, bgEvents, modRules, modLogs, aggregatedStats, ready: statsReady,
    addBgEvent, updateBgEvent, deleteBgEvent, addModRule, updateModRule, deleteModRule, addModLog,
  } = useStatsStore();
  const { reports, pendingReports, stats: reportStats, reviewReport, ready: reportsReady } = useReportsStore();
  const { 
    groups, messages: groupMessages, flaggedMessages, groupsWithAlerts, 
    banGroup, unbanGroup, approveMessage, deleteGroupMessage,
    ready: groupsReady 
  } = useGroupsStore(currentUser?.handle);

  // États
  const [tab, setTab] = useState<AdminTab>("dashboard");
  const [liveTime, setLiveTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PostStatus | "all">("all");
  const [autoModEnabled, setAutoModEnabled] = useState(true);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<"1h" | "24h" | "7d" | "30d">("24h");
  const [realtimeData, setRealtimeData] = useState<{ time: string; users: number; posts: number }[]>([]);

  // Mise à jour temps réel chaque seconde
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setLiveTime(now);
      
      // Simuler des données temps réel pour le graphique
      setRealtimeData(prev => {
        const newData = [...prev, {
          time: now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
          users: liveStats.onlineUsers + Math.floor(Math.random() * 10 - 5),
          posts: Math.floor(Math.random() * 5),
        }].slice(-60); // Garder les 60 dernières minutes
        return newData;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [liveStats.onlineUsers]);

  // === ANALYSES ET CALCULS ===
  
  // Veille H24 - Posts suspects
  const suspiciousPosts = useMemo(() => {
    return posts
      .filter(p => p.status === "active")
      .map(p => ({ ...p, analysis: analyzePostContent(p.text) }))
      .filter(p => p.analysis.score >= 20)
      .sort((a, b) => b.analysis.score - a.analysis.score);
  }, [posts]);

  // Posts flaggés
  const flaggedPosts = useMemo(() => {
    return posts.filter(p => p.status === "flagged" || (p.reports && p.reports > 0));
  }, [posts]);

  // Posts trending
  const trendingPosts = useMemo(() => {
    return [...posts]
      .filter(p => p.status === "active")
      .sort((a, b) => b.viralityScore - a.viralityScore)
      .slice(0, 30);
  }, [posts]);

  // Posts filtrés pour la modération
  const filteredPosts = useMemo(() => {
    let result = [...posts];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.text.toLowerCase().includes(q) || 
        p.handle.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      result = result.filter(p => p.status === statusFilter);
    }
    return result.sort((a, b) => new Date(b.createdAtISO).getTime() - new Date(a.createdAtISO).getTime());
  }, [posts, searchQuery, statusFilter]);

  // Stats horaires
  const todayHourlyStats = useMemo(() => {
    const today = dailyStats[dailyStats.length - 1];
    return today?.hourlyBreakdown || [];
  }, [dailyStats]);

  // Stats par minute (dernière heure)
  const minuteStats = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => ({
      minute: i,
      visitors: Math.floor(liveStats.onlineUsers * (0.8 + Math.random() * 0.4)),
      posts: Math.floor(Math.random() * 3),
    }));
  }, [liveStats.onlineUsers]);

  // Logs de modération récents
  const recentModLogs = useMemo(() => {
    return modLogs.slice(0, 50);
  }, [modLogs]);

  // Auto-modération
  const handleAutoModerate = useCallback((post: Post & { analysis: ReturnType<typeof analyzePostContent> }, action: PostStatus) => {
    moderatePost(post.id, action);
    addModLog({
      postId: post.id,
      action: action === "hidden" ? "Masqué" : action === "deleted" ? "Supprimé" : "Approuvé",
      reason: `Veille H24 - Score: ${post.analysis.score}% - ${post.analysis.reasons.join(", ")}`,
      moderatorHandle: currentUser?.handle,
      isAutomatic: false,
    });
  }, [moderatePost, addModLog, currentUser?.handle]);

  // Loading
  if (!authReady || !postsReady || !statsReady || !reportsReady || !groupsReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100 dark:bg-neutral-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-fuchsia-500 border-t-transparent" />
          <p className="text-sm text-neutral-500">Chargement du centre de contrôle...</p>
        </div>
      </div>
    );
  }

  // Accès refusé
  if (!isModerator) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100 dark:bg-neutral-950">
        <div className="rounded-2xl bg-white p-8 text-center shadow-xl dark:bg-neutral-900">
          <div className="text-5xl">🔒</div>
          <h1 className="mt-4 text-xl font-bold">Accès restreint</h1>
          <p className="mt-2 text-sm text-neutral-500">Zone réservée aux administrateurs et modérateurs.</p>
          <button onClick={() => router.push("/")} className="mt-4 rounded-xl bg-fuchsia-500 px-6 py-3 text-sm font-medium text-white">
            Retour à l&apos;accueil
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: "dashboard" as const, label: "Dashboard", icon: "📊" },
    { key: "realtime" as const, label: "Temps réel", icon: "⚡" },
    { key: "analytics" as const, label: "Analytics", icon: "📈" },
    { key: "moderation" as const, label: "Modération", icon: "🛡️", badge: flaggedPosts.length },
    { key: "automod" as const, label: "Veille H24", icon: "🤖", badge: suspiciousPosts.filter(p => p.analysis.severity !== "low").length },
    { key: "reports" as const, label: "Signalements", icon: "🚩", badge: pendingReports.length },
    { key: "groups" as const, label: "Groupes", icon: "👥", badge: flaggedMessages.length },
    { key: "trending" as const, label: "Tendances", icon: "🔥" },
    { key: "searches" as const, label: "Recherches", icon: "🔍" },
    { key: "users" as const, label: "Utilisateurs", icon: "👥" },
    { key: "logs" as const, label: "Logs", icon: "📋" },
  ];

  return (
    <div className="min-h-screen overflow-y-auto bg-neutral-100 dark:bg-neutral-950">
      {/* === HEADER STICKY === */}
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-900/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/")} className="rounded-xl p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold">Centre de contrôle</h1>
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <span>{liveTime.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</span>
                <span className="font-mono">{liveTime.toLocaleTimeString("fr-FR")}</span>
              </div>
            </div>
            <span className={clsx(
              "rounded-full px-3 py-1 text-xs font-bold",
              isAdmin ? "bg-gradient-to-r from-rose-500 to-fuchsia-500 text-white" : "bg-sky-100 text-sky-700"
            )}>
              {isAdmin ? "👑 Admin" : "🛡️ Mod"}
            </span>
          </div>
          
          {/* Stats live header */}
          <div className="flex items-center gap-4">
            <LiveIndicator value={liveStats.onlineUsers} label="en ligne" color="emerald" pulse />
            <LiveIndicator value={liveStats.postsLastHour} label="posts/h" color="amber" />
            {pendingReports.length > 0 && (
              <button onClick={() => setTab("reports")} className="flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-sm font-medium text-rose-700 hover:bg-rose-200">
                🚩 {pendingReports.length}
              </button>
            )}
            {suspiciousPosts.filter(p => p.analysis.severity === "critical").length > 0 && (
              <button onClick={() => setTab("automod")} className="flex items-center gap-1 rounded-full bg-rose-500 px-3 py-1 text-sm font-bold text-white animate-pulse">
                ⚠️ {suspiciousPosts.filter(p => p.analysis.severity === "critical").length} critiques
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={clsx(
                  "relative flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-all",
                  tab === t.key
                    ? "bg-gradient-to-r from-fuchsia-500 to-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/30"
                    : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                )}
              >
                <span>{t.icon}</span>
                <span className="hidden sm:inline">{t.label}</span>
                {t.badge !== undefined && t.badge > 0 && (
                  <span className={clsx(
                    "flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-xs font-bold",
                    tab === t.key ? "bg-white/30" : "bg-rose-500 text-white"
                  )}>
                    {t.badge > 99 ? "99+" : t.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* === CONTENU PRINCIPAL === */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        
        {/* === DASHBOARD === */}
        {tab === "dashboard" && (
          <div className="space-y-6">
            {/* Alertes */}
            {(suspiciousPosts.filter(p => p.analysis.severity !== "low").length > 0 || pendingReports.length > 0) && (
              <div className={clsx(
                "rounded-2xl border-2 p-4",
                suspiciousPosts.some(p => p.analysis.severity === "critical")
                  ? "border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/30"
                  : "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{suspiciousPosts.some(p => p.analysis.severity === "critical") ? "🚨" : "⚠️"}</span>
                    <div>
                      <h3 className="font-bold">Attention requise</h3>
                      <p className="text-sm opacity-80">
                        {suspiciousPosts.filter(p => p.analysis.severity === "critical").length > 0 && 
                          `${suspiciousPosts.filter(p => p.analysis.severity === "critical").length} posts critiques. `}
                        {suspiciousPosts.filter(p => p.analysis.severity === "high").length > 0 && 
                          `${suspiciousPosts.filter(p => p.analysis.severity === "high").length} posts à risque. `}
                        {pendingReports.length > 0 && `${pendingReports.length} signalements.`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setTab("automod")} className="rounded-xl bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-neutral-50">
                      Voir la veille
                    </button>
                    <button onClick={() => setTab("reports")} className="rounded-xl bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-neutral-50">
                      Signalements
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Stats principales */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Utilisateurs en ligne" value={liveStats.onlineUsers} icon="👥" color="emerald" live />
              <StatCard title="Visiteurs (24h)" value={aggregatedStats.today?.visitors || 0} icon="👁️" color="sky" trend={12} />
              <StatCard title="Posts créés (24h)" value={aggregatedStats.today?.postsCreated || 0} icon="📝" color="fuchsia" trend={8} />
              <StatCard 
                title="Signalements" 
                value={pendingReports.length} 
                icon="🚩" 
                color={pendingReports.length > 5 ? "rose" : "amber"} 
                alert={pendingReports.length > 10}
                onClick={() => setTab("reports")}
              />
            </div>

            {/* Graphiques */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-bold">📊 Activité par heure</h3>
                  <span className="text-xs text-neutral-500">
                    Peak: {Math.max(...todayHourlyStats.map(h => h.visitors), 0)} visiteurs
                  </span>
                </div>
                <div className="h-48">
                  <HourlyChart data={todayHourlyStats} currentHour={liveTime.getHours()} />
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-bold">📈 Évolution 7 jours</h3>
                  <div className="flex gap-2">
                    {["visitors", "posts", "likes"].map((metric) => (
                      <span key={metric} className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs dark:bg-neutral-800">
                        {metric}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="h-48">
                  <WeeklyChart data={dailyStats.slice(-7)} />
                </div>
              </div>
            </div>

            {/* Stats détaillées */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <MiniStat title="Nouveaux users (7j)" value={aggregatedStats.last7Days.totalVisitors} icon="🆕" />
              <MiniStat title="Posts (7j)" value={aggregatedStats.last7Days.totalPosts} icon="📝" />
              <MiniStat title="Likes (7j)" value={aggregatedStats.last7Days.totalLikes} icon="❤️" />
              <MiniStat title="Conversations" value={liveStats.activeConversations} icon="💬" />
              <MiniStat title="Total users" value={users.length} icon="👥" />
            </div>

            {/* Modules avancés DSA/RGPD */}
            <div className="rounded-2xl bg-gradient-to-r from-fuchsia-500/10 to-amber-500/10 p-6 dark:from-fuchsia-900/20 dark:to-amber-900/20">
              <h3 className="mb-4 font-bold flex items-center gap-2">
                ⚖️ Conformité DSA & RGPD
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">Activé</span>
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <a href="/admin/privacy" className="rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition-shadow dark:bg-neutral-900">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🔐</span>
                    <div>
                      <p className="font-medium">RGPD</p>
                      <p className="text-xs text-neutral-500">Droits utilisateurs</p>
                    </div>
                  </div>
                </a>
                <a href="/admin/appeals" className="rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition-shadow dark:bg-neutral-900">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⚖️</span>
                    <div>
                      <p className="font-medium">Appels DSA</p>
                      <p className="text-xs text-neutral-500">Contestations</p>
                    </div>
                  </div>
                </a>
                <a href="/admin/transparency" className="rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition-shadow dark:bg-neutral-900">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📋</span>
                    <div>
                      <p className="font-medium">Transparence</p>
                      <p className="text-xs text-neutral-500">Rapports publics</p>
                    </div>
                  </div>
                </a>
                <a href="/admin/urgent-alerts" className="rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition-shadow dark:bg-neutral-900">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🚨</span>
                    <div>
                      <p className="font-medium">Alertes urgentes</p>
                      <p className="text-xs text-neutral-500">Contenus critiques</p>
                    </div>
                  </div>
                </a>
                <a href="/admin/ai-moderation" className="rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition-shadow dark:bg-neutral-900">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🤖</span>
                    <div>
                      <p className="font-medium">IA Modération</p>
                      <p className="text-xs text-neutral-500">Classification auto</p>
                    </div>
                  </div>
                </a>
                <a href="/admin/automation" className="rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition-shadow dark:bg-neutral-900">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⚡</span>
                    <div>
                      <p className="font-medium">Automatisation</p>
                      <p className="text-xs text-neutral-500">Règles & webhooks</p>
                    </div>
                  </div>
                </a>
                <a href="/admin/moderation-queue" className="rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition-shadow dark:bg-neutral-900">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🛡️</span>
                    <div>
                      <p className="font-medium">File modération</p>
                      <p className="text-xs text-neutral-500">Queue avancée & SLA</p>
                    </div>
                  </div>
                </a>
                <a href="/admin/analytics" className="rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition-shadow dark:bg-neutral-900">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📊</span>
                    <div>
                      <p className="font-medium">Analytics avancés</p>
                      <p className="text-xs text-neutral-500">Rétention & funnels</p>
                    </div>
                  </div>
                </a>
              </div>
            </div>

            {/* Quick actions + top recherches */}
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
                <h3 className="mb-4 font-bold">⚡ Actions rapides</h3>
                <div className="space-y-2">
                  <button onClick={() => setTab("moderation")} className="w-full rounded-xl bg-neutral-50 px-4 py-3 text-left text-sm hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700">
                    🛡️ Modérer les posts ({filteredPosts.length})
                  </button>
                  <button onClick={() => setTab("automod")} className="w-full rounded-xl bg-neutral-50 px-4 py-3 text-left text-sm hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700">
                    🤖 Veille automatique ({suspiciousPosts.length} suspects)
                  </button>
                  <button onClick={() => setTab("reports")} className="w-full rounded-xl bg-neutral-50 px-4 py-3 text-left text-sm hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700">
                    🚩 Traiter signalements ({pendingReports.length})
                  </button>
                  <button onClick={() => setTab("trending")} className="w-full rounded-xl bg-neutral-50 px-4 py-3 text-left text-sm hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700">
                    🔥 Promouvoir tendances
                  </button>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
                <h3 className="mb-4 font-bold">🔍 Top recherches</h3>
                <div className="space-y-2">
                  {searches.slice(0, 6).map((s, i) => (
                    <div key={s.query} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={clsx(
                          "flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold",
                          i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-neutral-200" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-neutral-100"
                        )}>{i + 1}</span>
                        <span className="text-sm">{s.query}</span>
                      </div>
                      <span className="text-xs text-neutral-500">{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
                <h3 className="mb-4 font-bold">🔥 Top posts viraux</h3>
                <div className="space-y-2">
                  {trendingPosts.slice(0, 4).map((post, i) => (
                    <div key={post.id} className="rounded-lg bg-neutral-50 p-2 dark:bg-neutral-800">
                      <p className="truncate text-sm">{post.text}</p>
                      <div className="mt-1 flex items-center justify-between text-xs text-neutral-500">
                        <span>@{post.handle}</span>
                        <span className="font-bold text-fuchsia-500">{post.viralityScore}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === TEMPS RÉEL === */}
        {tab === "realtime" && (
          <div className="space-y-6">
            {/* Live stats banner */}
            <div className="rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-6 text-white">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">📡 Monitoring temps réel</h2>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
                  </span>
                  <span className="font-mono text-emerald-400">LIVE</span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <LiveStatBox title="Connectés maintenant" value={liveStats.onlineUsers} icon="👥" trend={`+${Math.floor(Math.random() * 5)}`} />
                <LiveStatBox title="Posts cette heure" value={liveStats.postsLastHour} icon="📝" trend={`+${Math.floor(Math.random() * 3)}`} />
                <LiveStatBox title="Conversations actives" value={liveStats.activeConversations} icon="💬" />
                <LiveStatBox title="Peak aujourd'hui" value={liveStats.peakToday} icon="📈" time={`à ${Math.floor(Math.random() * 12) + 8}h`} />
              </div>
            </div>

            {/* Graphique temps réel par minute */}
            <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold">⏱️ Activité par minute (dernière heure)</h3>
                <div className="flex gap-2">
                  {["1h", "24h", "7d", "30d"].map((p) => (
                    <button
                      key={p}
                      onClick={() => setSelectedPeriod(p as typeof selectedPeriod)}
                      className={clsx(
                        "rounded-lg px-3 py-1 text-xs font-medium transition-colors",
                        selectedPeriod === p ? "bg-fuchsia-500 text-white" : "bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-64">
                <MinuteChart data={minuteStats} />
              </div>
            </div>

            {/* Flux d'activité en direct */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
                <h3 className="mb-4 font-bold">🆕 Derniers posts (temps réel)</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {posts.slice(0, 10).map((post) => (
                    <div key={post.id} className="flex items-start gap-3 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500/20 to-amber-500/20 text-sm font-bold">
                        {post.author.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{post.author}</span>
                          <span className="text-xs text-neutral-400">{timeAgo(post.createdAtISO)}</span>
                        </div>
                        <p className="text-sm truncate">{post.text}</p>
                      </div>
                      <div className="text-xs text-neutral-500">
                        ❤️ {post.likes}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
                <h3 className="mb-4 font-bold">🌍 Répartition géographique</h3>
                <div className="space-y-2">
                  {[
                    { country: "🇫🇷 France", percent: 45, users: Math.floor(liveStats.onlineUsers * 0.45) },
                    { country: "🇧🇪 Belgique", percent: 15, users: Math.floor(liveStats.onlineUsers * 0.15) },
                    { country: "🇨🇭 Suisse", percent: 12, users: Math.floor(liveStats.onlineUsers * 0.12) },
                    { country: "🇨🇦 Canada", percent: 10, users: Math.floor(liveStats.onlineUsers * 0.10) },
                    { country: "🌍 Autres", percent: 18, users: Math.floor(liveStats.onlineUsers * 0.18) },
                  ].map((item) => (
                    <div key={item.country} className="flex items-center gap-3">
                      <span className="w-24 text-sm">{item.country}</span>
                      <div className="flex-1 h-2 rounded-full bg-neutral-100 dark:bg-neutral-800">
                        <div className="h-full rounded-full bg-fuchsia-500" style={{ width: `${item.percent}%` }} />
                      </div>
                      <span className="text-xs text-neutral-500 w-16 text-right">{item.users} users</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === ANALYTICS === */}
        {tab === "analytics" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Pages vues (30j)" value={aggregatedStats.last30Days.totalVisitors * 3} icon="👁️" color="sky" />
              <StatCard title="Nouveaux users (30j)" value={aggregatedStats.last30Days.totalNewUsers} icon="🆕" color="emerald" />
              <StatCard title="Posts créés (30j)" value={aggregatedStats.last30Days.totalPosts} icon="📝" color="fuchsia" />
              <StatCard title="Taux engagement" value={Math.round((aggregatedStats.last7Days.totalLikes / Math.max(1, aggregatedStats.last7Days.totalPosts)) * 10)} icon="💫" color="amber" suffix="%" />
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
              <h3 className="mb-4 font-bold">📊 Évolution sur 30 jours</h3>
              <div className="h-72">
                <MonthlyChart data={dailyStats.slice(-30)} />
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
                <h3 className="mb-4 font-bold">📱 Sources de trafic</h3>
                <div className="space-y-3">
                  {[
                    { source: "Direct", percent: 40, color: "bg-fuchsia-500" },
                    { source: "Recherche", percent: 25, color: "bg-sky-500" },
                    { source: "Réseaux sociaux", percent: 20, color: "bg-amber-500" },
                    { source: "Référents", percent: 10, color: "bg-emerald-500" },
                    { source: "Autres", percent: 5, color: "bg-neutral-400" },
                  ].map((item) => (
                    <div key={item.source} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{item.source}</span>
                        <span className="font-medium">{item.percent}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-800">
                        <div className={clsx("h-full rounded-full", item.color)} style={{ width: `${item.percent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
                <h3 className="mb-4 font-bold">⏰ Heures de pointe</h3>
                <div className="grid grid-cols-6 gap-2">
                  {todayHourlyStats.map((h) => (
                    <div key={h.hour} className="text-center">
                      <div
                        className="mx-auto mb-1 w-full rounded bg-fuchsia-500"
                        style={{ height: `${Math.max(8, (h.visitors / Math.max(...todayHourlyStats.map(x => x.visitors), 1)) * 80)}px` }}
                      />
                      <span className="text-[10px] text-neutral-500">{h.hour}h</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === MODÉRATION === */}
        {tab === "moderation" && (
          <div className="space-y-6">
            {/* Filtres */}
            <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-900">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="🔍 Rechercher par texte, @pseudo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm outline-none focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-neutral-700 dark:bg-neutral-800"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as PostStatus | "all")}
                className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
              >
                <option value="all">Tous ({posts.length})</option>
                <option value="active">✅ Actifs ({posts.filter(p => p.status === "active").length})</option>
                <option value="flagged">🚩 Signalés ({posts.filter(p => p.status === "flagged").length})</option>
                <option value="hidden">🔒 Masqués ({posts.filter(p => p.status === "hidden").length})</option>
                <option value="deleted">🗑️ Supprimés ({posts.filter(p => p.status === "deleted").length})</option>
              </select>
            </div>

            {/* Liste des posts */}
            <div className="space-y-3">
              {filteredPosts.slice(0, 50).map((post) => (
                <PostModerationCard
                  key={post.id}
                  post={post}
                  onModerate={(status) => {
                    moderatePost(post.id, status);
                    addModLog({
                      postId: post.id,
                      action: status,
                      reason: "Modération manuelle",
                      moderatorHandle: currentUser?.handle,
                      isAutomatic: false,
                    });
                  }}
                  onFeature={() => featurePost(post.id, 24)}
                  onUnfeature={() => removeFeature(post.id)}
                  onPromote={() => promotePost(post.id, currentUser?.handle || "", 10)}
                  onUnpromote={() => unpromotePost(post.id)}
                />
              ))}
              {filteredPosts.length === 0 && (
                <div className="rounded-2xl bg-white p-12 text-center shadow-sm dark:bg-neutral-900">
                  <span className="text-4xl">🔍</span>
                  <p className="mt-2 text-neutral-500">Aucun post trouvé</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* === VEILLE H24 === */}
        {tab === "automod" && (
          <div className="space-y-6">
            {/* Header veille */}
            <div className="flex items-center justify-between rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
              <div>
                <h2 className="text-lg font-bold">🤖 Veille automatique H24</h2>
                <p className="text-sm text-neutral-500">Détection automatique des contenus tendancieux et problématiques</p>
              </div>
              <div className="flex items-center gap-4">
                <span className={clsx("text-sm", autoModEnabled ? "text-emerald-600" : "text-neutral-400")}>
                  {autoModEnabled ? "✅ Active" : "⏸️ Désactivée"}
                </span>
                <button
                  onClick={() => setAutoModEnabled(!autoModEnabled)}
                  className={clsx(
                    "relative h-7 w-14 rounded-full transition-colors",
                    autoModEnabled ? "bg-emerald-500" : "bg-neutral-300 dark:bg-neutral-700"
                  )}
                >
                  <span className={clsx(
                    "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform",
                    autoModEnabled ? "left-[30px]" : "left-0.5"
                  )} />
                </button>
              </div>
            </div>

            {/* Stats veille */}
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="rounded-2xl bg-rose-50 p-4 text-center dark:bg-rose-950/30">
                <p className="text-3xl font-bold text-rose-600">{suspiciousPosts.filter(p => p.analysis.severity === "critical").length}</p>
                <p className="text-sm text-rose-700">🔴 Critiques</p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-4 text-center dark:bg-amber-950/30">
                <p className="text-3xl font-bold text-amber-600">{suspiciousPosts.filter(p => p.analysis.severity === "high").length}</p>
                <p className="text-sm text-amber-700">🟠 Risque élevé</p>
              </div>
              <div className="rounded-2xl bg-yellow-50 p-4 text-center dark:bg-yellow-950/30">
                <p className="text-3xl font-bold text-yellow-600">{suspiciousPosts.filter(p => p.analysis.severity === "medium").length}</p>
                <p className="text-sm text-yellow-700">🟡 Moyen</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4 text-center dark:bg-emerald-950/30">
                <p className="text-3xl font-bold text-emerald-600">{modLogs.filter(l => l.isAutomatic).length}</p>
                <p className="text-sm text-emerald-700">✅ Actions (24h)</p>
              </div>
            </div>

            {/* Posts suspects */}
            <div className="rounded-2xl bg-white shadow-sm dark:bg-neutral-900">
              <div className="border-b border-neutral-100 p-4 dark:border-neutral-800">
                <h3 className="font-bold">⚠️ Posts détectés ({suspiciousPosts.length})</h3>
              </div>
              
              {suspiciousPosts.length === 0 ? (
                <div className="p-12 text-center">
                  <span className="text-5xl">✅</span>
                  <p className="mt-4 text-lg font-medium">Aucun contenu suspect détecté</p>
                  <p className="text-sm text-neutral-500">La veille automatique n&apos;a détecté aucun contenu problématique</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {suspiciousPosts.map((post) => (
                    <div key={post.id} className={clsx(
                      "p-4",
                      post.analysis.severity === "critical" && "bg-rose-50/50 dark:bg-rose-950/20",
                      post.analysis.severity === "high" && "bg-amber-50/50 dark:bg-amber-950/20"
                    )}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{post.author}</span>
                            <span className="text-xs text-neutral-500">@{post.handle}</span>
                            <span className={clsx(
                              "rounded-full px-2 py-0.5 text-xs font-bold",
                              post.analysis.severity === "critical" && "bg-rose-500 text-white",
                              post.analysis.severity === "high" && "bg-amber-500 text-white",
                              post.analysis.severity === "medium" && "bg-yellow-400 text-yellow-900",
                              post.analysis.severity === "low" && "bg-neutral-200 text-neutral-700"
                            )}>
                              Score: {post.analysis.score}%
                            </span>
                            <span className="text-xs text-neutral-400">{timeAgo(post.createdAtISO)}</span>
                          </div>
                          <p className="mt-2 text-sm">{post.text}</p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {post.analysis.reasons.map((reason, i) => (
                              <span key={i} className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs dark:bg-neutral-800">
                                {reason}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="ml-4 flex flex-col gap-1">
                          <button
                            onClick={() => handleAutoModerate(post, "active")}
                            className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-200"
                          >
                            ✅ OK
                          </button>
                          <button
                            onClick={() => handleAutoModerate(post, "hidden")}
                            className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-200"
                          >
                            🔒 Masquer
                          </button>
                          <button
                            onClick={() => handleAutoModerate(post, "deleted")}
                            className="rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-200"
                          >
                            🗑️ Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Règles de modération */}
            <div className="rounded-2xl bg-white shadow-sm dark:bg-neutral-900">
              <div className="flex items-center justify-between border-b border-neutral-100 p-4 dark:border-neutral-800">
                <h3 className="font-bold">📋 Règles de détection actives</h3>
                <button
                  onClick={() => setShowRuleModal(true)}
                  className="rounded-lg bg-fuchsia-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-fuchsia-600"
                >
                  + Ajouter
                </button>
              </div>
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {modRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateModRule(rule.id, { isActive: !rule.isActive })}
                        className={clsx(
                          "relative h-5 w-9 rounded-full transition-colors",
                          rule.isActive ? "bg-emerald-500" : "bg-neutral-300"
                        )}
                      >
                        <span className={clsx(
                          "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                          rule.isActive ? "left-[18px]" : "left-0.5"
                        )} />
                      </button>
                      <div>
                        <p className="font-medium">{rule.name}</p>
                        <p className="text-xs text-neutral-500">{rule.type}: {rule.pattern}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={clsx(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        rule.severity === "high" ? "bg-rose-100 text-rose-700" :
                        rule.severity === "medium" ? "bg-amber-100 text-amber-700" :
                        "bg-neutral-100 text-neutral-600"
                      )}>
                        {rule.severity}
                      </span>
                      <span className="text-xs text-neutral-500">{rule.triggeredCount}x</span>
                      <button onClick={() => deleteModRule(rule.id)} className="text-rose-500 hover:text-rose-700">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* === SIGNALEMENTS === */}
        {tab === "reports" && (
          <div className="space-y-6">
            {/* Stats signalements */}
            <div className="grid gap-4 sm:grid-cols-5">
              <div className="rounded-2xl bg-rose-50 p-4 text-center dark:bg-rose-950/30">
                <p className="text-2xl font-bold text-rose-600">{reportStats.pending}</p>
                <p className="text-sm text-rose-700">⏳ En attente</p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-4 text-center dark:bg-amber-950/30">
                <p className="text-2xl font-bold text-amber-600">{reportStats.reviewed}</p>
                <p className="text-sm text-amber-700">👁️ Examinés</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4 text-center dark:bg-emerald-950/30">
                <p className="text-2xl font-bold text-emerald-600">{reportStats.actioned}</p>
                <p className="text-sm text-emerald-700">⚡ Actions</p>
              </div>
              <div className="rounded-2xl bg-neutral-50 p-4 text-center dark:bg-neutral-800">
                <p className="text-2xl font-bold text-neutral-600">{reportStats.dismissed}</p>
                <p className="text-sm text-neutral-500">❌ Rejetés</p>
              </div>
              <div className="rounded-2xl bg-sky-50 p-4 text-center dark:bg-sky-950/30">
                <p className="text-2xl font-bold text-sky-600">{reportStats.todayCount}</p>
                <p className="text-sm text-sky-700">📅 Aujourd&apos;hui</p>
              </div>
            </div>

            {/* Liste des signalements */}
            <div className="rounded-2xl bg-white shadow-sm dark:bg-neutral-900">
              <div className="border-b border-neutral-100 p-4 dark:border-neutral-800">
                <h3 className="font-bold">🚩 Signalements ({reports.length})</h3>
              </div>
              
              {reports.length === 0 ? (
                <div className="p-12 text-center">
                  <span className="text-5xl">✅</span>
                  <p className="mt-4 font-medium">Aucun signalement</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {reports.map((report) => {
                    const post = posts.find(p => p.id === report.targetId);
                    return (
                      <div key={report.id} className={clsx(
                        "p-4",
                        report.status === "pending" && "bg-rose-50/30 dark:bg-rose-950/10"
                      )}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className={clsx(
                                "rounded-full px-2 py-0.5 text-xs font-medium",
                                report.status === "pending" && "bg-rose-100 text-rose-700",
                                report.status === "reviewed" && "bg-sky-100 text-sky-700",
                                report.status === "actioned" && "bg-emerald-100 text-emerald-700",
                                report.status === "dismissed" && "bg-neutral-100 text-neutral-600"
                              )}>
                                {report.status === "pending" ? "⏳ En attente" : 
                                 report.status === "reviewed" ? "👁️ Examiné" :
                                 report.status === "actioned" ? "⚡ Action prise" : "❌ Rejeté"}
                              </span>
                              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs dark:bg-neutral-800">
                                {report.category}
                              </span>
                              <span className="text-xs text-neutral-400">{timeAgo(report.createdAt)}</span>
                            </div>
                            <p className="mt-2 text-sm">
                              <span className="font-medium">Raison:</span> {report.reason}
                            </p>
                            {report.details && <p className="text-xs text-neutral-500">{report.details}</p>}
                            {post && (
                              <div className="mt-2 rounded-lg bg-neutral-50 p-2 dark:bg-neutral-800">
                                <p className="text-xs text-neutral-500">Contenu signalé:</p>
                                <p className="text-sm line-clamp-2">{post.text}</p>
                                <p className="text-xs text-neutral-400">par @{post.handle}</p>
                              </div>
                            )}
                            {report.actionTaken && (
                              <p className="mt-2 text-xs text-emerald-600">✅ {report.actionTaken}</p>
                            )}
                          </div>
                          {report.status === "pending" && (
                            <div className="ml-4 flex flex-col gap-1">
                              <button
                                onClick={() => {
                                  if (report.targetId) moderatePost(report.targetId, "hidden");
                                  reviewReport(report.id, currentUser?.handle || "", "actioned", "Post masqué");
                                }}
                                className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-700"
                              >
                                🔒 Masquer
                              </button>
                              <button
                                onClick={() => {
                                  if (report.targetId) moderatePost(report.targetId, "deleted");
                                  reviewReport(report.id, currentUser?.handle || "", "actioned", "Post supprimé");
                                }}
                                className="rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-medium text-rose-700"
                              >
                                🗑️ Supprimer
                              </button>
                              <button
                                onClick={() => reviewReport(report.id, currentUser?.handle || "", "dismissed")}
                                className="rounded-lg bg-neutral-100 px-3 py-1.5 text-xs text-neutral-600"
                              >
                                ❌ Rejeter
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* === TENDANCES === */}
        {tab === "trending" && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-gradient-to-r from-fuchsia-500 to-amber-500 p-6 text-white">
              <h2 className="text-xl font-bold">🔥 Gestion des tendances</h2>
              <p className="text-sm text-white/80">Promouvoir manuellement les meilleurs posts pour augmenter l&apos;engagement</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {trendingPosts.map((post, i) => (
                <div key={post.id} className="rounded-xl bg-white p-4 shadow-sm dark:bg-neutral-900">
                  <div className="flex items-center justify-between mb-3">
                    <span className={clsx(
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                      i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-neutral-200" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-neutral-100"
                    )}>
                      #{i + 1}
                    </span>
                    <span className="text-lg font-bold text-fuchsia-500">{post.viralityScore}%</span>
                  </div>
                  <p className="text-sm line-clamp-3">{post.text}</p>
                  <p className="mt-2 text-xs text-neutral-500">@{post.handle}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex gap-3 text-xs text-neutral-500">
                      <span>❤️ {post.likes}</span>
                      <span>👁️ {post.views}</span>
                    </div>
                    <button
                      onClick={() => post.isPromotedByAdmin ? unpromotePost(post.id) : promotePost(post.id, currentUser?.handle || "", i + 1)}
                      className={clsx(
                        "rounded-lg px-3 py-1 text-xs font-medium",
                        post.isPromotedByAdmin ? "bg-neutral-100 text-neutral-600" : "bg-fuchsia-100 text-fuchsia-700"
                      )}
                    >
                      {post.isPromotedByAdmin ? "📌 Promu" : "📌 Promouvoir"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === RECHERCHES === */}
        {tab === "searches" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <MiniStat title="Total recherches" value={searches.reduce((s, x) => s + x.count, 0)} icon="🔍" />
              <MiniStat title="Termes uniques" value={searches.length} icon="📝" />
              <MiniStat title="Top recherche" value={searches[0]?.count || 0} icon="🏆" />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
                <h3 className="mb-4 font-bold">📊 Top 25 recherches</h3>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {searches.slice(0, 25).map((s, i) => (
                    <div key={s.query} className="flex items-center gap-3 rounded-lg bg-neutral-50 p-2 dark:bg-neutral-800">
                      <span className={clsx(
                        "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                        i < 3 ? "bg-fuchsia-100 text-fuchsia-700" : "bg-neutral-200"
                      )}>{i + 1}</span>
                      <span className="flex-1 text-sm">{s.query}</span>
                      <div className="w-32 h-2 rounded-full bg-neutral-200">
                        <div className="h-full rounded-full bg-fuchsia-500" style={{ width: `${(s.count / (searches[0]?.count || 1)) * 100}%` }} />
                      </div>
                      <span className="text-xs font-medium w-12 text-right">{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
                <h3 className="mb-4 font-bold">☁️ Nuage de mots</h3>
                <div className="flex flex-wrap gap-2 justify-center">
                  {searches.slice(0, 40).map((s) => (
                    <span
                      key={s.query}
                      className="rounded-full bg-gradient-to-r from-fuchsia-100 to-amber-100 px-3 py-1 dark:from-fuchsia-950/50 dark:to-amber-950/50"
                      style={{ fontSize: `${Math.max(11, Math.min(22, 10 + s.count / 8))}px` }}
                    >
                      {s.query}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === UTILISATEURS === */}
        {tab === "users" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-5">
              <MiniStat title="Total" value={users.length} icon="👥" />
              <MiniStat title="Admins" value={users.filter(u => u.role === "admin").length} icon="👑" />
              <MiniStat title="Modérateurs" value={users.filter(u => u.role === "moderator").length} icon="🛡️" />
              <MiniStat title="Vérifiés" value={users.filter(u => u.isVerified).length} icon="✅" />
              <MiniStat title="Bannis" value={users.filter(u => u.isBanned).length} icon="🚫" />
            </div>

            <div className="rounded-2xl bg-white shadow-sm dark:bg-neutral-900">
              <div className="border-b border-neutral-100 p-4 dark:border-neutral-800">
                <h3 className="font-bold">👥 Gestion des utilisateurs</h3>
              </div>
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500/20 to-amber-500/20 font-bold">
                        {user.avatar ? <img src={user.avatar} alt="" className="h-full w-full rounded-full object-cover" /> : user.username.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{user.username}</span>
                          <span className={clsx(
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            user.role === "admin" ? "bg-rose-100 text-rose-700" : user.role === "moderator" ? "bg-sky-100 text-sky-700" : "bg-neutral-100"
                          )}>
                            {user.role}
                          </span>
                          {user.isBanned && <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-bold text-white">BANNI</span>}
                          {user.isVerified && <span>✅</span>}
                        </div>
                        <p className="text-xs text-neutral-500">@{user.handle} • {user.email}</p>
                      </div>
                    </div>
                    {isAdmin && user.handle !== currentUser?.handle && (
                      <div className="flex items-center gap-2">
                        <select
                          value={user.role}
                          onChange={(e) => changeRole(user.handle, e.target.value as "user" | "moderator" | "admin")}
                          className="rounded-lg border border-neutral-200 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                        >
                          <option value="user">User</option>
                          <option value="moderator">Mod</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          onClick={() => toggleBan(user.handle)}
                          className={clsx("rounded-lg px-3 py-1.5 text-sm font-medium", user.isBanned ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}
                        >
                          {user.isBanned ? "Débannir" : "Bannir"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* === LOGS === */}
        {tab === "logs" && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-white shadow-sm dark:bg-neutral-900">
              <div className="border-b border-neutral-100 p-4 dark:border-neutral-800">
                <h3 className="font-bold">📋 Logs de modération ({recentModLogs.length})</h3>
              </div>
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800 max-h-[600px] overflow-y-auto">
                {recentModLogs.length === 0 ? (
                  <div className="p-12 text-center">
                    <span className="text-4xl">📋</span>
                    <p className="mt-2 text-neutral-500">Aucun log de modération</p>
                  </div>
                ) : (
                  recentModLogs.map((log) => (
                    <div key={log.id} className="flex items-center gap-4 p-3">
                      <span className={clsx(
                        "flex h-8 w-8 items-center justify-center rounded-full text-sm",
                        log.isAutomatic ? "bg-sky-100 text-sky-700" : "bg-fuchsia-100 text-fuchsia-700"
                      )}>
                        {log.isAutomatic ? "🤖" : "👤"}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{log.action}</span>
                          {log.moderatorHandle && <span className="text-neutral-500"> par @{log.moderatorHandle}</span>}
                        </p>
                        <p className="text-xs text-neutral-500">{log.reason}</p>
                      </div>
                      <span className="text-xs text-neutral-400">{timeAgo(log.timestamp)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* === GROUPES === */}
        {tab === "groups" && (
          <div className="space-y-6">
            {/* Stats groupes */}
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-900">
                <p className="text-2xl font-bold text-fuchsia-600">{groups.length}</p>
                <p className="text-sm text-neutral-500">Groupes total</p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-900">
                <p className="text-2xl font-bold text-emerald-600">{groups.filter(g => g.visibility === "public").length}</p>
                <p className="text-sm text-neutral-500">Publics</p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-900">
                <p className="text-2xl font-bold text-amber-600">{groups.reduce((sum, g) => sum + g.memberCount, 0)}</p>
                <p className="text-sm text-neutral-500">Membres total</p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-900">
                <p className="text-2xl font-bold text-rose-600">{flaggedMessages.length}</p>
                <p className="text-sm text-neutral-500">Messages signalés</p>
              </div>
            </div>

            {/* Messages flaggés */}
            {flaggedMessages.length > 0 && (
              <div className="rounded-2xl bg-rose-50 p-6 dark:bg-rose-950/30">
                <h3 className="mb-4 font-bold text-rose-700">⚠️ Messages à vérifier ({flaggedMessages.length})</h3>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {flaggedMessages.map((msg) => {
                    const group = groups.find(g => g.id === msg.groupId);
                    return (
                      <div key={msg.id} className="rounded-xl bg-white p-4 shadow-sm dark:bg-neutral-900">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">@{msg.senderHandle}</span>
                              <span className="text-xs text-neutral-500">dans {group?.name}</span>
                            </div>
                            <p className="mt-1 text-sm text-rose-700">{msg.text}</p>
                            <p className="mt-1 text-xs text-rose-500">{msg.flagReason}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => approveMessage(msg.id)}
                              className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-200"
                            >
                              ✅ OK
                            </button>
                            <button
                              onClick={() => deleteGroupMessage(msg.id)}
                              className="rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-200"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Liste des groupes */}
            <div className="rounded-2xl bg-white shadow-sm dark:bg-neutral-900">
              <div className="border-b border-neutral-100 p-4 dark:border-neutral-800">
                <h3 className="font-bold">👥 Tous les groupes</h3>
              </div>
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {groups.length === 0 ? (
                  <div className="p-12 text-center">
                    <span className="text-4xl">👥</span>
                    <p className="mt-2 text-neutral-500">Aucun groupe</p>
                  </div>
                ) : (
                  groups.map((group) => (
                    <div key={group.id} className={clsx(
                      "p-4",
                      group.isBanned && "bg-rose-50 dark:bg-rose-950/20"
                    )}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{group.name}</span>
                            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs dark:bg-neutral-800">
                              {GROUP_VISIBILITY_LABELS[group.visibility]}
                            </span>
                            {group.isBanned && (
                              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs text-rose-700">
                                BANNI
                              </span>
                            )}
                            {(group.flaggedMessagesCount || 0) > 0 && (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                                ⚠️ {group.flaggedMessagesCount}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-neutral-500 line-clamp-1">{group.description}</p>
                          <div className="mt-2 flex flex-wrap gap-4 text-xs text-neutral-500">
                            <span>👥 {group.memberCount} membres</span>
                            <span>💬 {group.totalMessages} messages</span>
                            <span>📝 {group.totalPosts} posts</span>
                            <span>Créé le {new Date(group.createdAt).toLocaleDateString("fr-FR")}</span>
                            <span>Actif {timeAgo(group.lastActivityAt)}</span>
                          </div>
                          
                          {/* Membres avec rôles */}
                          <div className="mt-2 flex flex-wrap gap-1">
                            {group.members.slice(0, 5).map((m) => (
                              <span
                                key={m.userHandle}
                                className={clsx(
                                  "rounded-full px-2 py-0.5 text-xs",
                                  m.role === "owner" && "bg-amber-100 text-amber-700",
                                  m.role === "admin" && "bg-fuchsia-100 text-fuchsia-700",
                                  m.role === "moderator" && "bg-sky-100 text-sky-700",
                                  m.role === "member" && "bg-neutral-100 text-neutral-600"
                                )}
                              >
                                @{m.userHandle}
                              </span>
                            ))}
                            {group.members.length > 5 && (
                              <span className="text-xs text-neutral-400">+{group.members.length - 5}</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <a
                            href={`/groups/${group.id}`}
                            className="rounded-lg bg-fuchsia-100 px-3 py-1.5 text-xs font-medium text-fuchsia-700 hover:bg-fuchsia-200"
                          >
                            Voir
                          </a>
                          {group.isBanned ? (
                            <button
                              onClick={() => unbanGroup(group.id)}
                              className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-200"
                            >
                              Débannir
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                const reason = prompt("Raison du ban:");
                                if (reason) banGroup(group.id, reason);
                              }}
                              className="rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-200"
                            >
                              Bannir
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// === COMPOSANTS AUXILIAIRES ===

function LiveIndicator({ value, label, color, pulse }: { value: number; label: string; color: string; pulse?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full bg-${color}-400 opacity-75`} />
          <span className={`relative inline-flex h-2 w-2 rounded-full bg-${color}-500`} />
        </span>
      )}
      <span className={`text-sm font-bold text-${color}-600`}>{value}</span>
      <span className="text-xs text-neutral-500">{label}</span>
    </div>
  );
}

function StatCard({ title, value, icon, color, trend, live, alert, suffix, onClick }: {
  title: string; value: number; icon: string; color: string; trend?: number; live?: boolean; alert?: boolean; suffix?: string; onClick?: () => void;
}) {
  return (
    <div 
      onClick={onClick}
      className={clsx(
        "rounded-2xl p-6 shadow-sm transition-all",
        alert ? "bg-rose-50 ring-2 ring-rose-300 dark:bg-rose-950/30" : "bg-white dark:bg-neutral-900",
        onClick && "cursor-pointer hover:shadow-md"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <div className="flex items-center gap-2">
          {live && (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
          )}
          {trend !== undefined && (
            <span className={clsx("text-xs font-medium", trend > 0 ? "text-emerald-600" : "text-rose-600")}>
              {trend > 0 ? "+" : ""}{trend}%
            </span>
          )}
        </div>
      </div>
      <p className="mt-3 text-3xl font-bold">{value.toLocaleString()}{suffix}</p>
      <p className="text-sm text-neutral-500">{title}</p>
    </div>
  );
}

function MiniStat({ title, value, icon }: { title: string; value: number | string; icon: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-900">
      <div className="flex items-center gap-2">
        <span>{icon}</span>
        <span className="text-xs text-neutral-500">{title}</span>
      </div>
      <p className="mt-1 text-2xl font-bold">{typeof value === "number" ? value.toLocaleString() : value}</p>
    </div>
  );
}

function LiveStatBox({ title, value, icon, trend, time }: { title: string; value: number; icon: string; trend?: string; time?: string }) {
  return (
    <div className="rounded-xl bg-white/10 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xl">{icon}</span>
        {trend && <span className="text-xs text-emerald-400">{trend}</span>}
        {time && <span className="text-xs text-white/60">{time}</span>}
      </div>
      <p className="mt-2 text-2xl font-bold">{value.toLocaleString()}</p>
      <p className="text-xs text-white/60">{title}</p>
    </div>
  );
}

function HourlyChart({ data, currentHour }: { data: { hour: number; visitors: number }[]; currentHour: number }) {
  const max = Math.max(...data.map(d => d.visitors), 1);
  return (
    <div className="flex h-full items-end gap-1">
      {data.map((d) => (
        <div key={d.hour} className="flex-1 flex flex-col items-center">
          <div
            className={clsx("w-full rounded-t transition-all", d.hour === currentHour ? "bg-fuchsia-500" : "bg-fuchsia-200 dark:bg-fuchsia-900/50")}
            style={{ height: `${(d.visitors / max) * 100}%`, minHeight: "4px" }}
            title={`${d.hour}h: ${d.visitors}`}
          />
          {d.hour % 4 === 0 && <span className="mt-1 text-[10px] text-neutral-400">{d.hour}h</span>}
        </div>
      ))}
    </div>
  );
}

function WeeklyChart({ data }: { data: { date: string; visitors: number; postsCreated: number }[] }) {
  const max = Math.max(...data.map(d => d.visitors), 1);
  return (
    <div className="flex h-full items-end gap-2">
      {data.map((d) => (
        <div key={d.date} className="flex-1 flex flex-col items-center">
          <div className="w-full rounded-t bg-gradient-to-t from-fuchsia-500 to-fuchsia-400" style={{ height: `${(d.visitors / max) * 100}%`, minHeight: "4px" }} />
          <span className="mt-1 text-[10px] text-neutral-400">{new Date(d.date).toLocaleDateString("fr-FR", { weekday: "short" })}</span>
        </div>
      ))}
    </div>
  );
}

function MonthlyChart({ data }: { data: { date: string; visitors: number }[] }) {
  const max = Math.max(...data.map(d => d.visitors), 1);
  return (
    <div className="flex h-full items-end gap-0.5">
      {data.map((d) => (
        <div key={d.date} className="flex-1">
          <div className="w-full rounded-t bg-fuchsia-500" style={{ height: `${(d.visitors / max) * 100}%`, minHeight: "2px" }} title={`${d.date}: ${d.visitors}`} />
        </div>
      ))}
    </div>
  );
}

function MinuteChart({ data }: { data: { minute: number; visitors: number }[] }) {
  const max = Math.max(...data.map(d => d.visitors), 1);
  return (
    <div className="flex h-full items-end gap-0.5">
      {data.map((d, i) => (
        <div key={d.minute} className="flex-1 flex flex-col items-center">
          <div className={clsx("w-full rounded-t", i === data.length - 1 ? "bg-emerald-500" : "bg-fuchsia-300 dark:bg-fuchsia-800")} style={{ height: `${(d.visitors / max) * 100}%`, minHeight: "2px" }} />
          {d.minute % 10 === 0 && <span className="mt-1 text-[9px] text-neutral-400">{d.minute}m</span>}
        </div>
      ))}
    </div>
  );
}

function PostModerationCard({ post, onModerate, onFeature, onUnfeature, onPromote, onUnpromote }: {
  post: Post; onModerate: (s: PostStatus) => void; onFeature: () => void; onUnfeature: () => void; onPromote: () => void; onUnpromote: () => void;
}) {
  return (
    <div className={clsx(
      "rounded-xl border p-4",
      post.status === "flagged" && "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20",
      post.status === "hidden" && "border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/20",
      post.status === "active" && "border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900"
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{post.author}</span>
            <span className="text-xs text-neutral-500">@{post.handle}</span>
            <span className={clsx(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              post.status === "active" && "bg-emerald-100 text-emerald-700",
              post.status === "flagged" && "bg-amber-100 text-amber-700",
              post.status === "hidden" && "bg-rose-100 text-rose-700"
            )}>{post.status}</span>
            {post.isFeatured && <span className="text-xs">⭐</span>}
            {post.isPromotedByAdmin && <span className="text-xs">📌</span>}
          </div>
          <p className="mt-2 text-sm">{post.text}</p>
          <div className="mt-2 flex items-center gap-4 text-xs text-neutral-500">
            <span>{timeAgo(post.createdAtISO)}</span>
            <span>❤️ {post.likes}</span>
            <span>👁️ {post.views}</span>
            <span>🔥 {post.viralityScore}%</span>
            {post.reports && post.reports > 0 && <span className="text-rose-600">🚩 {post.reports}</span>}
          </div>
        </div>
        <div className="ml-4 flex flex-col gap-1">
          {post.status !== "active" && (
            <button onClick={() => onModerate("active")} className="rounded-lg bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">✅ OK</button>
          )}
          {post.status === "active" && (
            <button onClick={() => onModerate("hidden")} className="rounded-lg bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">🔒 Masquer</button>
          )}
          <button onClick={() => onModerate("deleted")} className="rounded-lg bg-rose-100 px-2 py-1 text-xs font-medium text-rose-700">🗑️</button>
          <button onClick={post.isPromotedByAdmin ? onUnpromote : onPromote} className="rounded-lg bg-fuchsia-100 px-2 py-1 text-xs text-fuchsia-700">
            {post.isPromotedByAdmin ? "📌" : "📌 Promouvoir"}
          </button>
        </div>
      </div>
    </div>
  );
}
