"use client";

import { create } from "zustand";

// Types de décisions pouvant faire l'objet d'un appel
export type AppealableDecision =
  | "post_hidden"        // Post masqué
  | "post_deleted"       // Post supprimé
  | "account_suspended"  // Compte suspendu
  | "account_banned"     // Compte banni
  | "content_flagged"    // Contenu signalé
  | "comment_deleted"    // Commentaire supprimé
  | "group_banned";      // Groupe banni

export type AppealStatus =
  | "pending"        // En attente d'examen
  | "under_review"   // En cours d'examen
  | "approved"       // Appel accepté (décision annulée)
  | "rejected"       // Appel rejeté (décision maintenue)
  | "escalated"      // Escaladé à un niveau supérieur
  | "withdrawn";     // Retiré par l'utilisateur

export type AppealPriority = "low" | "medium" | "high" | "urgent";

export interface Appeal {
  id: string;

  // Informations sur l'appelant
  userId: string;
  userHandle: string;
  userEmail: string;

  // Décision contestée
  decisionType: AppealableDecision;
  decisionId: string; // ID du post/commentaire/action concerné
  decisionDate: string;
  decisionReason: string;
  originalModerator?: string;

  // Contenu de l'appel
  appealReason: string;
  additionalContext?: string;
  evidenceUrls?: string[]; // URLs de preuves fournies

  // Statut et traitement
  status: AppealStatus;
  priority: AppealPriority;
  createdAt: string;
  updatedAt: string;

  // Assignation
  assignedTo?: string;
  assignedAt?: string;

  // Résolution
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: {
    decision: "upheld" | "overturned" | "partially_overturned";
    explanation: string;
    actionsTaken: string[];
  };

  // Communication
  messages: Array<{
    id: string;
    from: "user" | "moderator" | "system";
    senderHandle?: string;
    text: string;
    timestamp: string;
    isInternal: boolean; // Notes internes non visibles par l'utilisateur
  }>;

  // SLA
  slaDeadline: string; // Délai légal de réponse
  isOverdue: boolean;

  // Métriques
  viewCount: number;
  responseTime?: number; // Temps de première réponse en heures
}

// Template de réponse
export interface AppealResponseTemplate {
  id: string;
  name: string;
  category: "approval" | "rejection" | "request_info" | "escalation";
  subject: string;
  body: string;
  variables: string[]; // Ex: {{username}}, {{postId}}
}

interface AppealsState {
  appeals: Appeal[];
  templates: AppealResponseTemplate[];
  ready: boolean;

  // === CRÉATION ===
  createAppeal: (data: {
    userId: string;
    userHandle: string;
    userEmail: string;
    decisionType: AppealableDecision;
    decisionId: string;
    decisionDate: string;
    decisionReason: string;
    originalModerator?: string;
    appealReason: string;
    additionalContext?: string;
    evidenceUrls?: string[];
  }) => Appeal;

  // === TRAITEMENT ===
  assignAppeal: (appealId: string, moderatorHandle: string) => void;
  startReview: (appealId: string, moderatorHandle: string) => void;
  escalateAppeal: (appealId: string, reason: string, moderatorHandle: string) => void;

  // === RÉSOLUTION ===
  approveAppeal: (appealId: string, explanation: string, actionsTaken: string[], moderatorHandle: string) => void;
  rejectAppeal: (appealId: string, explanation: string, moderatorHandle: string) => void;
  partiallyApproveAppeal: (appealId: string, explanation: string, actionsTaken: string[], moderatorHandle: string) => void;

  // === COMMUNICATION ===
  addMessage: (appealId: string, text: string, from: "user" | "moderator" | "system", senderHandle?: string, isInternal?: boolean) => void;
  withdrawAppeal: (appealId: string) => void;

  // === QUERIES ===
  getAppealById: (appealId: string) => Appeal | undefined;
  getUserAppeals: (userId: string) => Appeal[];
  getPendingAppeals: () => Appeal[];
  getOverdueAppeals: () => Appeal[];
  getAppealsByStatus: (status: AppealStatus) => Appeal[];
  getAssignedAppeals: (moderatorHandle: string) => Appeal[];

  // === TEMPLATES ===
  addTemplate: (template: Omit<AppealResponseTemplate, "id">) => AppealResponseTemplate;
  updateTemplate: (id: string, updates: Partial<AppealResponseTemplate>) => void;
  deleteTemplate: (id: string) => void;
  applyTemplate: (templateId: string, variables: Record<string, string>) => string;

  // === STATS ===
  getStats: () => {
    totalAppeals: number;
    pendingAppeals: number;
    overdueAppeals: number;
    avgResolutionTime: number; // en heures
    approvalRate: number; // pourcentage
    byStatus: Record<AppealStatus, number>;
    byDecisionType: Record<AppealableDecision, number>;
    thisWeek: number;
    thisMonth: number;
  };
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// Délai SLA par défaut (DSA: 24h pour contenu illégal manifeste, sinon délai raisonnable)
const SLA_HOURS_BY_TYPE: Record<AppealableDecision, number> = {
  post_hidden: 72,
  post_deleted: 72,
  account_suspended: 48,
  account_banned: 48,
  content_flagged: 72,
  comment_deleted: 72,
  group_banned: 72,
};

function calculateSlaDeadline(decisionType: AppealableDecision): string {
  const deadline = new Date();
  deadline.setHours(deadline.getHours() + SLA_HOURS_BY_TYPE[decisionType]);
  return deadline.toISOString();
}

function isOverdue(slaDeadline: string): boolean {
  return new Date(slaDeadline) < new Date();
}

function calculatePriority(decisionType: AppealableDecision): AppealPriority {
  if (decisionType === "account_banned" || decisionType === "account_suspended") {
    return "high";
  }
  if (decisionType === "post_deleted" || decisionType === "group_banned") {
    return "medium";
  }
  return "low";
}

const STORAGE_KEY = "globehub_appeals_v1";

// Templates par défaut
const defaultTemplates: AppealResponseTemplate[] = [
  {
    id: "tpl_approval_standard",
    name: "Approbation standard",
    category: "approval",
    subject: "Votre appel a été accepté",
    body: `Bonjour {{username}},

Après examen de votre appel concernant {{decisionType}}, nous avons décidé d'annuler la décision initiale.

{{explanation}}

Nous nous excusons pour tout désagrément causé.

Cordialement,
L'équipe de modération GlobeHub`,
    variables: ["username", "decisionType", "explanation"],
  },
  {
    id: "tpl_rejection_standard",
    name: "Rejet standard",
    category: "rejection",
    subject: "Décision concernant votre appel",
    body: `Bonjour {{username}},

Après examen approfondi de votre appel, nous avons décidé de maintenir la décision initiale.

Raison : {{explanation}}

Vous pouvez contacter notre DPO à dpo@globehub.com si vous souhaitez contester cette décision.

Cordialement,
L'équipe de modération GlobeHub`,
    variables: ["username", "explanation"],
  },
  {
    id: "tpl_request_info",
    name: "Demande d'informations",
    category: "request_info",
    subject: "Informations complémentaires requises",
    body: `Bonjour {{username}},

Pour traiter votre appel, nous avons besoin d'informations complémentaires :

{{questions}}

Merci de répondre dans les 7 jours.

Cordialement,
L'équipe de modération GlobeHub`,
    variables: ["username", "questions"],
  },
  {
    id: "tpl_escalation",
    name: "Escalade",
    category: "escalation",
    subject: "Votre appel a été escaladé",
    body: `Bonjour {{username}},

Votre appel a été transmis à un niveau supérieur de notre équipe pour un examen plus approfondi.

Raison de l'escalade : {{reason}}

Vous recevrez une réponse dans les meilleurs délais.

Cordialement,
L'équipe de modération GlobeHub`,
    variables: ["username", "reason"],
  },
];

// Appels de démo
const demoAppeals: Appeal[] = [
  {
    id: "appeal_demo_1",
    userId: "usr_demo1",
    userHandle: "protest_user",
    userEmail: "protest@example.com",
    decisionType: "post_deleted",
    decisionId: "post_123",
    decisionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    decisionReason: "Contenu signalé comme spam par plusieurs utilisateurs",
    originalModerator: "mod_alice",
    appealReason: "Mon post n'était pas du spam, c'était une critique légitime d'un produit avec des liens vers des sources fiables.",
    additionalContext: "J'ai partagé mon expérience personnelle avec ce produit et inclus des liens vers des avis vérifiés.",
    status: "pending",
    priority: "medium",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    slaDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    isOverdue: false,
    messages: [],
    viewCount: 0,
  },
  {
    id: "appeal_demo_2",
    userId: "usr_demo2",
    userHandle: "banned_user",
    userEmail: "banned@example.com",
    decisionType: "account_suspended",
    decisionId: "suspension_456",
    decisionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    decisionReason: "Violations répétées des conditions d'utilisation",
    originalModerator: "mod_bob",
    appealReason: "Je n'ai jamais violé les conditions. Mon compte a été piraté et quelqu'un d'autre a posté ces contenus.",
    additionalContext: "J'ai des preuves que mon compte a été compromis : tentatives de connexion depuis des IPs étrangères.",
    evidenceUrls: ["https://example.com/proof1.png"],
    status: "under_review",
    priority: "high",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    assignedTo: "admin",
    assignedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    slaDeadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // En retard !
    isOverdue: true,
    messages: [
      {
        id: "msg_1",
        from: "moderator",
        senderHandle: "admin",
        text: "Nous examinons les logs de connexion de votre compte.",
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        isInternal: false,
      },
    ],
    viewCount: 3,
    responseTime: 48,
  },
];

export const useAppealsStore = create<AppealsState>((set, get) => ({
  appeals: demoAppeals,
  templates: defaultTemplates,
  ready: true,

  createAppeal: (data) => {
    const appeal: Appeal = {
      id: `appeal_${uid()}`,
      userId: data.userId,
      userHandle: data.userHandle,
      userEmail: data.userEmail,
      decisionType: data.decisionType,
      decisionId: data.decisionId,
      decisionDate: data.decisionDate,
      decisionReason: data.decisionReason,
      originalModerator: data.originalModerator,
      appealReason: data.appealReason,
      additionalContext: data.additionalContext,
      evidenceUrls: data.evidenceUrls,
      status: "pending",
      priority: calculatePriority(data.decisionType),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      slaDeadline: calculateSlaDeadline(data.decisionType),
      isOverdue: false,
      messages: [
        {
          id: `msg_${uid()}`,
          from: "system",
          text: "Appel créé. Un modérateur examinera votre demande dans les meilleurs délais.",
          timestamp: new Date().toISOString(),
          isInternal: false,
        },
      ],
      viewCount: 0,
    };

    set({ appeals: [...get().appeals, appeal] });
    return appeal;
  },

  assignAppeal: (appealId, moderatorHandle) => {
    const { appeals } = get();
    const updated = appeals.map(a => {
      if (a.id !== appealId) return a;
      return {
        ...a,
        assignedTo: moderatorHandle,
        assignedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [
          ...a.messages,
          {
            id: `msg_${uid()}`,
            from: "system" as const,
            text: `Appel assigné à @${moderatorHandle}`,
            timestamp: new Date().toISOString(),
            isInternal: true,
          },
        ],
      };
    });
    set({ appeals: updated });
  },

  startReview: (appealId, moderatorHandle) => {
    const { appeals } = get();
    const appeal = appeals.find(a => a.id === appealId);
    const now = new Date();

    const updated = appeals.map(a => {
      if (a.id !== appealId) return a;

      // Calculer le temps de réponse si c'est la première prise en charge
      let responseTime = a.responseTime;
      if (!responseTime && a.createdAt) {
        const created = new Date(a.createdAt);
        responseTime = Math.round((now.getTime() - created.getTime()) / (1000 * 60 * 60));
      }

      return {
        ...a,
        status: "under_review" as const,
        assignedTo: a.assignedTo || moderatorHandle,
        assignedAt: a.assignedAt || now.toISOString(),
        updatedAt: now.toISOString(),
        responseTime,
        viewCount: a.viewCount + 1,
        messages: [
          ...a.messages,
          {
            id: `msg_${uid()}`,
            from: "system" as const,
            text: "Votre appel est maintenant en cours d'examen.",
            timestamp: now.toISOString(),
            isInternal: false,
          },
        ],
      };
    });
    set({ appeals: updated });
  },

  escalateAppeal: (appealId, reason, moderatorHandle) => {
    const { appeals } = get();
    const updated = appeals.map(a => {
      if (a.id !== appealId) return a;
      return {
        ...a,
        status: "escalated" as const,
        priority: "urgent" as const,
        updatedAt: new Date().toISOString(),
        messages: [
          ...a.messages,
          {
            id: `msg_${uid()}`,
            from: "moderator" as const,
            senderHandle: moderatorHandle,
            text: `Appel escaladé. Raison: ${reason}`,
            timestamp: new Date().toISOString(),
            isInternal: true,
          },
          {
            id: `msg_${uid()}`,
            from: "system" as const,
            text: "Votre appel a été transmis à un niveau supérieur pour examen approfondi.",
            timestamp: new Date().toISOString(),
            isInternal: false,
          },
        ],
      };
    });
    set({ appeals: updated });
  },

  approveAppeal: (appealId, explanation, actionsTaken, moderatorHandle) => {
    const { appeals } = get();
    const updated = appeals.map(a => {
      if (a.id !== appealId) return a;
      return {
        ...a,
        status: "approved" as const,
        resolvedAt: new Date().toISOString(),
        resolvedBy: moderatorHandle,
        updatedAt: new Date().toISOString(),
        resolution: {
          decision: "overturned" as const,
          explanation,
          actionsTaken,
        },
        messages: [
          ...a.messages,
          {
            id: `msg_${uid()}`,
            from: "moderator" as const,
            senderHandle: moderatorHandle,
            text: `Appel approuvé. ${explanation}`,
            timestamp: new Date().toISOString(),
            isInternal: false,
          },
        ],
      };
    });
    set({ appeals: updated });
  },

  rejectAppeal: (appealId, explanation, moderatorHandle) => {
    const { appeals } = get();
    const updated = appeals.map(a => {
      if (a.id !== appealId) return a;
      return {
        ...a,
        status: "rejected" as const,
        resolvedAt: new Date().toISOString(),
        resolvedBy: moderatorHandle,
        updatedAt: new Date().toISOString(),
        resolution: {
          decision: "upheld" as const,
          explanation,
          actionsTaken: [],
        },
        messages: [
          ...a.messages,
          {
            id: `msg_${uid()}`,
            from: "moderator" as const,
            senderHandle: moderatorHandle,
            text: `Décision maintenue. ${explanation}`,
            timestamp: new Date().toISOString(),
            isInternal: false,
          },
        ],
      };
    });
    set({ appeals: updated });
  },

  partiallyApproveAppeal: (appealId, explanation, actionsTaken, moderatorHandle) => {
    const { appeals } = get();
    const updated = appeals.map(a => {
      if (a.id !== appealId) return a;
      return {
        ...a,
        status: "approved" as const,
        resolvedAt: new Date().toISOString(),
        resolvedBy: moderatorHandle,
        updatedAt: new Date().toISOString(),
        resolution: {
          decision: "partially_overturned" as const,
          explanation,
          actionsTaken,
        },
        messages: [
          ...a.messages,
          {
            id: `msg_${uid()}`,
            from: "moderator" as const,
            senderHandle: moderatorHandle,
            text: `Appel partiellement accepté. ${explanation}`,
            timestamp: new Date().toISOString(),
            isInternal: false,
          },
        ],
      };
    });
    set({ appeals: updated });
  },

  addMessage: (appealId, text, from, senderHandle, isInternal = false) => {
    const { appeals } = get();
    const updated = appeals.map(a => {
      if (a.id !== appealId) return a;
      return {
        ...a,
        updatedAt: new Date().toISOString(),
        messages: [
          ...a.messages,
          {
            id: `msg_${uid()}`,
            from,
            senderHandle,
            text,
            timestamp: new Date().toISOString(),
            isInternal,
          },
        ],
      };
    });
    set({ appeals: updated });
  },

  withdrawAppeal: (appealId) => {
    const { appeals } = get();
    const updated = appeals.map(a => {
      if (a.id !== appealId) return a;
      return {
        ...a,
        status: "withdrawn" as const,
        updatedAt: new Date().toISOString(),
        messages: [
          ...a.messages,
          {
            id: `msg_${uid()}`,
            from: "system" as const,
            text: "Appel retiré par l'utilisateur.",
            timestamp: new Date().toISOString(),
            isInternal: false,
          },
        ],
      };
    });
    set({ appeals: updated });
  },

  getAppealById: (appealId) => {
    return get().appeals.find(a => a.id === appealId);
  },

  getUserAppeals: (userId) => {
    return get().appeals.filter(a => a.userId === userId);
  },

  getPendingAppeals: () => {
    return get().appeals.filter(a => a.status === "pending" || a.status === "under_review" || a.status === "escalated");
  },

  getOverdueAppeals: () => {
    return get().appeals.filter(a =>
      (a.status === "pending" || a.status === "under_review") && isOverdue(a.slaDeadline)
    ).map(a => ({ ...a, isOverdue: true }));
  },

  getAppealsByStatus: (status) => {
    return get().appeals.filter(a => a.status === status);
  },

  getAssignedAppeals: (moderatorHandle) => {
    return get().appeals.filter(a => a.assignedTo === moderatorHandle && a.status !== "approved" && a.status !== "rejected" && a.status !== "withdrawn");
  },

  addTemplate: (template) => {
    const newTemplate: AppealResponseTemplate = {
      ...template,
      id: `tpl_${uid()}`,
    };
    set({ templates: [...get().templates, newTemplate] });
    return newTemplate;
  },

  updateTemplate: (id, updates) => {
    const { templates } = get();
    const updated = templates.map(t => t.id === id ? { ...t, ...updates } : t);
    set({ templates: updated });
  },

  deleteTemplate: (id) => {
    const { templates } = get();
    set({ templates: templates.filter(t => t.id !== id) });
  },

  applyTemplate: (templateId, variables) => {
    const template = get().templates.find(t => t.id === templateId);
    if (!template) return "";

    let result = template.body;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, "g"), value);
    }
    return result;
  },

  getStats: () => {
    const { appeals } = get();
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const resolved = appeals.filter(a => a.status === "approved" || a.status === "rejected");
    const approved = appeals.filter(a => a.status === "approved");
    const pending = appeals.filter(a => a.status === "pending" || a.status === "under_review" || a.status === "escalated");
    const overdue = pending.filter(a => isOverdue(a.slaDeadline));

    // Temps moyen de résolution
    const avgTime = resolved.length > 0
      ? resolved.reduce((sum, a) => {
          if (!a.resolvedAt || !a.createdAt) return sum;
          return sum + (new Date(a.resolvedAt).getTime() - new Date(a.createdAt).getTime());
        }, 0) / resolved.length / (1000 * 60 * 60)
      : 0;

    // Stats par statut
    const byStatus = appeals.reduce((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {} as Record<AppealStatus, number>);

    // Stats par type de décision
    const byDecisionType = appeals.reduce((acc, a) => {
      acc[a.decisionType] = (acc[a.decisionType] || 0) + 1;
      return acc;
    }, {} as Record<AppealableDecision, number>);

    return {
      totalAppeals: appeals.length,
      pendingAppeals: pending.length,
      overdueAppeals: overdue.length,
      avgResolutionTime: Math.round(avgTime),
      approvalRate: resolved.length > 0 ? Math.round((approved.length / resolved.length) * 100) : 0,
      byStatus,
      byDecisionType,
      thisWeek: appeals.filter(a => new Date(a.createdAt) >= weekAgo).length,
      thisMonth: appeals.filter(a => new Date(a.createdAt) >= monthAgo).length,
    };
  },
}));

// Labels pour l'interface
export const DECISION_TYPE_LABELS: Record<AppealableDecision, { label: string; icon: string }> = {
  post_hidden: { label: "Post masqué", icon: "👁️‍🗨️" },
  post_deleted: { label: "Post supprimé", icon: "🗑️" },
  account_suspended: { label: "Compte suspendu", icon: "⏸️" },
  account_banned: { label: "Compte banni", icon: "🚫" },
  content_flagged: { label: "Contenu signalé", icon: "🚩" },
  comment_deleted: { label: "Commentaire supprimé", icon: "💬" },
  group_banned: { label: "Groupe banni", icon: "👥" },
};

export const APPEAL_STATUS_LABELS: Record<AppealStatus, { label: string; color: string; icon: string }> = {
  pending: { label: "En attente", color: "amber", icon: "⏳" },
  under_review: { label: "En examen", color: "blue", icon: "🔍" },
  approved: { label: "Accepté", color: "green", icon: "✅" },
  rejected: { label: "Rejeté", color: "red", icon: "❌" },
  escalated: { label: "Escaladé", color: "purple", icon: "⬆️" },
  withdrawn: { label: "Retiré", color: "neutral", icon: "↩️" },
};

export const PRIORITY_LABELS: Record<AppealPriority, { label: string; color: string }> = {
  low: { label: "Basse", color: "neutral" },
  medium: { label: "Moyenne", color: "blue" },
  high: { label: "Haute", color: "amber" },
  urgent: { label: "Urgente", color: "red" },
};
