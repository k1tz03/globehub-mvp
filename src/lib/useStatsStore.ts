"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import type { DailyStats, LiveStats, SearchStat, BackgroundEvent, AutoShareConfig, ModerationRule, ModerationLog, ShareLog } from "./types";

const STATS_KEY = "globehub_stats_v1";
const LIVE_USERS_KEY = "globehub_live_users_v1";
const BG_EVENTS_KEY = "globehub_bg_events_v1";
const AUTO_SHARE_KEY = "globehub_auto_share_v1";
const MOD_RULES_KEY = "globehub_mod_rules_v1";
const MOD_LOGS_KEY = "globehub_mod_logs_v1";
const SHARE_LOGS_KEY = "globehub_share_logs_v1";
const SEARCHES_KEY = "globehub_searches_v1";

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

// Générer des stats de démo
function generateDemoStats(): DailyStats[] {
  const stats: DailyStats[] = [];
  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const baseVisitors = 150 + Math.floor(Math.random() * 100);
    const hourlyBreakdown = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      visitors: Math.floor(baseVisitors * (0.3 + 0.7 * Math.sin((hour - 6) * Math.PI / 12))),
      pageViews: Math.floor(baseVisitors * 2 * (0.3 + 0.7 * Math.sin((hour - 6) * Math.PI / 12))),
      postsCreated: Math.floor(Math.random() * 20),
    }));

    stats.push({
      date: date.toISOString().split("T")[0],
      visitors: baseVisitors,
      uniqueVisitors: Math.floor(baseVisitors * 0.7),
      pageViews: baseVisitors * 3,
      newUsers: Math.floor(Math.random() * 30),
      postsCreated: 50 + Math.floor(Math.random() * 50),
      messagesCreated: 100 + Math.floor(Math.random() * 100),
      likes: 200 + Math.floor(Math.random() * 200),
      comments: 80 + Math.floor(Math.random() * 80),
      shares: 20 + Math.floor(Math.random() * 30),
      searches: [
        { query: "paris", count: 45 },
        { query: "concert", count: 32 },
        { query: "festival", count: 28 },
        { query: "restaurant", count: 25 },
        { query: "plage", count: 20 },
      ],
      hourlyBreakdown,
    });
  }
  return stats;
}

// Events de fond par défaut
const defaultBgEvents: BackgroundEvent[] = [
  {
    id: "evt_newyear_2026",
    name: "Nouvel An 2026",
    description: "Célébration du passage à la nouvelle année avec feux d'artifice et confettis",
    type: "new_year",
    isActive: true,
    startDate: "2025-12-31T20:00:00Z",
    endDate: "2026-01-02T06:00:00Z",
    cssClass: "bg-newyear",
    priority: 100,
    createdAt: new Date().toISOString(),
    impressions: 15420,
    clicks: 892,
  },
  {
    id: "evt_chinese_newyear_2026",
    name: "Nouvel An Chinois 2026 - Année du Serpent",
    description: "Célébration du Nouvel An lunaire avec lanternes, dragons et le caractère Fu (福)",
    type: "chinese_new_year",
    isActive: false,
    startDate: "2026-01-29T00:00:00Z",
    endDate: "2026-02-12T23:59:59Z",
    cssClass: "bg-chinese-newyear",
    priority: 95,
    createdAt: new Date().toISOString(),
    impressions: 8750,
    clicks: 523,
  },
  {
    id: "evt_valentine_2026",
    name: "Saint-Valentin 2026",
    description: "Fête des amoureux avec cœurs flottants et ambiance romantique",
    type: "valentine",
    isActive: false,
    startDate: "2026-02-13T00:00:00Z",
    endDate: "2026-02-15T23:59:59Z",
    cssClass: "bg-valentine",
    priority: 85,
    createdAt: new Date().toISOString(),
  },
  {
    id: "evt_christmas_2025",
    name: "Noël 2025",
    description: "Période des fêtes avec neige, sapins et guirlandes",
    type: "christmas",
    isActive: false,
    startDate: "2025-12-20T00:00:00Z",
    endDate: "2025-12-26T23:59:59Z",
    cssClass: "bg-christmas",
    priority: 90,
    createdAt: new Date().toISOString(),
    impressions: 22100,
    clicks: 1456,
  },
  {
    id: "evt_halloween_2025",
    name: "Halloween 2025",
    description: "Nuit effrayante avec citrouilles, fantômes et chauves-souris",
    type: "halloween",
    isActive: false,
    startDate: "2025-10-25T00:00:00Z",
    endDate: "2025-11-01T23:59:59Z",
    cssClass: "bg-halloween",
    priority: 80,
    createdAt: new Date().toISOString(),
    impressions: 18340,
    clicks: 1123,
  },
  {
    id: "evt_custom_demo",
    name: "Exemple Animation Personnalisée",
    description: "Démonstration d'un fond animé avec code CSS/JS personnalisé",
    type: "custom",
    isActive: false,
    startDate: "2026-01-01T00:00:00Z",
    endDate: "2026-12-31T23:59:59Z",
    priority: 50,
    createdAt: new Date().toISOString(),
    customCSS: `
.custom-particle {
  position: absolute;
  width: 10px;
  height: 10px;
  background: linear-gradient(45deg, #ff6b6b, #feca57);
  border-radius: 50%;
  animation: customFloat 3s ease-in-out infinite;
}
@keyframes customFloat {
  0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.8; }
  50% { transform: translateY(-30px) rotate(180deg); opacity: 1; }
}`,
    customJS: `
// Créer des particules personnalisées
for (let i = 0; i < 20; i++) {
  const particle = document.createElement('div');
  particle.className = 'custom-particle';
  particle.style.left = Math.random() * 100 + '%';
  particle.style.top = Math.random() * 100 + '%';
  particle.style.animationDelay = Math.random() * 3 + 's';
  container.appendChild(particle);
}
// Retourner une fonction de cleanup
return () => {
  container.querySelectorAll('.custom-particle').forEach(el => el.remove());
};`,
    customHTML: `<div class="absolute top-4 left-4 text-xs text-white/50">Animation personnalisée</div>`,
  },
  {
    id: "evt_sponsored_demo",
    name: "Sponsoring Demo - TechCorp",
    description: "Exemple de fond sponsorisé par une entreprise",
    type: "sponsored",
    isActive: false,
    startDate: "2026-01-15T00:00:00Z",
    endDate: "2026-01-31T23:59:59Z",
    priority: 70,
    createdAt: new Date().toISOString(),
    sponsorName: "TechCorp",
    sponsorUrl: "https://example.com",
    sponsorBudget: 5000,
    impressions: 45000,
    clicks: 2340,
  },
];

// Config auto-share par défaut
const defaultAutoShare: AutoShareConfig = {
  enabled: false,
  platforms: ["twitter", "facebook"],
  intervalHours: 6,
  minViralityScore: 50,
  maxPostsPerShare: 3,
  hashtags: ["GlobeHub", "Trending", "Viral"],
  includeLink: true,
};

// Règles de modération par défaut
const defaultModRules: ModerationRule[] = [
  {
    id: "rule_001",
    name: "Mots interdits",
    isActive: true,
    type: "keyword",
    pattern: "spam,scam,arnaque",
    action: "flag",
    severity: "medium",
    createdAt: new Date().toISOString(),
    triggeredCount: 12,
  },
  {
    id: "rule_002",
    name: "Liens suspects",
    isActive: true,
    type: "regex",
    pattern: "bit\\.ly|tinyurl\\.com",
    action: "flag",
    severity: "low",
    createdAt: new Date().toISOString(),
    triggeredCount: 5,
  },
  {
    id: "rule_003",
    name: "Contenu violent",
    isActive: true,
    type: "keyword",
    pattern: "violence,mort,tuer",
    action: "hide",
    severity: "high",
    createdAt: new Date().toISOString(),
    triggeredCount: 3,
  },
];

export function useStatsStore() {
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [liveUsers, setLiveUsers] = useState<string[]>([]);
  const [bgEvents, setBgEvents] = useState<BackgroundEvent[]>([]);
  const [autoShareConfig, setAutoShareConfig] = useState<AutoShareConfig>(defaultAutoShare);
  const [modRules, setModRules] = useState<ModerationRule[]>([]);
  const [modLogs, setModLogs] = useState<ModerationLog[]>([]);
  const [shareLogs, setShareLogs] = useState<ShareLog[]>([]);
  const [searches, setSearches] = useState<SearchStat[]>([]);
  const [ready, setReady] = useState(false);

  // Charger les données
  useEffect(() => {
    // Stats quotidiennes
    const savedStats = safeParse<DailyStats[]>(localStorage.getItem(STATS_KEY));
    if (savedStats && savedStats.length > 0) {
      setDailyStats(savedStats);
    } else {
      const demoStats = generateDemoStats();
      localStorage.setItem(STATS_KEY, JSON.stringify(demoStats));
      setDailyStats(demoStats);
    }

    // Utilisateurs en ligne (simulé)
    const savedLive = safeParse<string[]>(localStorage.getItem(LIVE_USERS_KEY));
    setLiveUsers(savedLive || ["camille", "noah", "emma"]);

    // Events de fond
    const savedBgEvents = safeParse<BackgroundEvent[]>(localStorage.getItem(BG_EVENTS_KEY));
    if (savedBgEvents && savedBgEvents.length > 0) {
      setBgEvents(savedBgEvents);
    } else {
      localStorage.setItem(BG_EVENTS_KEY, JSON.stringify(defaultBgEvents));
      setBgEvents(defaultBgEvents);
    }

    // Auto-share config
    const savedAutoShare = safeParse<AutoShareConfig>(localStorage.getItem(AUTO_SHARE_KEY));
    if (savedAutoShare) {
      setAutoShareConfig(savedAutoShare);
    } else {
      localStorage.setItem(AUTO_SHARE_KEY, JSON.stringify(defaultAutoShare));
    }

    // Règles de modération
    const savedModRules = safeParse<ModerationRule[]>(localStorage.getItem(MOD_RULES_KEY));
    if (savedModRules && savedModRules.length > 0) {
      setModRules(savedModRules);
    } else {
      localStorage.setItem(MOD_RULES_KEY, JSON.stringify(defaultModRules));
      setModRules(defaultModRules);
    }

    // Logs de modération
    const savedModLogs = safeParse<ModerationLog[]>(localStorage.getItem(MOD_LOGS_KEY));
    setModLogs(savedModLogs || []);

    // Logs de partage
    const savedShareLogs = safeParse<ShareLog[]>(localStorage.getItem(SHARE_LOGS_KEY));
    setShareLogs(savedShareLogs || []);

    // Recherches populaires
    const savedSearches = safeParse<SearchStat[]>(localStorage.getItem(SEARCHES_KEY));
    setSearches(savedSearches || [
      { query: "paris", count: 156 },
      { query: "concert", count: 98 },
      { query: "festival", count: 87 },
      { query: "plage", count: 76 },
      { query: "restaurant", count: 65 },
    ]);

    setReady(true);
  }, []);

  // Sauvegarders
  const saveBgEvents = useCallback((events: BackgroundEvent[]) => {
    localStorage.setItem(BG_EVENTS_KEY, JSON.stringify(events));
    setBgEvents(events);
  }, []);

  const saveAutoShareConfig = useCallback((config: AutoShareConfig) => {
    localStorage.setItem(AUTO_SHARE_KEY, JSON.stringify(config));
    setAutoShareConfig(config);
  }, []);

  const saveModRules = useCallback((rules: ModerationRule[]) => {
    localStorage.setItem(MOD_RULES_KEY, JSON.stringify(rules));
    setModRules(rules);
  }, []);

  const saveModLogs = useCallback((logs: ModerationLog[]) => {
    localStorage.setItem(MOD_LOGS_KEY, JSON.stringify(logs));
    setModLogs(logs);
  }, []);

  const saveShareLogs = useCallback((logs: ShareLog[]) => {
    localStorage.setItem(SHARE_LOGS_KEY, JSON.stringify(logs));
    setShareLogs(logs);
  }, []);

  // Enregistrer une recherche
  const recordSearch = useCallback((query: string) => {
    const q = query.toLowerCase().trim();
    if (!q) return;

    setSearches((prev) => {
      const existing = prev.find((s) => s.query === q);
      let newSearches: SearchStat[];
      if (existing) {
        newSearches = prev.map((s) =>
          s.query === q ? { ...s, count: s.count + 1 } : s
        );
      } else {
        newSearches = [...prev, { query: q, count: 1 }];
      }
      newSearches.sort((a, b) => b.count - a.count);
      localStorage.setItem(SEARCHES_KEY, JSON.stringify(newSearches.slice(0, 100)));
      return newSearches.slice(0, 100);
    });
  }, []);

  // Ajouter un événement de fond
  const addBgEvent = useCallback((event: Omit<BackgroundEvent, "id">) => {
    const newEvent: BackgroundEvent = {
      ...event,
      id: `evt_${uid()}`,
    };
    saveBgEvents([...bgEvents, newEvent]);
    return newEvent;
  }, [bgEvents, saveBgEvents]);

  // Modifier un événement
  const updateBgEvent = useCallback((id: string, updates: Partial<BackgroundEvent>) => {
    saveBgEvents(bgEvents.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  }, [bgEvents, saveBgEvents]);

  // Supprimer un événement
  const deleteBgEvent = useCallback((id: string) => {
    saveBgEvents(bgEvents.filter((e) => e.id !== id));
  }, [bgEvents, saveBgEvents]);

  // Ajouter une règle de modération
  const addModRule = useCallback((rule: Omit<ModerationRule, "id" | "createdAt" | "triggeredCount">) => {
    const newRule: ModerationRule = {
      ...rule,
      id: `rule_${uid()}`,
      createdAt: new Date().toISOString(),
      triggeredCount: 0,
    };
    saveModRules([...modRules, newRule]);
    return newRule;
  }, [modRules, saveModRules]);

  // Modifier une règle
  const updateModRule = useCallback((id: string, updates: Partial<ModerationRule>) => {
    saveModRules(modRules.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  }, [modRules, saveModRules]);

  // Supprimer une règle
  const deleteModRule = useCallback((id: string) => {
    saveModRules(modRules.filter((r) => r.id !== id));
  }, [modRules, saveModRules]);

  // Ajouter un log de modération
  const addModLog = useCallback((log: Omit<ModerationLog, "id" | "timestamp">) => {
    const newLog: ModerationLog = {
      ...log,
      id: `mlog_${uid()}`,
      timestamp: new Date().toISOString(),
    };
    saveModLogs([newLog, ...modLogs].slice(0, 500)); // Garder les 500 derniers
    return newLog;
  }, [modLogs, saveModLogs]);

  // Simuler un partage auto
  const triggerAutoShare = useCallback((postIds: string[], platform: string) => {
    const logs: ShareLog[] = postIds.map((postId) => ({
      id: `slog_${uid()}`,
      postId,
      platform: platform as ShareLog["platform"],
      timestamp: new Date().toISOString(),
      success: Math.random() > 0.1, // 90% de succès simulé
    }));
    saveShareLogs([...logs, ...shareLogs].slice(0, 200));
    saveAutoShareConfig({ ...autoShareConfig, lastShareTime: new Date().toISOString() });
    return logs;
  }, [autoShareConfig, shareLogs, saveAutoShareConfig, saveShareLogs]);

  // Stats live simulées
  const liveStats = useMemo((): LiveStats => {
    const now = new Date();
    const todayStats = dailyStats.find(
      (s) => s.date === now.toISOString().split("T")[0]
    );
    return {
      onlineUsers: liveUsers.length + Math.floor(Math.random() * 50),
      activeConversations: 12 + Math.floor(Math.random() * 20),
      postsLastHour: todayStats?.hourlyBreakdown[now.getHours()]?.postsCreated ?? 15,
      trendingPosts: [],
      peakToday: todayStats?.hourlyBreakdown.reduce((max, h) => Math.max(max, h.visitors), 0) ?? 200,
      currentTimestamp: now.toISOString(),
    };
  }, [liveUsers, dailyStats]);

  // Événement actif actuel
  const activeBackgroundEvent = useMemo(() => {
    const now = new Date();
    return bgEvents
      .filter((e) => {
        if (!e.isActive) return false;
        const start = new Date(e.startDate);
        const end = new Date(e.endDate);
        return now >= start && now <= end;
      })
      .sort((a, b) => b.priority - a.priority)[0] || null;
  }, [bgEvents]);

  // Statistiques agrégées
  const aggregatedStats = useMemo(() => {
    const last7Days = dailyStats.slice(-7);
    const last30Days = dailyStats.slice(-30);

    return {
      today: dailyStats[dailyStats.length - 1] || null,
      last7Days: {
        totalVisitors: last7Days.reduce((sum, d) => sum + d.visitors, 0),
        totalPosts: last7Days.reduce((sum, d) => sum + d.postsCreated, 0),
        totalLikes: last7Days.reduce((sum, d) => sum + d.likes, 0),
        avgVisitors: Math.round(last7Days.reduce((sum, d) => sum + d.visitors, 0) / 7),
      },
      last30Days: {
        totalVisitors: last30Days.reduce((sum, d) => sum + d.visitors, 0),
        totalPosts: last30Days.reduce((sum, d) => sum + d.postsCreated, 0),
        totalNewUsers: last30Days.reduce((sum, d) => sum + d.newUsers, 0),
      },
    };
  }, [dailyStats]);

  return {
    dailyStats,
    liveStats,
    liveUsers,
    searches,
    bgEvents,
    activeBackgroundEvent,
    autoShareConfig,
    modRules,
    modLogs,
    shareLogs,
    aggregatedStats,
    ready,
    recordSearch,
    addBgEvent,
    updateBgEvent,
    deleteBgEvent,
    addModRule,
    updateModRule,
    deleteModRule,
    addModLog,
    saveAutoShareConfig,
    triggerAutoShare,
  };
}
