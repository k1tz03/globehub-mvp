"use client";

import { create } from "zustand";

// Types de demandes RGPD
export type PrivacyRequestType =
  | "data_export"      // Droit d'accès - export des données
  | "data_deletion"    // Droit à l'oubli - suppression
  | "data_rectification" // Droit de rectification
  | "processing_restriction" // Limitation du traitement
  | "data_portability" // Portabilité des données
  | "consent_withdrawal"; // Retrait du consentement

export type PrivacyRequestStatus =
  | "pending"      // En attente
  | "processing"   // En cours de traitement
  | "completed"    // Terminée
  | "rejected"     // Rejetée (avec motif)
  | "expired";     // Expirée (délai dépassé)

export interface PrivacyRequest {
  id: string;
  userId: string;
  userHandle: string;
  userEmail: string;
  type: PrivacyRequestType;
  status: PrivacyRequestStatus;

  // Détails de la demande
  reason?: string;
  specificData?: string[]; // Données spécifiques demandées

  // Traitement
  createdAt: string;
  processedAt?: string;
  processedBy?: string;
  completedAt?: string;

  // Résultat
  rejectionReason?: string;
  exportFileUrl?: string;
  exportFileSize?: number;

  // Délai légal (30 jours max RGPD)
  deadline: string;
  isOverdue: boolean;

  // Notes admin
  adminNotes?: string;
}

// Consentement utilisateur
export interface UserConsent {
  userId: string;
  userHandle: string;

  // Types de consentements
  essentialCookies: boolean; // Toujours true
  analyticsCookies: boolean;
  marketingCookies: boolean;
  thirdPartyCookies: boolean;

  // Communications
  emailMarketing: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;

  // Données
  locationTracking: boolean;
  activityTracking: boolean;
  personalization: boolean;

  // Métadonnées
  consentedAt: string;
  lastUpdatedAt: string;
  ipAddress?: string;
  userAgent?: string;

  // Historique des changements
  history: Array<{
    timestamp: string;
    field: string;
    oldValue: boolean;
    newValue: boolean;
    source: "user" | "admin" | "system";
  }>;
}

// Registre des traitements (Article 30 RGPD)
export interface ProcessingActivity {
  id: string;
  name: string;
  description: string;

  // Responsable
  controller: string;
  processor?: string;
  dpo?: string;

  // Catégories de données
  dataCategories: string[];
  dataSubjects: string[]; // Catégories de personnes concernées

  // Finalités
  purposes: string[];
  legalBasis: "consent" | "contract" | "legal_obligation" | "vital_interests" | "public_task" | "legitimate_interests";

  // Destinataires
  recipients: string[];
  thirdCountryTransfers?: string[];

  // Conservation
  retentionPeriod: string;
  retentionCriteria?: string;

  // Sécurité
  securityMeasures: string[];

  // Métadonnées
  createdAt: string;
  updatedAt: string;
  status: "active" | "archived";
}

// Données anonymisées d'un utilisateur supprimé
export interface AnonymizedUser {
  id: string;
  originalUserId: string;
  deletedAt: string;
  deletedBy: "user" | "admin";
  reason?: string;

  // Stats agrégées (non identifiables)
  aggregatedStats: {
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    accountAgeInDays: number;
  };
}

interface PrivacyState {
  // Demandes RGPD
  requests: PrivacyRequest[];

  // Consentements
  consents: Map<string, UserConsent>;

  // Registre des traitements
  processingActivities: ProcessingActivity[];

  // Utilisateurs anonymisés
  anonymizedUsers: AnonymizedUser[];

  ready: boolean;

  // === DEMANDES RGPD ===

  // Créer une demande
  createRequest: (data: {
    userId: string;
    userHandle: string;
    userEmail: string;
    type: PrivacyRequestType;
    reason?: string;
    specificData?: string[];
  }) => PrivacyRequest;

  // Traiter une demande
  processRequest: (requestId: string, adminHandle: string) => void;

  // Compléter une demande
  completeRequest: (requestId: string, data?: { exportFileUrl?: string; exportFileSize?: number }) => void;

  // Rejeter une demande
  rejectRequest: (requestId: string, reason: string, adminHandle: string) => void;

  // Ajouter une note admin
  addAdminNote: (requestId: string, note: string) => void;

  // Obtenir les demandes en attente
  getPendingRequests: () => PrivacyRequest[];

  // Obtenir les demandes en retard
  getOverdueRequests: () => PrivacyRequest[];

  // Obtenir les demandes d'un utilisateur
  getUserRequests: (userId: string) => PrivacyRequest[];

  // === CONSENTEMENTS ===

  // Mettre à jour le consentement d'un utilisateur
  updateConsent: (userId: string, userHandle: string, updates: Partial<UserConsent>, source?: "user" | "admin" | "system") => void;

  // Obtenir le consentement d'un utilisateur
  getUserConsent: (userId: string) => UserConsent | null;

  // Retirer tous les consentements (sauf essentiels)
  withdrawAllConsents: (userId: string) => void;

  // === REGISTRE DES TRAITEMENTS ===

  // Ajouter une activité de traitement
  addProcessingActivity: (activity: Omit<ProcessingActivity, "id" | "createdAt" | "updatedAt">) => ProcessingActivity;

  // Mettre à jour une activité
  updateProcessingActivity: (id: string, updates: Partial<ProcessingActivity>) => void;

  // Archiver une activité
  archiveProcessingActivity: (id: string) => void;

  // === SUPPRESSION / ANONYMISATION ===

  // Générer les données d'export pour un utilisateur
  generateExportData: (userId: string, userHandle: string) => UserExportData;

  // Anonymiser un utilisateur (après suppression)
  anonymizeUser: (userId: string, deletedBy: "user" | "admin", reason?: string, stats?: AnonymizedUser["aggregatedStats"]) => void;

  // === STATS ===
  getStats: () => {
    totalRequests: number;
    pendingRequests: number;
    overdueRequests: number;
    completedThisMonth: number;
    averageProcessingTime: number; // en jours
    requestsByType: Record<PrivacyRequestType, number>;
  };
}

// Structure des données exportées
export interface UserExportData {
  exportedAt: string;
  userId: string;
  userHandle: string;

  // Profil
  profile: {
    username: string;
    email: string;
    bio?: string;
    avatar?: string;
    location?: string;
    website?: string;
    createdAt: string;
    isVerified: boolean;
  };

  // Relations
  relations: {
    followers: string[];
    following: string[];
    blockedUsers: string[];
  };

  // Contenu
  content: {
    posts: Array<{
      id: string;
      text: string;
      createdAt: string;
      likes: number;
      location?: { lat: number; lon: number };
    }>;
    comments: Array<{
      id: string;
      postId: string;
      text: string;
      createdAt: string;
    }>;
    messages: Array<{
      conversationId: string;
      text: string;
      sentAt: string;
      recipient: string;
    }>;
  };

  // Activité
  activity: {
    loginHistory: Array<{ date: string; ip?: string }>;
    searchHistory: string[];
    likedPostIds: string[];
  };

  // Consentements
  consents: UserConsent | null;

  // Paramètres
  settings: Record<string, unknown>;
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

const STORAGE_KEY = "globehub_privacy_v1";

// Activités de traitement par défaut
const defaultProcessingActivities: ProcessingActivity[] = [
  {
    id: "proc_user_accounts",
    name: "Gestion des comptes utilisateurs",
    description: "Création, modification et suppression des comptes utilisateurs",
    controller: "GlobeHub SAS",
    dpo: "dpo@globehub.com",
    dataCategories: ["Identité", "Coordonnées", "Identifiants de connexion"],
    dataSubjects: ["Utilisateurs inscrits"],
    purposes: ["Fourniture du service", "Authentification", "Communication"],
    legalBasis: "contract",
    recipients: ["Hébergeur (Vercel)", "Service email (SendGrid)"],
    retentionPeriod: "Durée du compte + 3 ans",
    securityMeasures: ["Chiffrement", "Hachage des mots de passe", "HTTPS"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "active",
  },
  {
    id: "proc_content",
    name: "Publication de contenu",
    description: "Gestion des posts, commentaires et médias publiés",
    controller: "GlobeHub SAS",
    dpo: "dpo@globehub.com",
    dataCategories: ["Contenu généré", "Géolocalisation", "Médias"],
    dataSubjects: ["Utilisateurs inscrits"],
    purposes: ["Fourniture du service", "Modération", "Analyse"],
    legalBasis: "contract",
    recipients: ["CDN (Cloudflare)", "Modérateurs"],
    retentionPeriod: "Durée du compte + 1 an",
    securityMeasures: ["Modération automatique", "Signalement", "Backup"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "active",
  },
  {
    id: "proc_analytics",
    name: "Analyse d'audience",
    description: "Collecte de statistiques anonymisées pour améliorer le service",
    controller: "GlobeHub SAS",
    dpo: "dpo@globehub.com",
    dataCategories: ["Données de navigation", "Appareil", "Localisation approximative"],
    dataSubjects: ["Tous les visiteurs"],
    purposes: ["Amélioration du service", "Statistiques"],
    legalBasis: "consent",
    recipients: ["Analytics interne"],
    retentionPeriod: "26 mois",
    securityMeasures: ["Anonymisation", "Agrégation"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "active",
  },
  {
    id: "proc_marketing",
    name: "Communications marketing",
    description: "Envoi de newsletters et communications promotionnelles",
    controller: "GlobeHub SAS",
    dpo: "dpo@globehub.com",
    dataCategories: ["Email", "Préférences"],
    dataSubjects: ["Utilisateurs ayant consenti"],
    purposes: ["Marketing", "Fidélisation"],
    legalBasis: "consent",
    recipients: ["Service email (SendGrid)"],
    retentionPeriod: "Jusqu'au retrait du consentement",
    securityMeasures: ["Opt-out facile", "Gestion des préférences"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "active",
  },
];

// Délai légal RGPD : 30 jours
const GDPR_DEADLINE_DAYS = 30;

function calculateDeadline(): string {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + GDPR_DEADLINE_DAYS);
  return deadline.toISOString();
}

function isOverdue(deadline: string): boolean {
  return new Date(deadline) < new Date();
}

export const usePrivacyStore = create<PrivacyState>((set, get) => ({
  requests: [],
  consents: new Map(),
  processingActivities: defaultProcessingActivities,
  anonymizedUsers: [],
  ready: true,

  createRequest: (data) => {
    const request: PrivacyRequest = {
      id: `req_${uid()}`,
      userId: data.userId,
      userHandle: data.userHandle,
      userEmail: data.userEmail,
      type: data.type,
      status: "pending",
      reason: data.reason,
      specificData: data.specificData,
      createdAt: new Date().toISOString(),
      deadline: calculateDeadline(),
      isOverdue: false,
    };

    const newRequests = [...get().requests, request];
    set({ requests: newRequests });

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        requests: newRequests,
        consents: Array.from(get().consents.entries()),
        processingActivities: get().processingActivities,
        anonymizedUsers: get().anonymizedUsers,
      }));
    } catch {}

    return request;
  },

  processRequest: (requestId, adminHandle) => {
    const { requests } = get();
    const updated = requests.map(r => {
      if (r.id !== requestId) return r;
      return {
        ...r,
        status: "processing" as const,
        processedAt: new Date().toISOString(),
        processedBy: adminHandle,
      };
    });
    set({ requests: updated });
  },

  completeRequest: (requestId, data) => {
    const { requests } = get();
    const updated = requests.map(r => {
      if (r.id !== requestId) return r;
      return {
        ...r,
        status: "completed" as const,
        completedAt: new Date().toISOString(),
        exportFileUrl: data?.exportFileUrl,
        exportFileSize: data?.exportFileSize,
      };
    });
    set({ requests: updated });
  },

  rejectRequest: (requestId, reason, adminHandle) => {
    const { requests } = get();
    const updated = requests.map(r => {
      if (r.id !== requestId) return r;
      return {
        ...r,
        status: "rejected" as const,
        rejectionReason: reason,
        processedBy: adminHandle,
        completedAt: new Date().toISOString(),
      };
    });
    set({ requests: updated });
  },

  addAdminNote: (requestId, note) => {
    const { requests } = get();
    const updated = requests.map(r => {
      if (r.id !== requestId) return r;
      return {
        ...r,
        adminNotes: r.adminNotes ? `${r.adminNotes}\n---\n${note}` : note,
      };
    });
    set({ requests: updated });
  },

  getPendingRequests: () => {
    return get().requests.filter(r => r.status === "pending" || r.status === "processing");
  },

  getOverdueRequests: () => {
    return get().requests.filter(r =>
      (r.status === "pending" || r.status === "processing") && isOverdue(r.deadline)
    ).map(r => ({ ...r, isOverdue: true }));
  },

  getUserRequests: (userId) => {
    return get().requests.filter(r => r.userId === userId);
  },

  updateConsent: (userId, userHandle, updates, source = "user") => {
    const { consents } = get();
    const existing = consents.get(userId);
    const now = new Date().toISOString();

    const history: UserConsent["history"] = existing?.history || [];

    // Enregistrer les changements dans l'historique
    for (const [key, value] of Object.entries(updates)) {
      if (typeof value === "boolean" && existing && existing[key as keyof UserConsent] !== value) {
        history.push({
          timestamp: now,
          field: key,
          oldValue: existing[key as keyof UserConsent] as boolean,
          newValue: value,
          source,
        });
      }
    }

    const newConsent: UserConsent = {
      userId,
      userHandle,
      essentialCookies: true,
      analyticsCookies: existing?.analyticsCookies ?? false,
      marketingCookies: existing?.marketingCookies ?? false,
      thirdPartyCookies: existing?.thirdPartyCookies ?? false,
      emailMarketing: existing?.emailMarketing ?? false,
      pushNotifications: existing?.pushNotifications ?? false,
      smsNotifications: existing?.smsNotifications ?? false,
      locationTracking: existing?.locationTracking ?? false,
      activityTracking: existing?.activityTracking ?? false,
      personalization: existing?.personalization ?? false,
      consentedAt: existing?.consentedAt ?? now,
      lastUpdatedAt: now,
      history,
      ...updates,
    };

    const newConsents = new Map(consents);
    newConsents.set(userId, newConsent);
    set({ consents: newConsents });
  },

  getUserConsent: (userId) => {
    return get().consents.get(userId) || null;
  },

  withdrawAllConsents: (userId) => {
    const { consents } = get();
    const existing = consents.get(userId);
    if (!existing) return;

    get().updateConsent(userId, existing.userHandle, {
      analyticsCookies: false,
      marketingCookies: false,
      thirdPartyCookies: false,
      emailMarketing: false,
      pushNotifications: false,
      smsNotifications: false,
      locationTracking: false,
      activityTracking: false,
      personalization: false,
    }, "user");
  },

  addProcessingActivity: (activity) => {
    const newActivity: ProcessingActivity = {
      ...activity,
      id: `proc_${uid()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [...get().processingActivities, newActivity];
    set({ processingActivities: updated });
    return newActivity;
  },

  updateProcessingActivity: (id, updates) => {
    const { processingActivities } = get();
    const updated = processingActivities.map(a => {
      if (a.id !== id) return a;
      return { ...a, ...updates, updatedAt: new Date().toISOString() };
    });
    set({ processingActivities: updated });
  },

  archiveProcessingActivity: (id) => {
    get().updateProcessingActivity(id, { status: "archived" });
  },

  generateExportData: (userId, userHandle) => {
    // Cette fonction serait appelée avec les vraies données de l'utilisateur
    // Ici on retourne une structure vide comme template
    const exportData: UserExportData = {
      exportedAt: new Date().toISOString(),
      userId,
      userHandle,
      profile: {
        username: "",
        email: "",
        createdAt: "",
        isVerified: false,
      },
      relations: {
        followers: [],
        following: [],
        blockedUsers: [],
      },
      content: {
        posts: [],
        comments: [],
        messages: [],
      },
      activity: {
        loginHistory: [],
        searchHistory: [],
        likedPostIds: [],
      },
      consents: get().getUserConsent(userId),
      settings: {},
    };

    return exportData;
  },

  anonymizeUser: (userId, deletedBy, reason, stats) => {
    const anonymized: AnonymizedUser = {
      id: `anon_${uid()}`,
      originalUserId: userId,
      deletedAt: new Date().toISOString(),
      deletedBy,
      reason,
      aggregatedStats: stats || {
        totalPosts: 0,
        totalLikes: 0,
        totalComments: 0,
        accountAgeInDays: 0,
      },
    };

    set({ anonymizedUsers: [...get().anonymizedUsers, anonymized] });
  },

  getStats: () => {
    const { requests } = get();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const pendingRequests = requests.filter(r => r.status === "pending" || r.status === "processing");
    const overdueRequests = pendingRequests.filter(r => isOverdue(r.deadline));
    const completedThisMonth = requests.filter(r =>
      r.status === "completed" && r.completedAt && new Date(r.completedAt) >= monthStart
    );

    // Calcul du temps moyen de traitement
    const completedWithTimes = requests.filter(r => r.status === "completed" && r.completedAt && r.createdAt);
    const avgTime = completedWithTimes.length > 0
      ? completedWithTimes.reduce((sum, r) => {
          const created = new Date(r.createdAt).getTime();
          const completed = new Date(r.completedAt!).getTime();
          return sum + (completed - created);
        }, 0) / completedWithTimes.length / (1000 * 60 * 60 * 24) // en jours
      : 0;

    const requestsByType = requests.reduce((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    }, {} as Record<PrivacyRequestType, number>);

    return {
      totalRequests: requests.length,
      pendingRequests: pendingRequests.length,
      overdueRequests: overdueRequests.length,
      completedThisMonth: completedThisMonth.length,
      averageProcessingTime: Math.round(avgTime * 10) / 10,
      requestsByType,
    };
  },
}));

// Labels pour l'interface
export const PRIVACY_REQUEST_TYPE_LABELS: Record<PrivacyRequestType, { label: string; icon: string; description: string }> = {
  data_export: {
    label: "Export des données",
    icon: "📦",
    description: "Obtenir une copie de toutes vos données personnelles",
  },
  data_deletion: {
    label: "Suppression du compte",
    icon: "🗑️",
    description: "Supprimer définitivement votre compte et vos données",
  },
  data_rectification: {
    label: "Rectification",
    icon: "✏️",
    description: "Corriger des données inexactes vous concernant",
  },
  processing_restriction: {
    label: "Limitation du traitement",
    icon: "🚫",
    description: "Limiter l'utilisation de vos données",
  },
  data_portability: {
    label: "Portabilité",
    icon: "📤",
    description: "Transférer vos données vers un autre service",
  },
  consent_withdrawal: {
    label: "Retrait du consentement",
    icon: "↩️",
    description: "Retirer vos consentements précédemment donnés",
  },
};

export const PRIVACY_REQUEST_STATUS_LABELS: Record<PrivacyRequestStatus, { label: string; color: string }> = {
  pending: { label: "En attente", color: "amber" },
  processing: { label: "En cours", color: "blue" },
  completed: { label: "Terminée", color: "green" },
  rejected: { label: "Rejetée", color: "red" },
  expired: { label: "Expirée", color: "neutral" },
};

export const LEGAL_BASIS_LABELS: Record<ProcessingActivity["legalBasis"], string> = {
  consent: "Consentement",
  contract: "Exécution d'un contrat",
  legal_obligation: "Obligation légale",
  vital_interests: "Intérêts vitaux",
  public_task: "Mission d'intérêt public",
  legitimate_interests: "Intérêts légitimes",
};
