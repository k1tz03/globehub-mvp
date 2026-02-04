"use client";

import { create } from "zustand";

// Statut d'un item de modération
export type ModerationItemStatus =
  | "pending"      // En attente
  | "in_review"    // En cours d'examen
  | "approved"     // Approuvé
  | "rejected"     // Rejeté
  | "escalated"    // Escaladé
  | "appealed";    // En appel

// Type de contenu
export type ContentType = "post" | "comment" | "message" | "profile" | "group" | "media";

// Priorité
export type Priority = "low" | "normal" | "high" | "urgent" | "critical";

// Item de la queue de modération
export interface ModerationItem {
  id: string;
  contentId: string;
  contentType: ContentType;
  contentText: string;
  contentAuthorHandle: string;
  contentCreatedAt: string;

  // Raison de la mise en queue
  reason: string;
  source: "report" | "auto_detection" | "manual" | "ai_flagged";
  reportCount: number;

  // Priorité et SLA
  priority: Priority;
  slaDeadline: string; // ISO date
  slaBreached: boolean;

  // Statut
  status: ModerationItemStatus;
  assignedTo?: string;
  assignedAt?: string;

  // Actions
  actionTaken?: string;
  actionReason?: string;
  actionTakenBy?: string;
  actionTakenAt?: string;

  // AI assistance
  aiClassification?: {
    category: string;
    confidence: number;
    suggestedAction: string;
  };

  // Meta
  createdAt: string;
  updatedAt: string;

  // Tags pour organisation
  tags: string[];

  // Notes internes
  notes: Array<{
    id: string;
    text: string;
    authorHandle: string;
    createdAt: string;
    isInternal: boolean;
  }>;
}

// Template de réponse
export interface ModerationTemplate {
  id: string;
  name: string;
  category: string;
  action: "approve" | "reject" | "warn" | "delete" | "suspend";
  messageTemplate: string; // Message à l'utilisateur
  internalNote: string;   // Note interne
  variables: string[];    // Variables disponibles: {username}, {content}, etc.
  usageCount: number;
  createdBy: string;
  createdAt: string;
}

// Règle de file d'attente
export interface QueueRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;

  // Conditions
  conditions: {
    contentType?: ContentType[];
    reportCountMin?: number;
    hasKeywords?: string[];
    authorAccountAge?: number; // jours
    authorPostCount?: number;
    aiConfidenceMin?: number;
  };

  // Actions
  assignTo?: string; // Handle ou "auto" pour round-robin
  setPriority?: Priority;
  addTags?: string[];

  createdAt: string;
}

// Stats de modération
export interface ModeratorStats {
  moderatorHandle: string;
  itemsReviewed: number;
  itemsApproved: number;
  itemsRejected: number;
  itemsEscalated: number;
  averageReviewTimeSeconds: number;
  accuracyRate: number; // Basé sur les appels réussis
  lastActiveAt: string;
  todayStats: {
    reviewed: number;
    approved: number;
    rejected: number;
  };
}

// SLA Configuration
export interface SLAConfig {
  priority: Priority;
  maxHours: number;
  warningHours: number;
}

const DEFAULT_SLA_CONFIG: SLAConfig[] = [
  { priority: "critical", maxHours: 1, warningHours: 0.5 },
  { priority: "urgent", maxHours: 4, warningHours: 2 },
  { priority: "high", maxHours: 12, warningHours: 8 },
  { priority: "normal", maxHours: 24, warningHours: 18 },
  { priority: "low", maxHours: 72, warningHours: 48 },
];

interface ModerationQueueState {
  items: ModerationItem[];
  templates: ModerationTemplate[];
  queueRules: QueueRule[];
  moderatorStats: ModeratorStats[];
  slaConfig: SLAConfig[];
  ready: boolean;

  // === QUEUE MANAGEMENT ===

  addToQueue: (data: {
    contentId: string;
    contentType: ContentType;
    contentText: string;
    contentAuthorHandle: string;
    contentCreatedAt: string;
    reason: string;
    source: ModerationItem["source"];
    priority?: Priority;
    aiClassification?: ModerationItem["aiClassification"];
  }) => ModerationItem;

  updateItem: (itemId: string, updates: Partial<ModerationItem>) => void;
  removeFromQueue: (itemId: string) => void;

  // Bulk actions
  bulkAction: (itemIds: string[], action: {
    status: ModerationItemStatus;
    actionTaken?: string;
    actionReason?: string;
    moderatorHandle: string;
  }) => void;

  // Assignment
  assignItem: (itemId: string, moderatorHandle: string) => void;
  assignBulk: (itemIds: string[], moderatorHandle: string) => void;
  unassignItem: (itemId: string) => void;
  claimItem: (itemId: string, moderatorHandle: string) => void;

  // Review actions
  approveItem: (itemId: string, moderatorHandle: string, note?: string) => void;
  rejectItem: (itemId: string, moderatorHandle: string, reason: string, templateId?: string) => void;
  escalateItem: (itemId: string, moderatorHandle: string, reason: string) => void;

  // Notes
  addNote: (itemId: string, text: string, authorHandle: string, isInternal?: boolean) => void;

  // Tags
  addTag: (itemId: string, tag: string) => void;
  removeTag: (itemId: string, tag: string) => void;

  // === TEMPLATES ===

  createTemplate: (data: {
    name: string;
    category: string;
    action: ModerationTemplate["action"];
    messageTemplate: string;
    internalNote: string;
    variables: string[];
    creatorHandle: string;
  }) => ModerationTemplate;

  updateTemplate: (templateId: string, updates: Partial<ModerationTemplate>) => void;
  deleteTemplate: (templateId: string) => void;
  applyTemplate: (itemId: string, templateId: string, moderatorHandle: string) => void;

  // === QUEUE RULES ===

  createQueueRule: (data: Omit<QueueRule, "id" | "createdAt">) => QueueRule;
  updateQueueRule: (ruleId: string, updates: Partial<QueueRule>) => void;
  deleteQueueRule: (ruleId: string) => void;
  toggleQueueRule: (ruleId: string, enabled: boolean) => void;

  // === QUERIES ===

  getQueueItems: (filters?: {
    status?: ModerationItemStatus[];
    priority?: Priority[];
    contentType?: ContentType[];
    assignedTo?: string;
    tags?: string[];
    slaBreached?: boolean;
  }) => ModerationItem[];

  getItemById: (id: string) => ModerationItem | undefined;
  getPendingCount: () => number;
  getUrgentCount: () => number;
  getBreachedSLACount: () => number;
  getAssignedItems: (moderatorHandle: string) => ModerationItem[];

  // === STATS ===

  getQueueStats: () => {
    total: number;
    pending: number;
    inReview: number;
    approved: number;
    rejected: number;
    escalated: number;
    byPriority: Record<Priority, number>;
    byContentType: Record<ContentType, number>;
    avgReviewTimeHours: number;
    slaBreachRate: number;
    todayProcessed: number;
  };

  getModeratorStats: (handle: string) => ModeratorStats | undefined;
  getAllModeratorStats: () => ModeratorStats[];
  updateModeratorStats: (handle: string, action: "approve" | "reject" | "escalate", reviewTimeSeconds: number) => void;

  // === SLA ===

  checkSLABreaches: () => void;
  updateSLAConfig: (config: SLAConfig[]) => void;
  getSLAStatus: (item: ModerationItem) => {
    hoursRemaining: number;
    percentUsed: number;
    status: "ok" | "warning" | "breached";
  };
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function calculateSLADeadline(priority: Priority, config: SLAConfig[]): string {
  const sla = config.find(c => c.priority === priority);
  const hours = sla?.maxHours || 24;
  const deadline = new Date();
  deadline.setHours(deadline.getHours() + hours);
  return deadline.toISOString();
}

// Templates par défaut
const defaultTemplates: ModerationTemplate[] = [
  {
    id: "tpl_spam",
    name: "Spam détecté",
    category: "spam",
    action: "delete",
    messageTemplate: "Votre publication a été supprimée car elle a été identifiée comme spam. Si vous pensez qu'il s'agit d'une erreur, vous pouvez faire appel.",
    internalNote: "Contenu spam confirmé",
    variables: ["{username}", "{content}"],
    usageCount: 0,
    createdBy: "system",
    createdAt: new Date().toISOString(),
  },
  {
    id: "tpl_hate",
    name: "Discours haineux",
    category: "hate",
    action: "delete",
    messageTemplate: "Votre publication a été supprimée car elle enfreint nos règles contre les discours haineux. Tout contenu incitant à la haine n'est pas toléré.",
    internalNote: "Violation des règles - discours haineux",
    variables: ["{username}"],
    usageCount: 0,
    createdBy: "system",
    createdAt: new Date().toISOString(),
  },
  {
    id: "tpl_warn",
    name: "Avertissement standard",
    category: "general",
    action: "warn",
    messageTemplate: "Votre publication a reçu un avertissement. Veuillez respecter nos conditions d'utilisation. Des violations répétées peuvent entraîner la suspension de votre compte.",
    internalNote: "Avertissement émis",
    variables: ["{username}", "{reason}"],
    usageCount: 0,
    createdBy: "system",
    createdAt: new Date().toISOString(),
  },
  {
    id: "tpl_ok",
    name: "Contenu approuvé",
    category: "general",
    action: "approve",
    messageTemplate: "",
    internalNote: "Contenu vérifié et approuvé - aucune violation",
    variables: [],
    usageCount: 0,
    createdBy: "system",
    createdAt: new Date().toISOString(),
  },
];

// Items de démo
const demoItems: ModerationItem[] = [
  {
    id: "mod_demo1",
    contentId: "post_123",
    contentType: "post",
    contentText: "Gagnez 1000€ facilement ! Cliquez ici bit.ly/arnaque",
    contentAuthorHandle: "spammer42",
    contentCreatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    reason: "Détection automatique de spam",
    source: "auto_detection",
    reportCount: 5,
    priority: "high",
    slaDeadline: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(),
    slaBreached: false,
    status: "pending",
    aiClassification: {
      category: "spam",
      confidence: 92,
      suggestedAction: "delete",
    },
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    tags: ["spam", "liens-externes"],
    notes: [],
  },
  {
    id: "mod_demo2",
    contentId: "comment_456",
    contentType: "comment",
    contentText: "Tu es vraiment un idiot, personne ne t'aime",
    contentAuthorHandle: "toxic_user",
    contentCreatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    reason: "Signalement utilisateur: harcèlement",
    source: "report",
    reportCount: 3,
    priority: "urgent",
    slaDeadline: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    slaBreached: false,
    status: "pending",
    aiClassification: {
      category: "harassment",
      confidence: 85,
      suggestedAction: "delete",
    },
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    tags: ["harcèlement", "insultes"],
    notes: [],
  },
  {
    id: "mod_demo3",
    contentId: "post_789",
    contentType: "post",
    contentText: "Venez découvrir mon nouveau projet de musique !",
    contentAuthorHandle: "artist_user",
    contentCreatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    reason: "Signalement utilisateur: promotion",
    source: "report",
    reportCount: 1,
    priority: "low",
    slaDeadline: new Date(Date.now() + 70 * 60 * 60 * 1000).toISOString(),
    slaBreached: false,
    status: "pending",
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    tags: ["auto-promo"],
    notes: [],
  },
];

export const useModerationQueueStore = create<ModerationQueueState>((set, get) => ({
  items: demoItems,
  templates: defaultTemplates,
  queueRules: [],
  moderatorStats: [],
  slaConfig: DEFAULT_SLA_CONFIG,
  ready: true,

  addToQueue: (data) => {
    const priority = data.priority || "normal";
    const item: ModerationItem = {
      id: `mod_${uid()}`,
      contentId: data.contentId,
      contentType: data.contentType,
      contentText: data.contentText,
      contentAuthorHandle: data.contentAuthorHandle,
      contentCreatedAt: data.contentCreatedAt,
      reason: data.reason,
      source: data.source,
      reportCount: 1,
      priority,
      slaDeadline: calculateSLADeadline(priority, get().slaConfig),
      slaBreached: false,
      status: "pending",
      aiClassification: data.aiClassification,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [],
      notes: [],
    };

    // Appliquer les règles de queue
    const { queueRules } = get();
    for (const rule of queueRules) {
      if (!rule.enabled) continue;

      // Vérifier les conditions (simplifié)
      if (rule.conditions.contentType && !rule.conditions.contentType.includes(item.contentType)) continue;
      if (rule.conditions.reportCountMin && item.reportCount < rule.conditions.reportCountMin) continue;

      // Appliquer les actions
      if (rule.setPriority) {
        item.priority = rule.setPriority;
        item.slaDeadline = calculateSLADeadline(rule.setPriority, get().slaConfig);
      }
      if (rule.addTags) {
        item.tags = [...new Set([...item.tags, ...rule.addTags])];
      }
      if (rule.assignTo && rule.assignTo !== "auto") {
        item.assignedTo = rule.assignTo;
        item.assignedAt = new Date().toISOString();
      }
    }

    set({ items: [...get().items, item] });
    return item;
  },

  updateItem: (itemId, updates) => {
    const { items } = get();
    const updated = items.map(item => {
      if (item.id !== itemId) return item;
      return { ...item, ...updates, updatedAt: new Date().toISOString() };
    });
    set({ items: updated });
  },

  removeFromQueue: (itemId) => {
    set({ items: get().items.filter(item => item.id !== itemId) });
  },

  bulkAction: (itemIds, action) => {
    const { items } = get();
    const now = new Date().toISOString();
    const updated = items.map(item => {
      if (!itemIds.includes(item.id)) return item;
      return {
        ...item,
        status: action.status,
        actionTaken: action.actionTaken,
        actionReason: action.actionReason,
        actionTakenBy: action.moderatorHandle,
        actionTakenAt: now,
        updatedAt: now,
      };
    });
    set({ items: updated });
  },

  assignItem: (itemId, moderatorHandle) => {
    get().updateItem(itemId, {
      assignedTo: moderatorHandle,
      assignedAt: new Date().toISOString(),
      status: "in_review",
    });
  },

  assignBulk: (itemIds, moderatorHandle) => {
    const now = new Date().toISOString();
    const { items } = get();
    const updated = items.map(item => {
      if (!itemIds.includes(item.id)) return item;
      return {
        ...item,
        assignedTo: moderatorHandle,
        assignedAt: now,
        status: "in_review" as ModerationItemStatus,
        updatedAt: now,
      };
    });
    set({ items: updated });
  },

  unassignItem: (itemId) => {
    get().updateItem(itemId, {
      assignedTo: undefined,
      assignedAt: undefined,
      status: "pending",
    });
  },

  claimItem: (itemId, moderatorHandle) => {
    const item = get().items.find(i => i.id === itemId);
    if (item && !item.assignedTo) {
      get().assignItem(itemId, moderatorHandle);
    }
  },

  approveItem: (itemId, moderatorHandle, note) => {
    const item = get().items.find(i => i.id === itemId);
    if (!item) return;

    const reviewTime = item.assignedAt
      ? Math.floor((Date.now() - new Date(item.assignedAt).getTime()) / 1000)
      : 0;

    get().updateItem(itemId, {
      status: "approved",
      actionTaken: "approved",
      actionTakenBy: moderatorHandle,
      actionTakenAt: new Date().toISOString(),
    });

    if (note) {
      get().addNote(itemId, note, moderatorHandle, true);
    }

    get().updateModeratorStats(moderatorHandle, "approve", reviewTime);
  },

  rejectItem: (itemId, moderatorHandle, reason, templateId) => {
    const item = get().items.find(i => i.id === itemId);
    if (!item) return;

    const reviewTime = item.assignedAt
      ? Math.floor((Date.now() - new Date(item.assignedAt).getTime()) / 1000)
      : 0;

    if (templateId) {
      const template = get().templates.find(t => t.id === templateId);
      if (template) {
        // Incrémenter l'usage du template
        get().updateTemplate(templateId, { usageCount: template.usageCount + 1 });
      }
    }

    get().updateItem(itemId, {
      status: "rejected",
      actionTaken: "rejected",
      actionReason: reason,
      actionTakenBy: moderatorHandle,
      actionTakenAt: new Date().toISOString(),
    });

    get().updateModeratorStats(moderatorHandle, "reject", reviewTime);
  },

  escalateItem: (itemId, moderatorHandle, reason) => {
    const item = get().items.find(i => i.id === itemId);
    if (!item) return;

    const reviewTime = item.assignedAt
      ? Math.floor((Date.now() - new Date(item.assignedAt).getTime()) / 1000)
      : 0;

    get().updateItem(itemId, {
      status: "escalated",
      actionTaken: "escalated",
      actionReason: reason,
      actionTakenBy: moderatorHandle,
      actionTakenAt: new Date().toISOString(),
      priority: "critical",
    });

    get().addNote(itemId, `Escaladé: ${reason}`, moderatorHandle, true);
    get().updateModeratorStats(moderatorHandle, "escalate", reviewTime);
  },

  addNote: (itemId, text, authorHandle, isInternal = false) => {
    const { items } = get();
    const updated = items.map(item => {
      if (item.id !== itemId) return item;
      return {
        ...item,
        notes: [...item.notes, {
          id: `note_${uid()}`,
          text,
          authorHandle,
          createdAt: new Date().toISOString(),
          isInternal,
        }],
        updatedAt: new Date().toISOString(),
      };
    });
    set({ items: updated });
  },

  addTag: (itemId, tag) => {
    const item = get().items.find(i => i.id === itemId);
    if (item && !item.tags.includes(tag)) {
      get().updateItem(itemId, { tags: [...item.tags, tag] });
    }
  },

  removeTag: (itemId, tag) => {
    const item = get().items.find(i => i.id === itemId);
    if (item) {
      get().updateItem(itemId, { tags: item.tags.filter(t => t !== tag) });
    }
  },

  createTemplate: (data) => {
    const template: ModerationTemplate = {
      id: `tpl_${uid()}`,
      name: data.name,
      category: data.category,
      action: data.action,
      messageTemplate: data.messageTemplate,
      internalNote: data.internalNote,
      variables: data.variables,
      usageCount: 0,
      createdBy: data.creatorHandle,
      createdAt: new Date().toISOString(),
    };
    set({ templates: [...get().templates, template] });
    return template;
  },

  updateTemplate: (templateId, updates) => {
    const { templates } = get();
    const updated = templates.map(t => t.id === templateId ? { ...t, ...updates } : t);
    set({ templates: updated });
  },

  deleteTemplate: (templateId) => {
    set({ templates: get().templates.filter(t => t.id !== templateId) });
  },

  applyTemplate: (itemId, templateId, moderatorHandle) => {
    const template = get().templates.find(t => t.id === templateId);
    if (!template) return;

    if (template.action === "approve") {
      get().approveItem(itemId, moderatorHandle, template.internalNote);
    } else if (template.action === "delete" || template.action === "reject") {
      get().rejectItem(itemId, moderatorHandle, template.internalNote, templateId);
    } else if (template.action === "warn") {
      get().rejectItem(itemId, moderatorHandle, template.internalNote, templateId);
    }
  },

  createQueueRule: (data) => {
    const rule: QueueRule = {
      id: `rule_${uid()}`,
      ...data,
      createdAt: new Date().toISOString(),
    };
    set({ queueRules: [...get().queueRules, rule] });
    return rule;
  },

  updateQueueRule: (ruleId, updates) => {
    const { queueRules } = get();
    const updated = queueRules.map(r => r.id === ruleId ? { ...r, ...updates } : r);
    set({ queueRules: updated });
  },

  deleteQueueRule: (ruleId) => {
    set({ queueRules: get().queueRules.filter(r => r.id !== ruleId) });
  },

  toggleQueueRule: (ruleId, enabled) => {
    get().updateQueueRule(ruleId, { enabled });
  },

  getQueueItems: (filters) => {
    let result = get().items;

    if (filters?.status) {
      result = result.filter(i => filters.status!.includes(i.status));
    }
    if (filters?.priority) {
      result = result.filter(i => filters.priority!.includes(i.priority));
    }
    if (filters?.contentType) {
      result = result.filter(i => filters.contentType!.includes(i.contentType));
    }
    if (filters?.assignedTo) {
      result = result.filter(i => i.assignedTo === filters.assignedTo);
    }
    if (filters?.tags && filters.tags.length > 0) {
      result = result.filter(i => filters.tags!.some(t => i.tags.includes(t)));
    }
    if (filters?.slaBreached !== undefined) {
      result = result.filter(i => i.slaBreached === filters.slaBreached);
    }

    // Trier par priorité puis par date
    const priorityOrder: Record<Priority, number> = { critical: 0, urgent: 1, high: 2, normal: 3, low: 4 };
    return result.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  },

  getItemById: (id) => get().items.find(i => i.id === id),

  getPendingCount: () => get().items.filter(i => i.status === "pending").length,

  getUrgentCount: () => get().items.filter(i =>
    (i.priority === "urgent" || i.priority === "critical") && i.status === "pending"
  ).length,

  getBreachedSLACount: () => get().items.filter(i => i.slaBreached && i.status === "pending").length,

  getAssignedItems: (moderatorHandle) => get().items.filter(i => i.assignedTo === moderatorHandle),

  getQueueStats: () => {
    const { items } = get();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const processed = items.filter(i =>
      i.actionTakenAt && new Date(i.actionTakenAt) >= today
    );

    const reviewTimes = items
      .filter(i => i.assignedAt && i.actionTakenAt)
      .map(i => (new Date(i.actionTakenAt!).getTime() - new Date(i.assignedAt!).getTime()) / (1000 * 60 * 60));

    const avgReviewTime = reviewTimes.length > 0
      ? reviewTimes.reduce((a, b) => a + b, 0) / reviewTimes.length
      : 0;

    const breachedCount = items.filter(i => i.slaBreached).length;
    const totalWithSLA = items.length;

    const byPriority = items.reduce((acc, i) => {
      acc[i.priority] = (acc[i.priority] || 0) + 1;
      return acc;
    }, {} as Record<Priority, number>);

    const byContentType = items.reduce((acc, i) => {
      acc[i.contentType] = (acc[i.contentType] || 0) + 1;
      return acc;
    }, {} as Record<ContentType, number>);

    return {
      total: items.length,
      pending: items.filter(i => i.status === "pending").length,
      inReview: items.filter(i => i.status === "in_review").length,
      approved: items.filter(i => i.status === "approved").length,
      rejected: items.filter(i => i.status === "rejected").length,
      escalated: items.filter(i => i.status === "escalated").length,
      byPriority,
      byContentType,
      avgReviewTimeHours: Math.round(avgReviewTime * 10) / 10,
      slaBreachRate: totalWithSLA > 0 ? Math.round((breachedCount / totalWithSLA) * 100) : 0,
      todayProcessed: processed.length,
    };
  },

  getModeratorStats: (handle) => get().moderatorStats.find(s => s.moderatorHandle === handle),

  getAllModeratorStats: () => get().moderatorStats,

  updateModeratorStats: (handle, action, reviewTimeSeconds) => {
    const { moderatorStats } = get();
    const existing = moderatorStats.find(s => s.moderatorHandle === handle);

    if (existing) {
      const newTotal = existing.itemsReviewed + 1;
      const newAvgTime = (existing.averageReviewTimeSeconds * existing.itemsReviewed + reviewTimeSeconds) / newTotal;

      const updated = moderatorStats.map(s => {
        if (s.moderatorHandle !== handle) return s;
        return {
          ...s,
          itemsReviewed: newTotal,
          itemsApproved: action === "approve" ? s.itemsApproved + 1 : s.itemsApproved,
          itemsRejected: action === "reject" ? s.itemsRejected + 1 : s.itemsRejected,
          itemsEscalated: action === "escalate" ? s.itemsEscalated + 1 : s.itemsEscalated,
          averageReviewTimeSeconds: Math.round(newAvgTime),
          lastActiveAt: new Date().toISOString(),
          todayStats: {
            reviewed: s.todayStats.reviewed + 1,
            approved: action === "approve" ? s.todayStats.approved + 1 : s.todayStats.approved,
            rejected: action === "reject" ? s.todayStats.rejected + 1 : s.todayStats.rejected,
          },
        };
      });
      set({ moderatorStats: updated });
    } else {
      const newStats: ModeratorStats = {
        moderatorHandle: handle,
        itemsReviewed: 1,
        itemsApproved: action === "approve" ? 1 : 0,
        itemsRejected: action === "reject" ? 1 : 0,
        itemsEscalated: action === "escalate" ? 1 : 0,
        averageReviewTimeSeconds: reviewTimeSeconds,
        accuracyRate: 100,
        lastActiveAt: new Date().toISOString(),
        todayStats: {
          reviewed: 1,
          approved: action === "approve" ? 1 : 0,
          rejected: action === "reject" ? 1 : 0,
        },
      };
      set({ moderatorStats: [...moderatorStats, newStats] });
    }
  },

  checkSLABreaches: () => {
    const { items } = get();
    const now = new Date();
    let hasChanges = false;

    const updated = items.map(item => {
      if (item.status !== "pending" && item.status !== "in_review") return item;
      if (item.slaBreached) return item;

      const deadline = new Date(item.slaDeadline);
      if (now > deadline) {
        hasChanges = true;
        return { ...item, slaBreached: true, updatedAt: now.toISOString() };
      }
      return item;
    });

    if (hasChanges) {
      set({ items: updated });
    }
  },

  updateSLAConfig: (config) => {
    set({ slaConfig: config });
  },

  getSLAStatus: (item) => {
    const now = new Date();
    const deadline = new Date(item.slaDeadline);
    const created = new Date(item.createdAt);

    const totalTime = deadline.getTime() - created.getTime();
    const elapsed = now.getTime() - created.getTime();
    const remaining = deadline.getTime() - now.getTime();

    const hoursRemaining = Math.max(0, remaining / (1000 * 60 * 60));
    const percentUsed = Math.min(100, (elapsed / totalTime) * 100);

    const slaConfig = get().slaConfig.find(c => c.priority === item.priority);
    const warningThreshold = slaConfig ? (slaConfig.warningHours / slaConfig.maxHours) * 100 : 75;

    let status: "ok" | "warning" | "breached" = "ok";
    if (item.slaBreached || hoursRemaining <= 0) {
      status = "breached";
    } else if (percentUsed >= warningThreshold) {
      status = "warning";
    }

    return {
      hoursRemaining: Math.round(hoursRemaining * 10) / 10,
      percentUsed: Math.round(percentUsed),
      status,
    };
  },
}));

// Labels
export const PRIORITY_LABELS: Record<Priority, { label: string; color: string; icon: string }> = {
  critical: { label: "Critique", color: "red", icon: "🔴" },
  urgent: { label: "Urgent", color: "orange", icon: "🟠" },
  high: { label: "Élevé", color: "amber", icon: "🟡" },
  normal: { label: "Normal", color: "blue", icon: "🔵" },
  low: { label: "Faible", color: "neutral", icon: "⚪" },
};

export const STATUS_LABELS: Record<ModerationItemStatus, { label: string; color: string }> = {
  pending: { label: "En attente", color: "amber" },
  in_review: { label: "En examen", color: "blue" },
  approved: { label: "Approuvé", color: "green" },
  rejected: { label: "Rejeté", color: "red" },
  escalated: { label: "Escaladé", color: "purple" },
  appealed: { label: "En appel", color: "orange" },
};

export const CONTENT_TYPE_LABELS: Record<ContentType, { label: string; icon: string }> = {
  post: { label: "Publication", icon: "📝" },
  comment: { label: "Commentaire", icon: "💬" },
  message: { label: "Message", icon: "✉️" },
  profile: { label: "Profil", icon: "👤" },
  group: { label: "Groupe", icon: "👥" },
  media: { label: "Média", icon: "🖼️" },
};
