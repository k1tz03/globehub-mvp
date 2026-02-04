"use client";

import { create } from "zustand";

// Types de sanctions
export type SanctionType =
  | "warning"          // Avertissement simple
  | "content_removal"  // Suppression de contenu
  | "posting_restriction" // Restriction de publication
  | "suspension"       // Suspension temporaire
  | "ban";             // Bannissement permanent

export type SanctionReason =
  | "spam"
  | "hate_speech"
  | "harassment"
  | "violence"
  | "misinformation"
  | "inappropriate_content"
  | "copyright"
  | "impersonation"
  | "self_harm_promotion"
  | "illegal_content"
  | "repeated_violations"
  | "other";

export interface Sanction {
  id: string;

  // Utilisateur sanctionné
  userId: string;
  userHandle: string;
  userEmail: string;

  // Type et raison
  type: SanctionType;
  reason: SanctionReason;
  reasonDetails?: string;

  // Contenu concerné (si applicable)
  relatedContentId?: string;
  relatedContentType?: "post" | "comment" | "message" | "profile";

  // Durée (pour suspensions)
  duration?: number; // en jours
  expiresAt?: string;
  isPermanent: boolean;

  // Points de strike
  strikePoints: number; // Chaque sanction ajoute des points

  // Traitement
  issuedAt: string;
  issuedBy: string;

  // Appel
  appealable: boolean;
  appealed: boolean;
  appealId?: string;

  // Révocation
  revoked: boolean;
  revokedAt?: string;
  revokedBy?: string;
  revokeReason?: string;

  // Notification
  userNotified: boolean;
  notifiedAt?: string;
}

// Historique utilisateur
export interface UserSanctionProfile {
  userId: string;
  userHandle: string;

  // Points de strike actuels
  currentStrikePoints: number;
  maxStrikePoints: number; // 10 = ban auto

  // Statut actuel
  currentStatus: "good_standing" | "warned" | "restricted" | "suspended" | "banned";
  statusSince: string;
  statusExpiresAt?: string;

  // Historique
  totalWarnings: number;
  totalSuspensions: number;
  activeSanctions: string[]; // IDs des sanctions actives

  // Dates importantes
  firstSanctionAt?: string;
  lastSanctionAt?: string;
  lastAppealAt?: string;

  // Niveau de risque
  riskLevel: "low" | "medium" | "high" | "critical";

  // Notes modération
  moderatorNotes?: string;
}

// Seuils de strikes
const STRIKE_THRESHOLDS = {
  warning: 3,
  restriction: 5,
  suspension: 7,
  ban: 10,
};

// Points par type de sanction
const STRIKE_POINTS: Record<SanctionType, number> = {
  warning: 1,
  content_removal: 1,
  posting_restriction: 2,
  suspension: 3,
  ban: 10,
};

// Durées de suspension par défaut (en jours)
const DEFAULT_SUSPENSION_DURATIONS: Record<number, number> = {
  1: 1,   // 1er strike de suspension = 1 jour
  2: 7,   // 2e = 7 jours
  3: 30,  // 3e = 30 jours
};

interface SanctionsState {
  sanctions: Sanction[];
  userProfiles: Map<string, UserSanctionProfile>;
  ready: boolean;

  // === SANCTIONS ===

  // Émettre un avertissement
  issueWarning: (data: {
    userId: string;
    userHandle: string;
    userEmail: string;
    reason: SanctionReason;
    reasonDetails?: string;
    relatedContentId?: string;
    relatedContentType?: "post" | "comment" | "message" | "profile";
    moderatorHandle: string;
  }) => Sanction;

  // Supprimer du contenu avec sanction
  removeContentWithSanction: (data: {
    userId: string;
    userHandle: string;
    userEmail: string;
    contentId: string;
    contentType: "post" | "comment" | "message";
    reason: SanctionReason;
    reasonDetails?: string;
    moderatorHandle: string;
  }) => Sanction;

  // Suspendre un utilisateur
  suspendUser: (data: {
    userId: string;
    userHandle: string;
    userEmail: string;
    reason: SanctionReason;
    reasonDetails?: string;
    durationDays: number;
    moderatorHandle: string;
  }) => Sanction;

  // Bannir un utilisateur
  banUser: (data: {
    userId: string;
    userHandle: string;
    userEmail: string;
    reason: SanctionReason;
    reasonDetails?: string;
    moderatorHandle: string;
  }) => Sanction;

  // Révoquer une sanction
  revokeSanction: (sanctionId: string, reason: string, moderatorHandle: string) => void;

  // === PROFIL UTILISATEUR ===

  getUserProfile: (userId: string) => UserSanctionProfile | undefined;
  updateUserProfile: (userId: string) => void;
  addModeratorNote: (userId: string, note: string) => void;

  // === VÉRIFICATIONS ===

  canUserPost: (userId: string) => { allowed: boolean; reason?: string };
  canUserComment: (userId: string) => { allowed: boolean; reason?: string };
  canUserMessage: (userId: string) => { allowed: boolean; reason?: string };

  // === QUERIES ===

  getSanctionById: (id: string) => Sanction | undefined;
  getUserSanctions: (userId: string) => Sanction[];
  getActiveSanctions: () => Sanction[];
  getRecentSanctions: (limit?: number) => Sanction[];
  getSanctionsByType: (type: SanctionType) => Sanction[];

  // === ESCALADE AUTOMATIQUE ===

  checkAutoEscalation: (userId: string) => SanctionType | null;
  applyAutoEscalation: (userId: string, moderatorHandle: string) => Sanction | null;

  // === STATS ===

  getStats: () => {
    totalSanctions: number;
    activeWarnings: number;
    activeSuspensions: number;
    activeBans: number;
    issuedToday: number;
    issuedThisWeek: number;
    byReason: Record<SanctionReason, number>;
    byType: Record<SanctionType, number>;
    highRiskUsers: number;
  };
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function calculateRiskLevel(profile: UserSanctionProfile): "low" | "medium" | "high" | "critical" {
  if (profile.currentStrikePoints >= 8) return "critical";
  if (profile.currentStrikePoints >= 5) return "high";
  if (profile.currentStrikePoints >= 2) return "medium";
  return "low";
}

function calculateStatus(profile: UserSanctionProfile, sanctions: Sanction[]): UserSanctionProfile["currentStatus"] {
  const activeSanctions = sanctions.filter(s =>
    s.userId === profile.userId && !s.revoked &&
    (!s.expiresAt || new Date(s.expiresAt) > new Date())
  );

  if (activeSanctions.some(s => s.type === "ban")) return "banned";
  if (activeSanctions.some(s => s.type === "suspension")) return "suspended";
  if (activeSanctions.some(s => s.type === "posting_restriction")) return "restricted";
  if (activeSanctions.some(s => s.type === "warning")) return "warned";
  return "good_standing";
}

const STORAGE_KEY = "globehub_sanctions_v1";

export const useSanctionsStore = create<SanctionsState>((set, get) => ({
  sanctions: [],
  userProfiles: new Map(),
  ready: true,

  issueWarning: (data) => {
    const sanction: Sanction = {
      id: `sanc_${uid()}`,
      userId: data.userId,
      userHandle: data.userHandle,
      userEmail: data.userEmail,
      type: "warning",
      reason: data.reason,
      reasonDetails: data.reasonDetails,
      relatedContentId: data.relatedContentId,
      relatedContentType: data.relatedContentType,
      strikePoints: STRIKE_POINTS.warning,
      isPermanent: false,
      issuedAt: new Date().toISOString(),
      issuedBy: data.moderatorHandle,
      appealable: true,
      appealed: false,
      revoked: false,
      userNotified: false,
    };

    set({ sanctions: [...get().sanctions, sanction] });
    get().updateUserProfile(data.userId);
    return sanction;
  },

  removeContentWithSanction: (data) => {
    const sanction: Sanction = {
      id: `sanc_${uid()}`,
      userId: data.userId,
      userHandle: data.userHandle,
      userEmail: data.userEmail,
      type: "content_removal",
      reason: data.reason,
      reasonDetails: data.reasonDetails,
      relatedContentId: data.contentId,
      relatedContentType: data.contentType,
      strikePoints: STRIKE_POINTS.content_removal,
      isPermanent: false,
      issuedAt: new Date().toISOString(),
      issuedBy: data.moderatorHandle,
      appealable: true,
      appealed: false,
      revoked: false,
      userNotified: false,
    };

    set({ sanctions: [...get().sanctions, sanction] });
    get().updateUserProfile(data.userId);
    return sanction;
  },

  suspendUser: (data) => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + data.durationDays);

    const sanction: Sanction = {
      id: `sanc_${uid()}`,
      userId: data.userId,
      userHandle: data.userHandle,
      userEmail: data.userEmail,
      type: "suspension",
      reason: data.reason,
      reasonDetails: data.reasonDetails,
      duration: data.durationDays,
      expiresAt: expiresAt.toISOString(),
      strikePoints: STRIKE_POINTS.suspension,
      isPermanent: false,
      issuedAt: new Date().toISOString(),
      issuedBy: data.moderatorHandle,
      appealable: true,
      appealed: false,
      revoked: false,
      userNotified: false,
    };

    set({ sanctions: [...get().sanctions, sanction] });
    get().updateUserProfile(data.userId);
    return sanction;
  },

  banUser: (data) => {
    const sanction: Sanction = {
      id: `sanc_${uid()}`,
      userId: data.userId,
      userHandle: data.userHandle,
      userEmail: data.userEmail,
      type: "ban",
      reason: data.reason,
      reasonDetails: data.reasonDetails,
      strikePoints: STRIKE_POINTS.ban,
      isPermanent: true,
      issuedAt: new Date().toISOString(),
      issuedBy: data.moderatorHandle,
      appealable: true,
      appealed: false,
      revoked: false,
      userNotified: false,
    };

    set({ sanctions: [...get().sanctions, sanction] });
    get().updateUserProfile(data.userId);
    return sanction;
  },

  revokeSanction: (sanctionId, reason, moderatorHandle) => {
    const { sanctions } = get();
    const sanction = sanctions.find(s => s.id === sanctionId);
    if (!sanction) return;

    const updated = sanctions.map(s => {
      if (s.id !== sanctionId) return s;
      return {
        ...s,
        revoked: true,
        revokedAt: new Date().toISOString(),
        revokedBy: moderatorHandle,
        revokeReason: reason,
      };
    });

    set({ sanctions: updated });
    get().updateUserProfile(sanction.userId);
  },

  getUserProfile: (userId) => {
    return get().userProfiles.get(userId);
  },

  updateUserProfile: (userId) => {
    const { sanctions, userProfiles } = get();
    const userSanctions = sanctions.filter(s => s.userId === userId && !s.revoked);

    if (userSanctions.length === 0) {
      userProfiles.delete(userId);
      set({ userProfiles: new Map(userProfiles) });
      return;
    }

    const activeSanctions = userSanctions.filter(s =>
      !s.expiresAt || new Date(s.expiresAt) > new Date()
    );

    const currentStrikePoints = activeSanctions.reduce((sum, s) => sum + s.strikePoints, 0);
    const totalWarnings = userSanctions.filter(s => s.type === "warning").length;
    const totalSuspensions = userSanctions.filter(s => s.type === "suspension").length;

    const existing = userProfiles.get(userId);
    const profile: UserSanctionProfile = {
      userId,
      userHandle: userSanctions[0].userHandle,
      currentStrikePoints: Math.min(currentStrikePoints, 10),
      maxStrikePoints: 10,
      currentStatus: "good_standing", // Will be calculated
      statusSince: new Date().toISOString(),
      totalWarnings,
      totalSuspensions,
      activeSanctions: activeSanctions.map(s => s.id),
      firstSanctionAt: userSanctions.length > 0
        ? userSanctions.sort((a, b) => new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime())[0].issuedAt
        : undefined,
      lastSanctionAt: userSanctions.length > 0
        ? userSanctions.sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime())[0].issuedAt
        : undefined,
      riskLevel: "low",
      moderatorNotes: existing?.moderatorNotes,
    };

    profile.currentStatus = calculateStatus(profile, sanctions);
    profile.riskLevel = calculateRiskLevel(profile);

    // Update expiration for suspensions
    const activeSuspension = activeSanctions.find(s => s.type === "suspension" && s.expiresAt);
    if (activeSuspension) {
      profile.statusExpiresAt = activeSuspension.expiresAt;
    }

    const newProfiles = new Map(userProfiles);
    newProfiles.set(userId, profile);
    set({ userProfiles: newProfiles });
  },

  addModeratorNote: (userId, note) => {
    const { userProfiles } = get();
    const profile = userProfiles.get(userId);
    if (!profile) return;

    const timestamp = new Date().toISOString();
    const newNote = profile.moderatorNotes
      ? `${profile.moderatorNotes}\n[${timestamp}] ${note}`
      : `[${timestamp}] ${note}`;

    const newProfiles = new Map(userProfiles);
    newProfiles.set(userId, { ...profile, moderatorNotes: newNote });
    set({ userProfiles: newProfiles });
  },

  canUserPost: (userId) => {
    const profile = get().getUserProfile(userId);
    if (!profile) return { allowed: true };

    if (profile.currentStatus === "banned") {
      return { allowed: false, reason: "Votre compte est banni." };
    }
    if (profile.currentStatus === "suspended") {
      return {
        allowed: false,
        reason: `Compte suspendu jusqu'au ${profile.statusExpiresAt ? new Date(profile.statusExpiresAt).toLocaleDateString() : "indéfiniment"}.`
      };
    }
    if (profile.currentStatus === "restricted") {
      return { allowed: false, reason: "Publication restreinte suite à des violations." };
    }
    return { allowed: true };
  },

  canUserComment: (userId) => {
    return get().canUserPost(userId);
  },

  canUserMessage: (userId) => {
    const profile = get().getUserProfile(userId);
    if (!profile) return { allowed: true };

    if (profile.currentStatus === "banned" || profile.currentStatus === "suspended") {
      return { allowed: false, reason: "Messagerie désactivée." };
    }
    return { allowed: true };
  },

  getSanctionById: (id) => {
    return get().sanctions.find(s => s.id === id);
  },

  getUserSanctions: (userId) => {
    return get().sanctions.filter(s => s.userId === userId);
  },

  getActiveSanctions: () => {
    return get().sanctions.filter(s =>
      !s.revoked && (!s.expiresAt || new Date(s.expiresAt) > new Date())
    );
  },

  getRecentSanctions: (limit = 50) => {
    return get().sanctions
      .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime())
      .slice(0, limit);
  },

  getSanctionsByType: (type) => {
    return get().sanctions.filter(s => s.type === type);
  },

  checkAutoEscalation: (userId) => {
    const profile = get().getUserProfile(userId);
    if (!profile) return null;

    if (profile.currentStrikePoints >= STRIKE_THRESHOLDS.ban) return "ban";
    if (profile.currentStrikePoints >= STRIKE_THRESHOLDS.suspension) return "suspension";
    if (profile.currentStrikePoints >= STRIKE_THRESHOLDS.restriction) return "posting_restriction";
    return null;
  },

  applyAutoEscalation: (userId, moderatorHandle) => {
    const escalationType = get().checkAutoEscalation(userId);
    if (!escalationType) return null;

    const profile = get().getUserProfile(userId);
    if (!profile) return null;

    const userSanctions = get().getUserSanctions(userId);
    const latestSanction = userSanctions[userSanctions.length - 1];

    if (escalationType === "ban") {
      return get().banUser({
        userId,
        userHandle: profile.userHandle,
        userEmail: latestSanction?.userEmail || "",
        reason: "repeated_violations",
        reasonDetails: `Auto-escalade: ${profile.currentStrikePoints} points de strike atteints`,
        moderatorHandle,
      });
    }

    if (escalationType === "suspension") {
      const suspensionCount = profile.totalSuspensions + 1;
      const duration = DEFAULT_SUSPENSION_DURATIONS[suspensionCount] || 30;

      return get().suspendUser({
        userId,
        userHandle: profile.userHandle,
        userEmail: latestSanction?.userEmail || "",
        reason: "repeated_violations",
        reasonDetails: `Auto-escalade: ${profile.currentStrikePoints} points de strike atteints`,
        durationDays: duration,
        moderatorHandle,
      });
    }

    return null;
  },

  getStats: () => {
    const { sanctions, userProfiles } = get();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const active = sanctions.filter(s =>
      !s.revoked && (!s.expiresAt || new Date(s.expiresAt) > now)
    );

    const byReason = sanctions.reduce((acc, s) => {
      acc[s.reason] = (acc[s.reason] || 0) + 1;
      return acc;
    }, {} as Record<SanctionReason, number>);

    const byType = sanctions.reduce((acc, s) => {
      acc[s.type] = (acc[s.type] || 0) + 1;
      return acc;
    }, {} as Record<SanctionType, number>);

    const highRiskUsers = Array.from(userProfiles.values()).filter(p =>
      p.riskLevel === "high" || p.riskLevel === "critical"
    ).length;

    return {
      totalSanctions: sanctions.length,
      activeWarnings: active.filter(s => s.type === "warning").length,
      activeSuspensions: active.filter(s => s.type === "suspension").length,
      activeBans: active.filter(s => s.type === "ban").length,
      issuedToday: sanctions.filter(s => new Date(s.issuedAt) >= today).length,
      issuedThisWeek: sanctions.filter(s => new Date(s.issuedAt) >= weekAgo).length,
      byReason,
      byType,
      highRiskUsers,
    };
  },
}));

// Labels
export const SANCTION_TYPE_LABELS: Record<SanctionType, { label: string; icon: string; color: string }> = {
  warning: { label: "Avertissement", icon: "⚠️", color: "amber" },
  content_removal: { label: "Suppression de contenu", icon: "🗑️", color: "orange" },
  posting_restriction: { label: "Restriction", icon: "🚫", color: "red" },
  suspension: { label: "Suspension", icon: "⏸️", color: "red" },
  ban: { label: "Bannissement", icon: "🔨", color: "red" },
};

export const SANCTION_REASON_LABELS: Record<SanctionReason, string> = {
  spam: "Spam",
  hate_speech: "Discours haineux",
  harassment: "Harcèlement",
  violence: "Violence",
  misinformation: "Désinformation",
  inappropriate_content: "Contenu inapproprié",
  copyright: "Violation du droit d'auteur",
  impersonation: "Usurpation d'identité",
  self_harm_promotion: "Promotion de l'automutilation",
  illegal_content: "Contenu illégal",
  repeated_violations: "Violations répétées",
  other: "Autre",
};

export const STATUS_LABELS: Record<UserSanctionProfile["currentStatus"], { label: string; color: string; icon: string }> = {
  good_standing: { label: "En règle", color: "green", icon: "✅" },
  warned: { label: "Averti", color: "amber", icon: "⚠️" },
  restricted: { label: "Restreint", color: "orange", icon: "🚫" },
  suspended: { label: "Suspendu", color: "red", icon: "⏸️" },
  banned: { label: "Banni", color: "red", icon: "🔨" },
};

export const RISK_LEVEL_LABELS: Record<UserSanctionProfile["riskLevel"], { label: string; color: string }> = {
  low: { label: "Faible", color: "green" },
  medium: { label: "Moyen", color: "amber" },
  high: { label: "Élevé", color: "orange" },
  critical: { label: "Critique", color: "red" },
};
