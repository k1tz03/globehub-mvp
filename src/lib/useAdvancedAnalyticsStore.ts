"use client";

import { create } from "zustand";

// Types pour les cohortes
export interface CohortDefinition {
  id: string;
  name: string;
  description: string;
  type: "registration" | "first_action" | "custom";
  conditions: {
    dateRange: { start: string; end: string };
    filters?: {
      country?: string[];
      source?: string[];
      device?: string[];
    };
  };
  createdAt: string;
}

export interface CohortData {
  cohortId: string;
  period: string; // "2024-01", "2024-W01", etc.
  initialUsers: number;
  retentionByDay: Record<number, number>; // jour -> nombre d'utilisateurs actifs
  retentionByWeek: Record<number, number>;
  retentionByMonth: Record<number, number>;
}

// Types pour les funnels
export interface FunnelDefinition {
  id: string;
  name: string;
  description: string;
  steps: Array<{
    id: string;
    name: string;
    event: string;
    filters?: Record<string, string>;
  }>;
  conversionWindow: number; // heures
  createdAt: string;
}

export interface FunnelData {
  funnelId: string;
  dateRange: { start: string; end: string };
  totalStarted: number;
  totalCompleted: number;
  overallConversion: number;
  stepData: Array<{
    stepId: string;
    stepName: string;
    entered: number;
    completed: number;
    dropped: number;
    conversionRate: number;
    avgTimeToNextSeconds: number;
  }>;
  bySegment?: Record<string, {
    totalStarted: number;
    totalCompleted: number;
    conversionRate: number;
  }>;
}

// Types pour les heatmaps
export interface HeatmapConfig {
  id: string;
  name: string;
  type: "click" | "scroll" | "attention" | "movement";
  page: string;
  dateRange: { start: string; end: string };
  resolution: "low" | "medium" | "high";
}

export interface HeatmapData {
  configId: string;
  dataPoints: Array<{
    x: number; // 0-100 (pourcentage)
    y: number; // 0-100
    intensity: number; // 0-100
    count: number;
  }>;
  totalSessions: number;
  avgScrollDepth: number;
  avgTimeOnPage: number;
}

// Types pour la rétention
export interface RetentionData {
  period: string;
  cohortSize: number;
  retention: Record<string, number>; // "D1", "D7", "D30", "W1", "M1" -> pourcentage
}

// Types pour les événements custom
export interface CustomEvent {
  id: string;
  name: string;
  category: string;
  properties: string[];
  count: number;
  lastSeen: string;
}

// Métriques avancées
export interface AdvancedMetrics {
  // Engagement
  dau: number;
  wau: number;
  mau: number;
  dauMauRatio: number; // Stickiness
  avgSessionDuration: number;
  avgSessionsPerUser: number;
  avgActionsPerSession: number;

  // Rétention
  d1Retention: number;
  d7Retention: number;
  d30Retention: number;
  churnRate: number;

  // Growth
  newUsers: number;
  returningUsers: number;
  reactivatedUsers: number;
  growthRate: number;

  // Viralité
  viralCoefficient: number; // K-factor
  avgInvitesSent: number;
  inviteConversionRate: number;

  // Contenu
  avgPostsPerUser: number;
  avgLikesPerPost: number;
  avgCommentsPerPost: number;
  contentEngagementRate: number;
}

// Segments d'utilisateurs
export interface UserSegment {
  id: string;
  name: string;
  description: string;
  conditions: Array<{
    field: string;
    operator: "equals" | "greater_than" | "less_than" | "contains" | "in";
    value: string | number | string[];
  }>;
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

// A/B Test
export interface ABTest {
  id: string;
  name: string;
  description: string;
  status: "draft" | "running" | "paused" | "completed";
  variants: Array<{
    id: string;
    name: string;
    traffic: number; // pourcentage
    conversions: number;
    visitors: number;
  }>;
  goal: string;
  startDate?: string;
  endDate?: string;
  winner?: string;
  significance?: number;
  createdAt: string;
}

interface AdvancedAnalyticsState {
  // Data
  cohorts: CohortDefinition[];
  cohortsData: CohortData[];
  funnels: FunnelDefinition[];
  funnelsData: FunnelData[];
  heatmaps: HeatmapConfig[];
  heatmapsData: HeatmapData[];
  retentionData: RetentionData[];
  customEvents: CustomEvent[];
  segments: UserSegment[];
  abTests: ABTest[];
  metrics: AdvancedMetrics;
  ready: boolean;

  // === COHORTES ===

  createCohort: (data: Omit<CohortDefinition, "id" | "createdAt">) => CohortDefinition;
  deleteCohort: (id: string) => void;
  getCohortAnalysis: (cohortId: string) => CohortData | undefined;
  refreshCohortData: (cohortId: string) => void;

  // === FUNNELS ===

  createFunnel: (data: Omit<FunnelDefinition, "id" | "createdAt">) => FunnelDefinition;
  updateFunnel: (id: string, updates: Partial<FunnelDefinition>) => void;
  deleteFunnel: (id: string) => void;
  getFunnelAnalysis: (funnelId: string, dateRange?: { start: string; end: string }) => FunnelData | undefined;
  refreshFunnelData: (funnelId: string) => void;

  // === HEATMAPS ===

  createHeatmap: (data: Omit<HeatmapConfig, "id">) => HeatmapConfig;
  deleteHeatmap: (id: string) => void;
  getHeatmapData: (configId: string) => HeatmapData | undefined;
  refreshHeatmapData: (configId: string) => void;

  // === RÉTENTION ===

  getRetentionCurve: (period: "daily" | "weekly" | "monthly", dateRange?: { start: string; end: string }) => RetentionData[];
  getChurnAnalysis: () => {
    churned: number;
    atRisk: number;
    healthy: number;
    churnReasons: Array<{ reason: string; count: number }>;
  };

  // === ÉVÉNEMENTS ===

  trackEvent: (name: string, category: string, properties: Record<string, unknown>) => void;
  getEventStats: (eventName: string, dateRange?: { start: string; end: string }) => {
    totalCount: number;
    uniqueUsers: number;
    byDay: Array<{ date: string; count: number }>;
    topProperties: Record<string, Array<{ value: string; count: number }>>;
  };

  // === SEGMENTS ===

  createSegment: (data: Omit<UserSegment, "id" | "userCount" | "createdAt" | "updatedAt">) => UserSegment;
  updateSegment: (id: string, updates: Partial<UserSegment>) => void;
  deleteSegment: (id: string) => void;
  refreshSegmentCounts: () => void;
  getSegmentUsers: (segmentId: string) => string[]; // handles

  // === A/B TESTS ===

  createABTest: (data: Omit<ABTest, "id" | "createdAt" | "status"> & { status?: ABTest["status"] }) => ABTest;
  updateABTest: (id: string, updates: Partial<ABTest>) => void;
  startABTest: (id: string) => void;
  pauseABTest: (id: string) => void;
  completeABTest: (id: string, winnerId: string) => void;
  deleteABTest: (id: string) => void;
  recordConversion: (testId: string, variantId: string) => void;

  // === MÉTRIQUES ===

  refreshMetrics: () => void;
  getMetricsTrend: (metric: keyof AdvancedMetrics, days: number) => Array<{ date: string; value: number }>;
  getMetricsBySegment: (metric: keyof AdvancedMetrics, segmentId: string) => number;

  // === EXPORTS ===

  exportCohortData: (cohortId: string, format: "csv" | "json") => string;
  exportFunnelData: (funnelId: string, format: "csv" | "json") => string;
  exportRetentionData: (format: "csv" | "json") => string;
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// Générer des données de rétention simulées
function generateRetentionData(): RetentionData[] {
  const data: RetentionData[] = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setMonth(date.getMonth() - i);
    const period = date.toISOString().slice(0, 7);

    const cohortSize = Math.floor(500 + Math.random() * 500);
    const baseRetention = 60 + Math.random() * 20;

    data.push({
      period,
      cohortSize,
      retention: {
        "D1": Math.round(baseRetention + Math.random() * 10),
        "D7": Math.round(baseRetention * 0.7 + Math.random() * 10),
        "D14": Math.round(baseRetention * 0.55 + Math.random() * 10),
        "D30": Math.round(baseRetention * 0.4 + Math.random() * 10),
        "D60": Math.round(baseRetention * 0.3 + Math.random() * 10),
        "D90": Math.round(baseRetention * 0.25 + Math.random() * 10),
      },
    });
  }

  return data;
}

// Générer des métriques simulées
function generateMetrics(): AdvancedMetrics {
  const dau = Math.floor(800 + Math.random() * 400);
  const wau = Math.floor(dau * (4 + Math.random() * 2));
  const mau = Math.floor(wau * (2.5 + Math.random() * 1.5));

  return {
    dau,
    wau,
    mau,
    dauMauRatio: Math.round((dau / mau) * 100) / 100,
    avgSessionDuration: Math.floor(180 + Math.random() * 300),
    avgSessionsPerUser: Math.round((2 + Math.random() * 3) * 10) / 10,
    avgActionsPerSession: Math.floor(8 + Math.random() * 12),

    d1Retention: Math.round(55 + Math.random() * 20),
    d7Retention: Math.round(35 + Math.random() * 15),
    d30Retention: Math.round(20 + Math.random() * 15),
    churnRate: Math.round(5 + Math.random() * 10),

    newUsers: Math.floor(50 + Math.random() * 100),
    returningUsers: Math.floor(dau * 0.7),
    reactivatedUsers: Math.floor(20 + Math.random() * 50),
    growthRate: Math.round((5 + Math.random() * 10) * 10) / 10,

    viralCoefficient: Math.round((0.5 + Math.random() * 0.8) * 100) / 100,
    avgInvitesSent: Math.round((1 + Math.random() * 3) * 10) / 10,
    inviteConversionRate: Math.round((10 + Math.random() * 20)),

    avgPostsPerUser: Math.round((2 + Math.random() * 5) * 10) / 10,
    avgLikesPerPost: Math.round((5 + Math.random() * 15) * 10) / 10,
    avgCommentsPerPost: Math.round((1 + Math.random() * 5) * 10) / 10,
    contentEngagementRate: Math.round((15 + Math.random() * 25)),
  };
}

// Données de démonstration
const demoFunnels: FunnelDefinition[] = [
  {
    id: "funnel_signup",
    name: "Inscription",
    description: "Parcours d'inscription complet",
    steps: [
      { id: "step1", name: "Page d'accueil", event: "page_view", filters: { page: "/" } },
      { id: "step2", name: "Clic inscription", event: "click_signup", filters: {} },
      { id: "step3", name: "Formulaire rempli", event: "form_submit", filters: { form: "signup" } },
      { id: "step4", name: "Email vérifié", event: "email_verified", filters: {} },
      { id: "step5", name: "Profil complété", event: "profile_completed", filters: {} },
    ],
    conversionWindow: 72,
    createdAt: new Date().toISOString(),
  },
  {
    id: "funnel_first_post",
    name: "Premier post",
    description: "De l'inscription au premier post",
    steps: [
      { id: "step1", name: "Inscription", event: "signup_completed", filters: {} },
      { id: "step2", name: "Voir le feed", event: "page_view", filters: { page: "/feed" } },
      { id: "step3", name: "Ouvrir composer", event: "open_composer", filters: {} },
      { id: "step4", name: "Publier", event: "post_created", filters: {} },
    ],
    conversionWindow: 168,
    createdAt: new Date().toISOString(),
  },
];

const demoFunnelsData: FunnelData[] = [
  {
    funnelId: "funnel_signup",
    dateRange: { start: "2024-01-01", end: "2024-01-31" },
    totalStarted: 5000,
    totalCompleted: 1250,
    overallConversion: 25,
    stepData: [
      { stepId: "step1", stepName: "Page d'accueil", entered: 5000, completed: 3500, dropped: 1500, conversionRate: 70, avgTimeToNextSeconds: 45 },
      { stepId: "step2", stepName: "Clic inscription", entered: 3500, completed: 2800, dropped: 700, conversionRate: 80, avgTimeToNextSeconds: 120 },
      { stepId: "step3", stepName: "Formulaire rempli", entered: 2800, completed: 2100, dropped: 700, conversionRate: 75, avgTimeToNextSeconds: 180 },
      { stepId: "step4", stepName: "Email vérifié", entered: 2100, completed: 1600, dropped: 500, conversionRate: 76, avgTimeToNextSeconds: 3600 },
      { stepId: "step5", stepName: "Profil complété", entered: 1600, completed: 1250, dropped: 350, conversionRate: 78, avgTimeToNextSeconds: 300 },
    ],
  },
  {
    funnelId: "funnel_first_post",
    dateRange: { start: "2024-01-01", end: "2024-01-31" },
    totalStarted: 1250,
    totalCompleted: 625,
    overallConversion: 50,
    stepData: [
      { stepId: "step1", stepName: "Inscription", entered: 1250, completed: 1250, dropped: 0, conversionRate: 100, avgTimeToNextSeconds: 0 },
      { stepId: "step2", stepName: "Voir le feed", entered: 1250, completed: 1100, dropped: 150, conversionRate: 88, avgTimeToNextSeconds: 60 },
      { stepId: "step3", stepName: "Ouvrir composer", entered: 1100, completed: 800, dropped: 300, conversionRate: 73, avgTimeToNextSeconds: 300 },
      { stepId: "step4", stepName: "Publier", entered: 800, completed: 625, dropped: 175, conversionRate: 78, avgTimeToNextSeconds: 180 },
    ],
  },
];

const demoSegments: UserSegment[] = [
  {
    id: "seg_power_users",
    name: "Power Users",
    description: "Utilisateurs très actifs (10+ posts, 50+ likes donnés)",
    conditions: [
      { field: "postsCount", operator: "greater_than", value: 10 },
      { field: "likesGiven", operator: "greater_than", value: 50 },
    ],
    userCount: 156,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "seg_dormant",
    name: "Dormants",
    description: "Utilisateurs inactifs depuis 30+ jours",
    conditions: [
      { field: "daysSinceLastActivity", operator: "greater_than", value: 30 },
    ],
    userCount: 423,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "seg_new_users",
    name: "Nouveaux (7j)",
    description: "Inscrits dans les 7 derniers jours",
    conditions: [
      { field: "accountAge", operator: "less_than", value: 7 },
    ],
    userCount: 89,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const demoABTests: ABTest[] = [
  {
    id: "ab_signup_cta",
    name: "Bouton d'inscription",
    description: "Test du texte du bouton d'inscription",
    status: "running",
    variants: [
      { id: "control", name: "S'inscrire", traffic: 50, conversions: 245, visitors: 1000 },
      { id: "variant_a", name: "Rejoindre la communauté", traffic: 50, conversions: 312, visitors: 1000 },
    ],
    goal: "signup_completed",
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    significance: 94,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "ab_onboarding",
    name: "Flow d'onboarding",
    description: "Comparaison de 3 flows d'onboarding",
    status: "completed",
    variants: [
      { id: "control", name: "Standard", traffic: 33, conversions: 89, visitors: 500 },
      { id: "variant_a", name: "Gamifié", traffic: 33, conversions: 134, visitors: 500 },
      { id: "variant_b", name: "Simplifié", traffic: 34, conversions: 112, visitors: 500 },
    ],
    goal: "first_post_created",
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    winner: "variant_a",
    significance: 98,
    createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const demoEvents: CustomEvent[] = [
  { id: "evt_1", name: "post_created", category: "content", properties: ["type", "hasMedia", "hasLocation"], count: 12500, lastSeen: new Date().toISOString() },
  { id: "evt_2", name: "post_liked", category: "engagement", properties: ["postId", "authorId"], count: 45000, lastSeen: new Date().toISOString() },
  { id: "evt_3", name: "comment_added", category: "engagement", properties: ["postId", "parentId"], count: 8900, lastSeen: new Date().toISOString() },
  { id: "evt_4", name: "profile_viewed", category: "discovery", properties: ["profileHandle", "source"], count: 28000, lastSeen: new Date().toISOString() },
  { id: "evt_5", name: "search_performed", category: "discovery", properties: ["query", "resultsCount"], count: 15600, lastSeen: new Date().toISOString() },
  { id: "evt_6", name: "share_clicked", category: "viral", properties: ["postId", "platform"], count: 3200, lastSeen: new Date().toISOString() },
];

export const useAdvancedAnalyticsStore = create<AdvancedAnalyticsState>((set, get) => ({
  cohorts: [],
  cohortsData: [],
  funnels: demoFunnels,
  funnelsData: demoFunnelsData,
  heatmaps: [],
  heatmapsData: [],
  retentionData: generateRetentionData(),
  customEvents: demoEvents,
  segments: demoSegments,
  abTests: demoABTests,
  metrics: generateMetrics(),
  ready: true,

  // === COHORTES ===

  createCohort: (data) => {
    const cohort: CohortDefinition = {
      id: `cohort_${uid()}`,
      ...data,
      createdAt: new Date().toISOString(),
    };
    set({ cohorts: [...get().cohorts, cohort] });

    // Générer des données simulées
    get().refreshCohortData(cohort.id);

    return cohort;
  },

  deleteCohort: (id) => {
    set({
      cohorts: get().cohorts.filter(c => c.id !== id),
      cohortsData: get().cohortsData.filter(d => d.cohortId !== id),
    });
  },

  getCohortAnalysis: (cohortId) => {
    return get().cohortsData.find(d => d.cohortId === cohortId);
  },

  refreshCohortData: (cohortId) => {
    const cohort = get().cohorts.find(c => c.id === cohortId);
    if (!cohort) return;

    // Simuler des données de cohorte
    const initialUsers = Math.floor(200 + Math.random() * 300);
    const retentionByDay: Record<number, number> = {};
    const retentionByWeek: Record<number, number> = {};
    const retentionByMonth: Record<number, number> = {};

    let remaining = initialUsers;
    for (let d = 1; d <= 30; d++) {
      remaining = Math.floor(remaining * (0.92 + Math.random() * 0.06));
      retentionByDay[d] = remaining;
    }

    for (let w = 1; w <= 12; w++) {
      retentionByWeek[w] = Math.floor(initialUsers * Math.pow(0.85, w) * (0.9 + Math.random() * 0.2));
    }

    for (let m = 1; m <= 6; m++) {
      retentionByMonth[m] = Math.floor(initialUsers * Math.pow(0.7, m) * (0.9 + Math.random() * 0.2));
    }

    const data: CohortData = {
      cohortId,
      period: cohort.conditions.dateRange.start.slice(0, 7),
      initialUsers,
      retentionByDay,
      retentionByWeek,
      retentionByMonth,
    };

    set({
      cohortsData: [...get().cohortsData.filter(d => d.cohortId !== cohortId), data],
    });
  },

  // === FUNNELS ===

  createFunnel: (data) => {
    const funnel: FunnelDefinition = {
      id: `funnel_${uid()}`,
      ...data,
      createdAt: new Date().toISOString(),
    };
    set({ funnels: [...get().funnels, funnel] });
    get().refreshFunnelData(funnel.id);
    return funnel;
  },

  updateFunnel: (id, updates) => {
    const { funnels } = get();
    set({ funnels: funnels.map(f => f.id === id ? { ...f, ...updates } : f) });
  },

  deleteFunnel: (id) => {
    set({
      funnels: get().funnels.filter(f => f.id !== id),
      funnelsData: get().funnelsData.filter(d => d.funnelId !== id),
    });
  },

  getFunnelAnalysis: (funnelId) => {
    return get().funnelsData.find(d => d.funnelId === funnelId);
  },

  refreshFunnelData: (funnelId) => {
    const funnel = get().funnels.find(f => f.id === funnelId);
    if (!funnel) return;

    // Simuler des données de funnel
    let remaining = Math.floor(1000 + Math.random() * 2000);
    const totalStarted = remaining;
    const stepData: FunnelData["stepData"] = [];

    for (const step of funnel.steps) {
      const conversionRate = Math.floor(70 + Math.random() * 25);
      const completed = Math.floor(remaining * (conversionRate / 100));
      const dropped = remaining - completed;

      stepData.push({
        stepId: step.id,
        stepName: step.name,
        entered: remaining,
        completed,
        dropped,
        conversionRate,
        avgTimeToNextSeconds: Math.floor(30 + Math.random() * 300),
      });

      remaining = completed;
    }

    const data: FunnelData = {
      funnelId,
      dateRange: { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), end: new Date().toISOString() },
      totalStarted,
      totalCompleted: remaining,
      overallConversion: Math.round((remaining / totalStarted) * 100),
      stepData,
    };

    set({
      funnelsData: [...get().funnelsData.filter(d => d.funnelId !== funnelId), data],
    });
  },

  // === HEATMAPS ===

  createHeatmap: (data) => {
    const config: HeatmapConfig = {
      id: `hm_${uid()}`,
      ...data,
    };
    set({ heatmaps: [...get().heatmaps, config] });
    get().refreshHeatmapData(config.id);
    return config;
  },

  deleteHeatmap: (id) => {
    set({
      heatmaps: get().heatmaps.filter(h => h.id !== id),
      heatmapsData: get().heatmapsData.filter(d => d.configId !== id),
    });
  },

  getHeatmapData: (configId) => {
    return get().heatmapsData.find(d => d.configId === configId);
  },

  refreshHeatmapData: (configId) => {
    const config = get().heatmaps.find(h => h.id === configId);
    if (!config) return;

    // Simuler des données de heatmap
    const dataPoints: HeatmapData["dataPoints"] = [];
    const pointCount = config.resolution === "high" ? 200 : config.resolution === "medium" ? 100 : 50;

    for (let i = 0; i < pointCount; i++) {
      dataPoints.push({
        x: Math.floor(Math.random() * 100),
        y: Math.floor(Math.random() * 100),
        intensity: Math.floor(20 + Math.random() * 80),
        count: Math.floor(1 + Math.random() * 50),
      });
    }

    const data: HeatmapData = {
      configId,
      dataPoints,
      totalSessions: Math.floor(500 + Math.random() * 1500),
      avgScrollDepth: Math.floor(40 + Math.random() * 40),
      avgTimeOnPage: Math.floor(60 + Math.random() * 180),
    };

    set({
      heatmapsData: [...get().heatmapsData.filter(d => d.configId !== configId), data],
    });
  },

  // === RÉTENTION ===

  getRetentionCurve: () => {
    return get().retentionData;
  },

  getChurnAnalysis: () => {
    return {
      churned: Math.floor(100 + Math.random() * 200),
      atRisk: Math.floor(50 + Math.random() * 150),
      healthy: Math.floor(500 + Math.random() * 500),
      churnReasons: [
        { reason: "Inactivité prolongée", count: Math.floor(50 + Math.random() * 50) },
        { reason: "Mauvaise expérience", count: Math.floor(20 + Math.random() * 30) },
        { reason: "Contenu non pertinent", count: Math.floor(15 + Math.random() * 25) },
        { reason: "Problèmes techniques", count: Math.floor(10 + Math.random() * 20) },
        { reason: "Compte supprimé", count: Math.floor(5 + Math.random() * 15) },
      ],
    };
  },

  // === ÉVÉNEMENTS ===

  trackEvent: (name, category, properties) => {
    const { customEvents } = get();
    const existing = customEvents.find(e => e.name === name);

    if (existing) {
      set({
        customEvents: customEvents.map(e =>
          e.name === name
            ? { ...e, count: e.count + 1, lastSeen: new Date().toISOString() }
            : e
        ),
      });
    } else {
      set({
        customEvents: [...customEvents, {
          id: `evt_${uid()}`,
          name,
          category,
          properties: Object.keys(properties),
          count: 1,
          lastSeen: new Date().toISOString(),
        }],
      });
    }
  },

  getEventStats: (eventName) => {
    const event = get().customEvents.find(e => e.name === eventName);
    if (!event) {
      return {
        totalCount: 0,
        uniqueUsers: 0,
        byDay: [],
        topProperties: {},
      };
    }

    // Simuler des statistiques
    const byDay = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().slice(0, 10),
        count: Math.floor(event.count / 30 * (0.7 + Math.random() * 0.6)),
      };
    });

    return {
      totalCount: event.count,
      uniqueUsers: Math.floor(event.count * 0.4),
      byDay,
      topProperties: {},
    };
  },

  // === SEGMENTS ===

  createSegment: (data) => {
    const segment: UserSegment = {
      id: `seg_${uid()}`,
      ...data,
      userCount: Math.floor(50 + Math.random() * 500),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set({ segments: [...get().segments, segment] });
    return segment;
  },

  updateSegment: (id, updates) => {
    const { segments } = get();
    set({
      segments: segments.map(s =>
        s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
      ),
    });
  },

  deleteSegment: (id) => {
    set({ segments: get().segments.filter(s => s.id !== id) });
  },

  refreshSegmentCounts: () => {
    const { segments } = get();
    set({
      segments: segments.map(s => ({
        ...s,
        userCount: Math.floor(50 + Math.random() * 500),
        updatedAt: new Date().toISOString(),
      })),
    });
  },

  getSegmentUsers: () => {
    // Retourner des handles simulés
    return Array.from({ length: 10 }, (_, i) => `user_${i + 1}`);
  },

  // === A/B TESTS ===

  createABTest: (data) => {
    const test: ABTest = {
      id: `ab_${uid()}`,
      ...data,
      status: data.status || "draft",
      createdAt: new Date().toISOString(),
    };
    set({ abTests: [...get().abTests, test] });
    return test;
  },

  updateABTest: (id, updates) => {
    const { abTests } = get();
    set({ abTests: abTests.map(t => t.id === id ? { ...t, ...updates } : t) });
  },

  startABTest: (id) => {
    get().updateABTest(id, {
      status: "running",
      startDate: new Date().toISOString(),
    });
  },

  pauseABTest: (id) => {
    get().updateABTest(id, { status: "paused" });
  },

  completeABTest: (id, winnerId) => {
    get().updateABTest(id, {
      status: "completed",
      endDate: new Date().toISOString(),
      winner: winnerId,
    });
  },

  deleteABTest: (id) => {
    set({ abTests: get().abTests.filter(t => t.id !== id) });
  },

  recordConversion: (testId, variantId) => {
    const { abTests } = get();
    set({
      abTests: abTests.map(t => {
        if (t.id !== testId) return t;
        return {
          ...t,
          variants: t.variants.map(v =>
            v.id === variantId
              ? { ...v, conversions: v.conversions + 1 }
              : v
          ),
        };
      }),
    });
  },

  // === MÉTRIQUES ===

  refreshMetrics: () => {
    set({ metrics: generateMetrics() });
  },

  getMetricsTrend: (metric, days) => {
    const baseValue = get().metrics[metric] as number;
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      return {
        date: date.toISOString().slice(0, 10),
        value: Math.round(baseValue * (0.85 + Math.random() * 0.3)),
      };
    });
  },

  getMetricsBySegment: (metric) => {
    const baseValue = get().metrics[metric] as number;
    return Math.round(baseValue * (0.7 + Math.random() * 0.6));
  },

  // === EXPORTS ===

  exportCohortData: (cohortId, format) => {
    const data = get().getCohortAnalysis(cohortId);
    if (!data) return "";

    if (format === "json") {
      return JSON.stringify(data, null, 2);
    }

    // CSV
    const lines = ["Day,Retained Users"];
    for (const [day, users] of Object.entries(data.retentionByDay)) {
      lines.push(`${day},${users}`);
    }
    return lines.join("\n");
  },

  exportFunnelData: (funnelId, format) => {
    const data = get().getFunnelAnalysis(funnelId);
    if (!data) return "";

    if (format === "json") {
      return JSON.stringify(data, null, 2);
    }

    // CSV
    const lines = ["Step,Entered,Completed,Dropped,Conversion Rate"];
    for (const step of data.stepData) {
      lines.push(`${step.stepName},${step.entered},${step.completed},${step.dropped},${step.conversionRate}%`);
    }
    return lines.join("\n");
  },

  exportRetentionData: (format) => {
    const data = get().retentionData;

    if (format === "json") {
      return JSON.stringify(data, null, 2);
    }

    // CSV
    const lines = ["Period,Cohort Size,D1,D7,D14,D30,D60,D90"];
    for (const row of data) {
      lines.push(`${row.period},${row.cohortSize},${row.retention["D1"]}%,${row.retention["D7"]}%,${row.retention["D14"]}%,${row.retention["D30"]}%,${row.retention["D60"]}%,${row.retention["D90"]}%`);
    }
    return lines.join("\n");
  },
}));
