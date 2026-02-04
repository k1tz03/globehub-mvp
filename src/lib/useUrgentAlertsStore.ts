"use client";

import { create } from "zustand";

// Types de contenu critique nécessitant une action urgente
export type UrgentContentType =
  | "terrorism"           // Contenu terroriste (< 1h)
  | "csam"               // Exploitation d'enfants (immédiat)
  | "imminent_violence"  // Violence imminente
  | "self_harm"          // Risque de suicide/automutilation
  | "illegal_sale"       // Vente de produits illégaux (armes, drogues)
  | "doxxing"            // Publication d'informations privées
  | "impersonation"      // Usurpation d'identité grave
  | "mass_harassment";   // Harcèlement coordonné

export type AlertSeverity = "critical" | "high" | "medium";

export type AlertStatus =
  | "new"           // Nouvelle alerte
  | "acknowledged"  // Prise en compte
  | "investigating" // En cours d'investigation
  | "actioned"      // Action prise
  | "escalated"     // Escaladée aux autorités
  | "false_positive"; // Faux positif

export interface UrgentAlert {
  id: string;

  // Contenu concerné
  contentType: "post" | "comment" | "message" | "profile";
  contentId: string;
  contentText: string;
  contentAuthorHandle: string;
  contentAuthorId: string;
  contentUrl?: string;
  contentMediaUrls?: string[];

  // Classification
  alertType: UrgentContentType;
  severity: AlertSeverity;
  confidence: number; // 0-100, score de confiance de la détection

  // Détection
  detectedAt: string;
  detectedBy: "ai" | "keyword" | "user_report" | "manual";
  detectionDetails?: string;
  matchedKeywords?: string[];

  // SLA (Service Level Agreement)
  slaDeadline: string;
  slaHours: number;
  isOverdue: boolean;

  // Traitement
  status: AlertStatus;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  actionedAt?: string;
  actionedBy?: string;
  actionTaken?: string;

  // Escalade
  escalatedToAuthorities: boolean;
  escalatedAt?: string;
  authorityReference?: string; // Numéro de référence des autorités

  // Preuves conservées
  evidencePreserved: boolean;
  evidenceExpiresAt?: string; // Conservation légale 1 an minimum

  // Notes
  notes: Array<{
    id: string;
    text: string;
    author: string;
    timestamp: string;
    isConfidential: boolean;
  }>;
}

// Mots-clés de détection par catégorie
const CRITICAL_KEYWORDS: Record<UrgentContentType, string[]> = {
  terrorism: [
    "bombe", "explosif", "attentat", "djihad", "daesh", "isis", "al-qaida",
    "attaque", "terroriste", "kalashnikov", "c4", "détonateur"
  ],
  csam: [
    // Intentionnellement vague pour éviter les faux positifs
    "cp", "pedo", "minor", "underage"
  ],
  imminent_violence: [
    "je vais tuer", "je vais buter", "massacre", "fusillade", "bain de sang",
    "exterminer", "éliminer tous"
  ],
  self_harm: [
    "me suicider", "en finir", "plus envie de vivre", "me tuer",
    "sauter du pont", "overdose", "couper les veines"
  ],
  illegal_sale: [
    "vends arme", "acheter drogue", "cocaïne", "héroïne", "fentanyl",
    "arme automatique", "glock", "ak47"
  ],
  doxxing: [
    "voici son adresse", "voici où il habite", "son numéro privé",
    "sa famille habite"
  ],
  impersonation: [
    "je suis vraiment", "compte officiel", "vrai compte de"
  ],
  mass_harassment: [
    "harcelons", "raid", "attaquons son compte", "tous ensemble contre"
  ],
};

// SLA par type (en heures)
const SLA_BY_TYPE: Record<UrgentContentType, number> = {
  terrorism: 1,
  csam: 0.25, // 15 minutes
  imminent_violence: 1,
  self_harm: 1,
  illegal_sale: 4,
  doxxing: 2,
  impersonation: 4,
  mass_harassment: 2,
};

// Sévérité par type
const SEVERITY_BY_TYPE: Record<UrgentContentType, AlertSeverity> = {
  terrorism: "critical",
  csam: "critical",
  imminent_violence: "critical",
  self_harm: "critical",
  illegal_sale: "high",
  doxxing: "high",
  impersonation: "medium",
  mass_harassment: "high",
};

interface UrgentAlertsState {
  alerts: UrgentAlert[];
  ready: boolean;

  // === DÉTECTION ===
  scanContent: (content: {
    type: "post" | "comment" | "message" | "profile";
    id: string;
    text: string;
    authorHandle: string;
    authorId: string;
    mediaUrls?: string[];
  }) => UrgentAlert | null;

  // Signalement manuel
  reportUrgent: (data: {
    contentType: "post" | "comment" | "message" | "profile";
    contentId: string;
    contentText: string;
    contentAuthorHandle: string;
    contentAuthorId: string;
    alertType: UrgentContentType;
    reporterHandle: string;
    details?: string;
  }) => UrgentAlert;

  // === TRAITEMENT ===
  acknowledgeAlert: (alertId: string, moderatorHandle: string) => void;
  startInvestigation: (alertId: string, moderatorHandle: string) => void;
  takeAction: (alertId: string, action: string, moderatorHandle: string) => void;
  markFalsePositive: (alertId: string, reason: string, moderatorHandle: string) => void;

  // === ESCALADE ===
  escalateToAuthorities: (alertId: string, authorityReference: string, moderatorHandle: string) => void;

  // === PREUVES ===
  preserveEvidence: (alertId: string) => void;

  // === NOTES ===
  addNote: (alertId: string, text: string, author: string, isConfidential?: boolean) => void;

  // === REQUÊTES ===
  getActiveAlerts: () => UrgentAlert[];
  getCriticalAlerts: () => UrgentAlert[];
  getOverdueAlerts: () => UrgentAlert[];
  getAlertsByType: (type: UrgentContentType) => UrgentAlert[];
  getAlertById: (id: string) => UrgentAlert | undefined;

  // === STATS ===
  getStats: () => {
    total: number;
    critical: number;
    overdue: number;
    actionedToday: number;
    averageResponseTime: number;
    byType: Record<UrgentContentType, number>;
    byStatus: Record<AlertStatus, number>;
  };
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function calculateSlaDeadline(type: UrgentContentType): string {
  const deadline = new Date();
  deadline.setHours(deadline.getHours() + SLA_BY_TYPE[type]);
  return deadline.toISOString();
}

function isOverdue(deadline: string): boolean {
  return new Date(deadline) < new Date();
}

// Détecter le type de contenu urgent
function detectUrgentContent(text: string): { type: UrgentContentType; keywords: string[]; confidence: number } | null {
  const lowerText = text.toLowerCase();
  let bestMatch: { type: UrgentContentType; keywords: string[]; confidence: number } | null = null;

  for (const [type, keywords] of Object.entries(CRITICAL_KEYWORDS) as [UrgentContentType, string[]][]) {
    const matched = keywords.filter(kw => lowerText.includes(kw.toLowerCase()));
    if (matched.length > 0) {
      const confidence = Math.min(100, matched.length * 30 + 20);
      if (!bestMatch || confidence > bestMatch.confidence || SEVERITY_BY_TYPE[type] === "critical") {
        bestMatch = { type, keywords: matched, confidence };
        // Si c'est critique, on s'arrête là
        if (SEVERITY_BY_TYPE[type] === "critical") break;
      }
    }
  }

  return bestMatch;
}

const STORAGE_KEY = "globehub_urgent_alerts_v1";

export const useUrgentAlertsStore = create<UrgentAlertsState>((set, get) => ({
  alerts: [],
  ready: true,

  scanContent: (content) => {
    const detection = detectUrgentContent(content.text);
    if (!detection) return null;

    const alert: UrgentAlert = {
      id: `alert_${uid()}`,
      contentType: content.type,
      contentId: content.id,
      contentText: content.text,
      contentAuthorHandle: content.authorHandle,
      contentAuthorId: content.authorId,
      contentMediaUrls: content.mediaUrls,
      alertType: detection.type,
      severity: SEVERITY_BY_TYPE[detection.type],
      confidence: detection.confidence,
      detectedAt: new Date().toISOString(),
      detectedBy: "keyword",
      matchedKeywords: detection.keywords,
      slaDeadline: calculateSlaDeadline(detection.type),
      slaHours: SLA_BY_TYPE[detection.type],
      isOverdue: false,
      status: "new",
      escalatedToAuthorities: false,
      evidencePreserved: false,
      notes: [],
    };

    set({ alerts: [...get().alerts, alert] });
    return alert;
  },

  reportUrgent: (data) => {
    const alert: UrgentAlert = {
      id: `alert_${uid()}`,
      contentType: data.contentType,
      contentId: data.contentId,
      contentText: data.contentText,
      contentAuthorHandle: data.contentAuthorHandle,
      contentAuthorId: data.contentAuthorId,
      alertType: data.alertType,
      severity: SEVERITY_BY_TYPE[data.alertType],
      confidence: 80, // Rapport manuel = confiance élevée
      detectedAt: new Date().toISOString(),
      detectedBy: "user_report",
      detectionDetails: data.details,
      slaDeadline: calculateSlaDeadline(data.alertType),
      slaHours: SLA_BY_TYPE[data.alertType],
      isOverdue: false,
      status: "new",
      escalatedToAuthorities: false,
      evidencePreserved: false,
      notes: [
        {
          id: `note_${uid()}`,
          text: `Signalé par @${data.reporterHandle}: ${data.details || "Aucun détail fourni"}`,
          author: data.reporterHandle,
          timestamp: new Date().toISOString(),
          isConfidential: false,
        },
      ],
    };

    set({ alerts: [...get().alerts, alert] });
    return alert;
  },

  acknowledgeAlert: (alertId, moderatorHandle) => {
    const { alerts } = get();
    const updated = alerts.map(a => {
      if (a.id !== alertId) return a;
      return {
        ...a,
        status: "acknowledged" as const,
        acknowledgedAt: new Date().toISOString(),
        acknowledgedBy: moderatorHandle,
      };
    });
    set({ alerts: updated });
  },

  startInvestigation: (alertId, moderatorHandle) => {
    const { alerts } = get();
    const updated = alerts.map(a => {
      if (a.id !== alertId) return a;
      return {
        ...a,
        status: "investigating" as const,
        notes: [
          ...a.notes,
          {
            id: `note_${uid()}`,
            text: `Investigation démarrée par @${moderatorHandle}`,
            author: moderatorHandle,
            timestamp: new Date().toISOString(),
            isConfidential: true,
          },
        ],
      };
    });
    set({ alerts: updated });
  },

  takeAction: (alertId, action, moderatorHandle) => {
    const { alerts } = get();
    const updated = alerts.map(a => {
      if (a.id !== alertId) return a;
      return {
        ...a,
        status: "actioned" as const,
        actionedAt: new Date().toISOString(),
        actionedBy: moderatorHandle,
        actionTaken: action,
        notes: [
          ...a.notes,
          {
            id: `note_${uid()}`,
            text: `Action prise: ${action}`,
            author: moderatorHandle,
            timestamp: new Date().toISOString(),
            isConfidential: false,
          },
        ],
      };
    });
    set({ alerts: updated });
  },

  markFalsePositive: (alertId, reason, moderatorHandle) => {
    const { alerts } = get();
    const updated = alerts.map(a => {
      if (a.id !== alertId) return a;
      return {
        ...a,
        status: "false_positive" as const,
        actionedAt: new Date().toISOString(),
        actionedBy: moderatorHandle,
        notes: [
          ...a.notes,
          {
            id: `note_${uid()}`,
            text: `Marqué comme faux positif: ${reason}`,
            author: moderatorHandle,
            timestamp: new Date().toISOString(),
            isConfidential: true,
          },
        ],
      };
    });
    set({ alerts: updated });
  },

  escalateToAuthorities: (alertId, authorityReference, moderatorHandle) => {
    const { alerts } = get();
    const updated = alerts.map(a => {
      if (a.id !== alertId) return a;
      return {
        ...a,
        status: "escalated" as const,
        escalatedToAuthorities: true,
        escalatedAt: new Date().toISOString(),
        authorityReference,
        notes: [
          ...a.notes,
          {
            id: `note_${uid()}`,
            text: `Escaladé aux autorités. Référence: ${authorityReference}`,
            author: moderatorHandle,
            timestamp: new Date().toISOString(),
            isConfidential: true,
          },
        ],
      };
    });
    set({ alerts: updated });
  },

  preserveEvidence: (alertId) => {
    const { alerts } = get();
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // Conservation 1 an

    const updated = alerts.map(a => {
      if (a.id !== alertId) return a;
      return {
        ...a,
        evidencePreserved: true,
        evidenceExpiresAt: expiresAt.toISOString(),
      };
    });
    set({ alerts: updated });
  },

  addNote: (alertId, text, author, isConfidential = false) => {
    const { alerts } = get();
    const updated = alerts.map(a => {
      if (a.id !== alertId) return a;
      return {
        ...a,
        notes: [
          ...a.notes,
          {
            id: `note_${uid()}`,
            text,
            author,
            timestamp: new Date().toISOString(),
            isConfidential,
          },
        ],
      };
    });
    set({ alerts: updated });
  },

  getActiveAlerts: () => {
    return get().alerts.filter(a =>
      a.status === "new" || a.status === "acknowledged" || a.status === "investigating"
    );
  },

  getCriticalAlerts: () => {
    return get().alerts.filter(a =>
      a.severity === "critical" && (a.status === "new" || a.status === "acknowledged" || a.status === "investigating")
    );
  },

  getOverdueAlerts: () => {
    return get().alerts
      .filter(a => (a.status === "new" || a.status === "acknowledged" || a.status === "investigating") && isOverdue(a.slaDeadline))
      .map(a => ({ ...a, isOverdue: true }));
  },

  getAlertsByType: (type) => {
    return get().alerts.filter(a => a.alertType === type);
  },

  getAlertById: (id) => {
    return get().alerts.find(a => a.id === id);
  },

  getStats: () => {
    const { alerts } = get();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const active = alerts.filter(a => a.status === "new" || a.status === "acknowledged" || a.status === "investigating");
    const critical = active.filter(a => a.severity === "critical");
    const overdue = active.filter(a => isOverdue(a.slaDeadline));
    const actionedToday = alerts.filter(a =>
      a.status === "actioned" && a.actionedAt && new Date(a.actionedAt) >= today
    );

    // Temps moyen de réponse
    const actioned = alerts.filter(a => a.status === "actioned" && a.actionedAt && a.detectedAt);
    const avgTime = actioned.length > 0
      ? actioned.reduce((sum, a) => {
          const detected = new Date(a.detectedAt).getTime();
          const acted = new Date(a.actionedAt!).getTime();
          return sum + (acted - detected);
        }, 0) / actioned.length / (1000 * 60) // en minutes
      : 0;

    const byType = alerts.reduce((acc, a) => {
      acc[a.alertType] = (acc[a.alertType] || 0) + 1;
      return acc;
    }, {} as Record<UrgentContentType, number>);

    const byStatus = alerts.reduce((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {} as Record<AlertStatus, number>);

    return {
      total: alerts.length,
      critical: critical.length,
      overdue: overdue.length,
      actionedToday: actionedToday.length,
      averageResponseTime: Math.round(avgTime),
      byType,
      byStatus,
    };
  },
}));

// Labels pour l'interface
export const ALERT_TYPE_LABELS: Record<UrgentContentType, { label: string; icon: string; description: string }> = {
  terrorism: { label: "Terrorisme", icon: "💣", description: "Contenu terroriste ou apologie" },
  csam: { label: "CSAM", icon: "🚨", description: "Exploitation sexuelle de mineurs" },
  imminent_violence: { label: "Violence imminente", icon: "⚔️", description: "Menace de violence imminente" },
  self_harm: { label: "Automutilation", icon: "💔", description: "Risque de suicide ou automutilation" },
  illegal_sale: { label: "Vente illégale", icon: "🔫", description: "Vente d'armes ou drogues" },
  doxxing: { label: "Doxxing", icon: "📍", description: "Publication d'informations privées" },
  impersonation: { label: "Usurpation", icon: "🎭", description: "Usurpation d'identité grave" },
  mass_harassment: { label: "Harcèlement de masse", icon: "👥", description: "Harcèlement coordonné" },
};

export const ALERT_STATUS_LABELS: Record<AlertStatus, { label: string; color: string }> = {
  new: { label: "Nouveau", color: "red" },
  acknowledged: { label: "Pris en compte", color: "amber" },
  investigating: { label: "Investigation", color: "blue" },
  actioned: { label: "Traité", color: "green" },
  escalated: { label: "Escaladé", color: "purple" },
  false_positive: { label: "Faux positif", color: "neutral" },
};

export const SEVERITY_LABELS: Record<AlertSeverity, { label: string; color: string }> = {
  critical: { label: "Critique", color: "red" },
  high: { label: "Haute", color: "amber" },
  medium: { label: "Moyenne", color: "blue" },
};
