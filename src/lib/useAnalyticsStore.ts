"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import type { 
  DailyStats, 
  LiveStats, 
  SearchStat, 
  HourlyStats,
  BackgroundEvent,
  AutoShareConfig,
  ShareLog,
  ModerationRule,
  ModerationLog
} from "./types";

const ANALYTICS_KEY = "globehub_analytics_v1";
const SEARCH_STATS_KEY = "globehub_searches_v1";
const BACKGROUND_EVENTS_KEY = "globehub_bg_events_v1";
const AUTO_SHARE_KEY = "globehub_auto_share_v1";
const SHARE_LOGS_KEY = "globehub_share_logs_v1";
const MODERATION_RULES_KEY = "globehub_mod_rules_v1";
const MODERATION_LOGS_KEY = "globehub_mod_logs_v1";
const ONLINE_USERS_KEY = "globehub_online_v1";

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

// Générer des stats de démo
function generateDemoStats(): DailyStats[] {
  const stats: DailyStats[] = [];
  const now = new Date();

  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    const baseVisitors = 500 + Math.floor(Math.random() * 1000);
    const hourlyBreakdown: HourlyStats[] = [];

    for (let h = 0; h < 24; h++) {
      // Plus d'activité entre 9h et 22h
      const multiplier = h >= 9 && h <= 22 ? 1.5 : 0.5;
      hourlyBreakdown.push({
        hour: h,
        visitors: Math.floor((baseVisitors / 24) * multiplier * (0.5 + Math.random())),
        pageViews: Math.floor((baseVisitors / 24) * multiplier * (1 + Math.random()) * 3),
        postsCreated: Math.floor(Math.random() * 10 * multiplier),
      });
    }

    stats.push({
      date: dateStr,
      visitors: baseVisitors,
      uniqueVisitors: Math.floor(baseVisitors * 0.7),
      pageViews: baseVisitors * 3,
      newUsers: Math.floor(baseVisitors * 0.05),
      postsCreated: Math.floor(50 + Math.random() * 100),
      messagesCreated: Math.floor(100 + Math.random() * 200),
      likes: Math.floor(500 + Math.random() * 1000),
      comments: Math.floor(100 + Math.random() * 300),
      shares: Math.floor(50 + Math.random() * 150),
      searches: [
        { query: "événement paris", count: Math.floor(10 + Math.random() * 50) },
        { query: "concert", count: Math.floor(10 + Math.random() * 40) },
        { query: "manif", count: Math.floor(5 + Math.random() * 30) },
        { query: "météo", count: Math.floor(5 + Math.random() * 25) },
        { query: "sport", count: Math.floor(5 + Math.random() * 20) },
      ],
      hourlyBreakdown,
    });
  }

  return stats;
}

// Événements de fond par défaut
const defaultBackgroundEvents: BackgroundEvent[] = [
  {
    id: "bg_new_year",
    name: "Nouvel An 2026",
    type: "new_year",
    isActive: false,
    startDate: "2025-12-31T20:00:00Z",
    endDate: "2026-01-02T06:00:00Z",
    cssClass: "bg-new-year",
    priority: 100,
    createdAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "bg_christmas",
    name: "Noël",
    type: "christmas",
    isActive: false,
    startDate: "2025-12-20T00:00:00Z",
    endDate: "2025-12-27T00:00:00Z",
    cssClass: "bg-christmas",
    priority: 90,
    createdAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "bg_halloween",
    name: "Halloween",
    type: "halloween",
    isActive: false,
    startDate: "2025-10-25T00:00:00Z",
    endDate: "2025-11-02T00:00:00Z",
    cssClass: "bg-halloween",
    priority: 80,
    createdAt: "2025-01-01T00:00:00Z",
  },
];

// Règles de modération par défaut
const defaultModerationRules: ModerationRule[] = [
  {
    id: "rule_hate",
    name: "Discours haineux",
    isActive: true,
    type: "keyword",
    pattern: "nazi|hitler|raciste|sale juif|sale arabe|sale noir",
    action: "flag",
    severity: "high",
    createdAt: new Date().toISOString(),
    triggeredCount: 0,
  },
  {
    id: "rule_spam",
    name: "Spam / Publicité",
    isActive: true,
    type: "regex",
    pattern: "(acheter|gratuit|promo|gagnez|casino|crypto).{0,20}(lien|link|url|http)",
    action: "flag",
    severity: "medium",
    createdAt: new Date().toISOString(),
    triggeredCount: 0,
  },
  {
    id: "rule_violence",
    name: "Menaces de violence",
    isActive: true,
    type: "keyword",
    pattern: "je vais te tuer|mort à|bombe|attentat|terroriste",
    action: "hide",
    severity: "high",
    createdAt: new Date().toISOString(),
    triggeredCount: 0,
  },
];

// Config par défaut pour l'auto-share
const defaultAutoShareConfig: AutoShareConfig = {
  enabled: false,
  platforms: ["twitter", "facebook"],
  intervalHours: 6,
  minViralityScore: 50,
  maxPostsPerShare: 3,
  hashtags: ["GlobeHub", "Trending", "Viral"],
  includeLink: true,
  customMessage: "🌍 Trending on GlobeHub:",
};

export function useAnalyticsStore() {
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [searchStats, setSearchStats] = useState<SearchStat[]>([]);
  const [backgroundEvents, setBackgroundEvents] = useState<BackgroundEvent[]>([]);
  const [autoShareConfig, setAutoShareConfig] = useState<AutoShareConfig>(defaultAutoShareConfig);
  const [shareLogs, setShareLogs] = useState<ShareLog[]>([]);
  const [moderationRules, setModerationRules] = useState<ModerationRule[]>([]);
  const [moderationLogs, setModerationLogs] = useState<ModerationLog[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<number>(0);
  const [ready, setReady] = useState(false);

  // Charger les données
  useEffect(() => {
    // Daily stats
    const savedStats = safeParse<DailyStats[]>(localStorage.getItem(ANALYTICS_KEY));
    if (savedStats && savedStats.length > 0) {
      setDailyStats(savedStats);
    } else {
      const demoStats = generateDemoStats();
      localStorage.setItem(ANALYTICS_KEY, JSON.stringify(demoStats));
      setDailyStats(demoStats);
    }

    // Search stats
    const savedSearches = safeParse<SearchStat[]>(localStorage.getItem(SEARCH_STATS_KEY));
    if (savedSearches) {
      setSearchStats(savedSearches);
    }

    // Background events
    const savedBgEvents = safeParse<BackgroundEvent[]>(localStorage.getItem(BACKGROUND_EVENTS_KEY));
    if (savedBgEvents && savedBgEvents.length > 0) {
      setBackgroundEvents(savedBgEvents);
    } else {
      localStorage.setItem(BACKGROUND_EVENTS_KEY, JSON.stringify(defaultBackgroundEvents));
      setBackgroundEvents(defaultBackgroundEvents);
    }

    // Auto share config
    const savedAutoShare = safeParse<AutoShareConfig>(localStorage.getItem(AUTO_SHARE_KEY));
    if (savedAutoShare) {
      setAutoShareConfig(savedAutoShare);
    } else {
      localStorage.setItem(AUTO_SHARE_KEY, JSON.stringify(defaultAutoShareConfig));
    }

    // Share logs
    const savedShareLogs = safeParse<ShareLog[]>(localStorage.getItem(SHARE_LOGS_KEY));
    if (savedShareLogs) {
      setShareLogs(savedShareLogs);
    }

    // Moderation rules
    const savedModRules = safeParse<ModerationRule[]>(localStorage.getItem(MODERATION_RULES_KEY));
    if (savedModRules && savedModRules.length > 0) {
      setModerationRules(savedModRules);
    } else {
      localStorage.setItem(MODERATION_RULES_KEY, JSON.stringify(defaultModerationRules));
      setModerationRules(defaultModerationRules);
    }

    // Moderation logs
    const savedModLogs = safeParse<ModerationLog[]>(localStorage.getItem(MODERATION_LOGS_KEY));
    if (savedModLogs) {
      setModerationLogs(savedModLogs);
    }

    // Online users (simulé)
    const savedOnline = safeParse<number>(localStorage.getItem(ONLINE_USERS_KEY));
    setOnlineUsers(savedOnline ?? Math.floor(500 + Math.random() * 1000));

    setReady(true);
  }, []);

  // Simuler les utilisateurs en ligne
  useEffect(() => {
    if (!ready) return;

    const interval = setInterval(() => {
      setOnlineUsers((prev) => {
        const change = Math.floor(Math.random() * 20) - 10;
        const next = Math.max(100, Math.min(5000, prev + change));
        localStorage.setItem(ONLINE_USERS_KEY, JSON.stringify(next));
        return next;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [ready]);

  // Enregistrer une recherche
  const trackSearch = useCallback((query: string) => {
    if (!query.trim()) return;

    setSearchStats((prev) => {
      const existing = prev.find((s) => s.query.toLowerCase() === query.toLowerCase());
      let next: SearchStat[];
      
      if (existing) {
        next = prev.map((s) =>
          s.query.toLowerCase() === query.toLowerCase()
            ? { ...s, count: s.count + 1 }
            : s
        );
      } else {
        next = [...prev, { query: query.toLowerCase(), count: 1 }];
      }

      // Garder les 100 plus recherchées
      next = next.sort((a, b) => b.count - a.count).slice(0, 100);
      localStorage.setItem(SEARCH_STATS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Enregistrer une visite
  const trackVisit = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    const currentHour = new Date().getHours();

    setDailyStats((prev) => {
      let todayStats = prev.find((s) => s.date === today);

      if (!todayStats) {
        todayStats = {
          date: today,
          visitors: 0,
          uniqueVisitors: 0,
          pageViews: 0,
          newUsers: 0,
          postsCreated: 0,
          messagesCreated: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          searches: [],
          hourlyBreakdown: Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            visitors: 0,
            pageViews: 0,
            postsCreated: 0,
          })),
        };
        prev = [...prev, todayStats];
      }

      const next = prev.map((s) => {
        if (s.date === today) {
          const newHourly = s.hourlyBreakdown.map((h) =>
            h.hour === currentHour
              ? { ...h, visitors: h.visitors + 1, pageViews: h.pageViews + 1 }
              : h
          );
          return {
            ...s,
            visitors: s.visitors + 1,
            pageViews: s.pageViews + 1,
            hourlyBreakdown: newHourly,
          };
        }
        return s;
      });

      localStorage.setItem(ANALYTICS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Background Events
  const updateBackgroundEvent = useCallback((eventId: string, updates: Partial<BackgroundEvent>) => {
    setBackgroundEvents((prev) => {
      const next = prev.map((e) => (e.id === eventId ? { ...e, ...updates } : e));
      localStorage.setItem(BACKGROUND_EVENTS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const addBackgroundEvent = useCallback((event: Omit<BackgroundEvent, "id">) => {
    const newEvent: BackgroundEvent = { ...event, id: `bg_${uid()}` };
    setBackgroundEvents((prev) => {
      const next = [...prev, newEvent];
      localStorage.setItem(BACKGROUND_EVENTS_KEY, JSON.stringify(next));
      return next;
    });
    return newEvent;
  }, []);

  const deleteBackgroundEvent = useCallback((eventId: string) => {
    setBackgroundEvents((prev) => {
      const next = prev.filter((e) => e.id !== eventId);
      localStorage.setItem(BACKGROUND_EVENTS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Auto Share
  const updateAutoShareConfig = useCallback((updates: Partial<AutoShareConfig>) => {
    setAutoShareConfig((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem(AUTO_SHARE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const addShareLog = useCallback((log: Omit<ShareLog, "id">) => {
    const newLog: ShareLog = { ...log, id: `share_${uid()}` };
    setShareLogs((prev) => {
      const next = [newLog, ...prev].slice(0, 500); // Garder les 500 derniers
      localStorage.setItem(SHARE_LOGS_KEY, JSON.stringify(next));
      return next;
    });
    return newLog;
  }, []);

  // Moderation Rules
  const addModerationRule = useCallback((rule: Omit<ModerationRule, "id" | "createdAt" | "triggeredCount">) => {
    const newRule: ModerationRule = {
      ...rule,
      id: `rule_${uid()}`,
      createdAt: new Date().toISOString(),
      triggeredCount: 0,
    };
    setModerationRules((prev) => {
      const next = [...prev, newRule];
      localStorage.setItem(MODERATION_RULES_KEY, JSON.stringify(next));
      return next;
    });
    return newRule;
  }, []);

  const updateModerationRule = useCallback((ruleId: string, updates: Partial<ModerationRule>) => {
    setModerationRules((prev) => {
      const next = prev.map((r) => (r.id === ruleId ? { ...r, ...updates } : r));
      localStorage.setItem(MODERATION_RULES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteModerationRule = useCallback((ruleId: string) => {
    setModerationRules((prev) => {
      const next = prev.filter((r) => r.id !== ruleId);
      localStorage.setItem(MODERATION_RULES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const addModerationLog = useCallback((log: Omit<ModerationLog, "id" | "timestamp">) => {
    const newLog: ModerationLog = {
      ...log,
      id: `modlog_${uid()}`,
      timestamp: new Date().toISOString(),
    };
    setModerationLogs((prev) => {
      const next = [newLog, ...prev].slice(0, 1000);
      localStorage.setItem(MODERATION_LOGS_KEY, JSON.stringify(next));
      return next;
    });
    return newLog;
  }, []);

  // Vérifier le contenu contre les règles de modération
  const checkContent = useCallback((text: string): { flagged: boolean; rule?: ModerationRule; reason?: string } => {
    const activeRules = moderationRules.filter((r) => r.isActive);

    for (const rule of activeRules) {
      let matches = false;

      if (rule.type === "keyword") {
        const keywords = rule.pattern.split("|").map((k) => k.trim().toLowerCase());
        matches = keywords.some((k) => text.toLowerCase().includes(k));
      } else if (rule.type === "regex") {
        try {
          const regex = new RegExp(rule.pattern, "i");
          matches = regex.test(text);
        } catch {
          // Invalid regex, skip
        }
      }

      if (matches) {
        // Incrémenter le compteur
        updateModerationRule(rule.id, { triggeredCount: rule.triggeredCount + 1 });
        return { flagged: true, rule, reason: rule.name };
      }
    }

    return { flagged: false };
  }, [moderationRules, updateModerationRule]);

  // Événement de fond actif
  const activeBackgroundEvent = useMemo(() => {
    const now = new Date();
    return backgroundEvents
      .filter((e) => e.isActive && new Date(e.startDate) <= now && new Date(e.endDate) >= now)
      .sort((a, b) => b.priority - a.priority)[0] ?? null;
  }, [backgroundEvents]);

  // Stats du jour
  const todayStats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return dailyStats.find((s) => s.date === today) ?? null;
  }, [dailyStats]);

  // Stats live
  const liveStats = useMemo((): LiveStats => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    return {
      onlineUsers,
      activeConversations: Math.floor(onlineUsers * 0.1),
      postsLastHour: todayStats?.hourlyBreakdown[now.getHours()]?.postsCreated ?? 0,
      trendingPosts: [],
      peakToday: Math.max(...(todayStats?.hourlyBreakdown.map((h) => h.visitors) ?? [0])),
      currentTimestamp: now.toISOString(),
    };
  }, [onlineUsers, todayStats]);

  // Top recherches
  const topSearches = useMemo(() => {
    return searchStats.sort((a, b) => b.count - a.count).slice(0, 20);
  }, [searchStats]);

  return {
    dailyStats,
    todayStats,
    liveStats,
    topSearches,
    backgroundEvents,
    activeBackgroundEvent,
    autoShareConfig,
    shareLogs,
    moderationRules,
    moderationLogs,
    onlineUsers,
    ready,
    trackSearch,
    trackVisit,
    updateBackgroundEvent,
    addBackgroundEvent,
    deleteBackgroundEvent,
    updateAutoShareConfig,
    addShareLog,
    addModerationRule,
    updateModerationRule,
    deleteModerationRule,
    addModerationLog,
    checkContent,
  };
}
