"use client";

import { create } from "zustand";

// Modules du système avec leurs permissions
export type PermissionModule =
  | "dashboard"
  | "moderation"
  | "users"
  | "content"
  | "reports"
  | "appeals"
  | "privacy"
  | "transparency"
  | "security"
  | "urgent_alerts"
  | "sanctions"
  | "groups"
  | "analytics"
  | "settings"
  | "automation";

// Actions possibles par module
export type PermissionAction = "view" | "create" | "edit" | "delete" | "approve" | "escalate" | "export";

// Permission complète
export interface Permission {
  module: PermissionModule;
  actions: PermissionAction[];
}

// Rôle personnalisé
export interface CustomRole {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;

  // Permissions
  permissions: Permission[];

  // Limitations
  maxActionsPerDay?: number;
  requiresDualApproval?: boolean;
  canOnlyModerateOwnRegion?: boolean;

  // Meta
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  isSystem: boolean; // Rôles système non modifiables
}

// Audit log entry
export interface AuditLogEntry {
  id: string;
  timestamp: string;

  // Acteur
  actorId: string;
  actorHandle: string;
  actorRole: string;

  // Action
  action: string;
  module: PermissionModule;
  targetType?: "user" | "post" | "comment" | "group" | "report" | "appeal" | "sanction" | "setting";
  targetId?: string;

  // Détails
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;

  // Résultat
  success: boolean;
  errorMessage?: string;

  // Sensibilité
  isSensitive: boolean;
  requiresReview?: boolean;
}

// Rôles système par défaut
const SYSTEM_ROLES: CustomRole[] = [
  {
    id: "role_super_admin",
    name: "Super Admin",
    description: "Accès complet à toutes les fonctionnalités",
    color: "#dc2626",
    icon: "👑",
    permissions: [
      { module: "dashboard", actions: ["view"] },
      { module: "moderation", actions: ["view", "create", "edit", "delete", "approve", "escalate", "export"] },
      { module: "users", actions: ["view", "create", "edit", "delete", "approve", "export"] },
      { module: "content", actions: ["view", "create", "edit", "delete", "approve", "export"] },
      { module: "reports", actions: ["view", "create", "edit", "delete", "approve", "escalate", "export"] },
      { module: "appeals", actions: ["view", "create", "edit", "delete", "approve", "escalate", "export"] },
      { module: "privacy", actions: ["view", "create", "edit", "delete", "approve", "export"] },
      { module: "transparency", actions: ["view", "create", "edit", "delete", "approve", "export"] },
      { module: "security", actions: ["view", "create", "edit", "delete", "export"] },
      { module: "urgent_alerts", actions: ["view", "create", "edit", "delete", "approve", "escalate"] },
      { module: "sanctions", actions: ["view", "create", "edit", "delete", "approve"] },
      { module: "groups", actions: ["view", "create", "edit", "delete", "approve"] },
      { module: "analytics", actions: ["view", "export"] },
      { module: "settings", actions: ["view", "edit"] },
      { module: "automation", actions: ["view", "create", "edit", "delete"] },
    ],
    createdAt: new Date().toISOString(),
    createdBy: "system",
    updatedAt: new Date().toISOString(),
    isSystem: true,
  },
  {
    id: "role_admin",
    name: "Administrateur",
    description: "Gestion complète sauf paramètres système",
    color: "#f59e0b",
    icon: "⚡",
    permissions: [
      { module: "dashboard", actions: ["view"] },
      { module: "moderation", actions: ["view", "create", "edit", "delete", "approve", "escalate"] },
      { module: "users", actions: ["view", "edit", "delete", "approve"] },
      { module: "content", actions: ["view", "edit", "delete", "approve"] },
      { module: "reports", actions: ["view", "edit", "approve", "escalate"] },
      { module: "appeals", actions: ["view", "edit", "approve", "escalate"] },
      { module: "privacy", actions: ["view", "edit", "approve"] },
      { module: "transparency", actions: ["view", "create"] },
      { module: "security", actions: ["view"] },
      { module: "urgent_alerts", actions: ["view", "edit", "approve", "escalate"] },
      { module: "sanctions", actions: ["view", "create", "edit", "approve"] },
      { module: "groups", actions: ["view", "edit", "delete", "approve"] },
      { module: "analytics", actions: ["view"] },
      { module: "automation", actions: ["view", "edit"] },
    ],
    createdAt: new Date().toISOString(),
    createdBy: "system",
    updatedAt: new Date().toISOString(),
    isSystem: true,
  },
  {
    id: "role_moderator",
    name: "Modérateur",
    description: "Modération du contenu et des utilisateurs",
    color: "#8b5cf6",
    icon: "🛡️",
    permissions: [
      { module: "dashboard", actions: ["view"] },
      { module: "moderation", actions: ["view", "edit", "approve"] },
      { module: "users", actions: ["view"] },
      { module: "content", actions: ["view", "edit", "delete"] },
      { module: "reports", actions: ["view", "edit", "approve"] },
      { module: "appeals", actions: ["view", "edit"] },
      { module: "urgent_alerts", actions: ["view", "edit"] },
      { module: "sanctions", actions: ["view", "create"] },
      { module: "groups", actions: ["view", "edit"] },
    ],
    maxActionsPerDay: 100,
    createdAt: new Date().toISOString(),
    createdBy: "system",
    updatedAt: new Date().toISOString(),
    isSystem: true,
  },
  {
    id: "role_junior_mod",
    name: "Modérateur Junior",
    description: "Modération basique avec supervision",
    color: "#06b6d4",
    icon: "🔰",
    permissions: [
      { module: "dashboard", actions: ["view"] },
      { module: "moderation", actions: ["view"] },
      { module: "content", actions: ["view", "edit"] },
      { module: "reports", actions: ["view", "edit"] },
      { module: "groups", actions: ["view"] },
    ],
    maxActionsPerDay: 30,
    requiresDualApproval: true,
    createdAt: new Date().toISOString(),
    createdBy: "system",
    updatedAt: new Date().toISOString(),
    isSystem: true,
  },
  {
    id: "role_privacy_officer",
    name: "Délégué à la Protection des Données",
    description: "Gestion RGPD et confidentialité",
    color: "#10b981",
    icon: "🔐",
    permissions: [
      { module: "dashboard", actions: ["view"] },
      { module: "privacy", actions: ["view", "create", "edit", "delete", "approve", "export"] },
      { module: "transparency", actions: ["view", "create", "edit", "export"] },
      { module: "users", actions: ["view", "export"] },
      { module: "security", actions: ["view"] },
    ],
    createdAt: new Date().toISOString(),
    createdBy: "system",
    updatedAt: new Date().toISOString(),
    isSystem: true,
  },
];

// Assignation de rôle à un utilisateur
export interface UserRoleAssignment {
  userId: string;
  userHandle: string;
  roleId: string;
  assignedAt: string;
  assignedBy: string;
  expiresAt?: string;
  notes?: string;
}

interface PermissionsState {
  roles: CustomRole[];
  userAssignments: UserRoleAssignment[];
  auditLog: AuditLogEntry[];
  ready: boolean;

  // === RÔLES ===

  createRole: (data: {
    name: string;
    description: string;
    color: string;
    icon: string;
    permissions: Permission[];
    maxActionsPerDay?: number;
    requiresDualApproval?: boolean;
    creatorHandle: string;
  }) => CustomRole;

  updateRole: (roleId: string, updates: Partial<CustomRole>) => void;
  deleteRole: (roleId: string) => void;
  getRoleById: (roleId: string) => CustomRole | undefined;

  // === ASSIGNATIONS ===

  assignRole: (data: {
    userId: string;
    userHandle: string;
    roleId: string;
    assignerHandle: string;
    expiresAt?: string;
    notes?: string;
  }) => void;

  revokeRole: (userId: string) => void;
  getUserRole: (userId: string) => CustomRole | undefined;
  getUserAssignment: (userId: string) => UserRoleAssignment | undefined;

  // === VÉRIFICATION DES PERMISSIONS ===

  hasPermission: (userId: string, module: PermissionModule, action: PermissionAction) => boolean;
  canAccessModule: (userId: string, module: PermissionModule) => boolean;
  getUserPermissions: (userId: string) => Permission[];

  // === AUDIT LOG ===

  logAction: (data: {
    actorId: string;
    actorHandle: string;
    actorRole: string;
    action: string;
    module: PermissionModule;
    targetType?: AuditLogEntry["targetType"];
    targetId?: string;
    details: Record<string, unknown>;
    success: boolean;
    errorMessage?: string;
    isSensitive?: boolean;
  }) => void;

  getAuditLog: (filters?: {
    actorId?: string;
    module?: PermissionModule;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) => AuditLogEntry[];

  // === STATS ===

  getStats: () => {
    totalRoles: number;
    totalAssignments: number;
    auditEntriesThisWeek: number;
    sensitiveActionsThisWeek: number;
    byRole: Record<string, number>;
  };
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

const STORAGE_KEY = "globehub_permissions_v1";

export const usePermissionsStore = create<PermissionsState>((set, get) => ({
  roles: SYSTEM_ROLES,
  userAssignments: [],
  auditLog: [],
  ready: true,

  createRole: (data) => {
    const role: CustomRole = {
      id: `role_${uid()}`,
      name: data.name,
      description: data.description,
      color: data.color,
      icon: data.icon,
      permissions: data.permissions,
      maxActionsPerDay: data.maxActionsPerDay,
      requiresDualApproval: data.requiresDualApproval,
      createdAt: new Date().toISOString(),
      createdBy: data.creatorHandle,
      updatedAt: new Date().toISOString(),
      isSystem: false,
    };

    set({ roles: [...get().roles, role] });
    return role;
  },

  updateRole: (roleId, updates) => {
    const { roles } = get();
    const role = roles.find(r => r.id === roleId);
    if (!role || role.isSystem) return;

    const updated = roles.map(r => {
      if (r.id !== roleId) return r;
      return { ...r, ...updates, updatedAt: new Date().toISOString() };
    });
    set({ roles: updated });
  },

  deleteRole: (roleId) => {
    const { roles } = get();
    const role = roles.find(r => r.id === roleId);
    if (!role || role.isSystem) return;

    set({ roles: roles.filter(r => r.id !== roleId) });
  },

  getRoleById: (roleId) => {
    return get().roles.find(r => r.id === roleId);
  },

  assignRole: (data) => {
    const { userAssignments } = get();

    // Supprimer l'assignation existante si présente
    const filtered = userAssignments.filter(a => a.userId !== data.userId);

    const assignment: UserRoleAssignment = {
      userId: data.userId,
      userHandle: data.userHandle,
      roleId: data.roleId,
      assignedAt: new Date().toISOString(),
      assignedBy: data.assignerHandle,
      expiresAt: data.expiresAt,
      notes: data.notes,
    };

    set({ userAssignments: [...filtered, assignment] });
  },

  revokeRole: (userId) => {
    const { userAssignments } = get();
    set({ userAssignments: userAssignments.filter(a => a.userId !== userId) });
  },

  getUserRole: (userId) => {
    const assignment = get().getUserAssignment(userId);
    if (!assignment) return undefined;

    // Vérifier si l'assignation est expirée
    if (assignment.expiresAt && new Date(assignment.expiresAt) < new Date()) {
      return undefined;
    }

    return get().getRoleById(assignment.roleId);
  },

  getUserAssignment: (userId) => {
    return get().userAssignments.find(a => a.userId === userId);
  },

  hasPermission: (userId, module, action) => {
    const role = get().getUserRole(userId);
    if (!role) return false;

    const modulePermission = role.permissions.find(p => p.module === module);
    if (!modulePermission) return false;

    return modulePermission.actions.includes(action);
  },

  canAccessModule: (userId, module) => {
    const role = get().getUserRole(userId);
    if (!role) return false;

    return role.permissions.some(p => p.module === module && p.actions.includes("view"));
  },

  getUserPermissions: (userId) => {
    const role = get().getUserRole(userId);
    return role?.permissions || [];
  },

  logAction: (data) => {
    const entry: AuditLogEntry = {
      id: `audit_${uid()}`,
      timestamp: new Date().toISOString(),
      actorId: data.actorId,
      actorHandle: data.actorHandle,
      actorRole: data.actorRole,
      action: data.action,
      module: data.module,
      targetType: data.targetType,
      targetId: data.targetId,
      details: data.details,
      success: data.success,
      errorMessage: data.errorMessage,
      isSensitive: data.isSensitive || false,
    };

    const { auditLog } = get();
    // Garder les 10000 dernières entrées max
    const newLog = [entry, ...auditLog].slice(0, 10000);
    set({ auditLog: newLog });
  },

  getAuditLog: (filters) => {
    let log = get().auditLog;

    if (filters?.actorId) {
      log = log.filter(e => e.actorId === filters.actorId);
    }
    if (filters?.module) {
      log = log.filter(e => e.module === filters.module);
    }
    if (filters?.startDate) {
      log = log.filter(e => new Date(e.timestamp) >= new Date(filters.startDate!));
    }
    if (filters?.endDate) {
      log = log.filter(e => new Date(e.timestamp) <= new Date(filters.endDate!));
    }

    return log.slice(0, filters?.limit || 100);
  },

  getStats: () => {
    const { roles, userAssignments, auditLog } = get();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const weekLog = auditLog.filter(e => new Date(e.timestamp) >= weekAgo);
    const sensitiveWeek = weekLog.filter(e => e.isSensitive);

    const byRole = userAssignments.reduce((acc, a) => {
      const role = roles.find(r => r.id === a.roleId);
      if (role) {
        acc[role.name] = (acc[role.name] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRoles: roles.length,
      totalAssignments: userAssignments.length,
      auditEntriesThisWeek: weekLog.length,
      sensitiveActionsThisWeek: sensitiveWeek.length,
      byRole,
    };
  },
}));

// Labels pour l'interface
export const MODULE_LABELS: Record<PermissionModule, { label: string; icon: string; description: string }> = {
  dashboard: { label: "Tableau de bord", icon: "📊", description: "Vue d'ensemble et statistiques" },
  moderation: { label: "Modération", icon: "🛡️", description: "Modération du contenu" },
  users: { label: "Utilisateurs", icon: "👥", description: "Gestion des utilisateurs" },
  content: { label: "Contenu", icon: "📝", description: "Gestion des posts et commentaires" },
  reports: { label: "Signalements", icon: "🚩", description: "Traitement des signalements" },
  appeals: { label: "Appels", icon: "⚖️", description: "Gestion des appels" },
  privacy: { label: "RGPD", icon: "🔐", description: "Confidentialité et données" },
  transparency: { label: "Transparence", icon: "📋", description: "Rapports de transparence" },
  security: { label: "Sécurité", icon: "🔒", description: "Audit et sécurité" },
  urgent_alerts: { label: "Alertes urgentes", icon: "🚨", description: "Contenu critique" },
  sanctions: { label: "Sanctions", icon: "⚠️", description: "Avertissements et bans" },
  groups: { label: "Groupes", icon: "👥", description: "Gestion des groupes" },
  analytics: { label: "Analytics", icon: "📈", description: "Analyses et métriques" },
  settings: { label: "Paramètres", icon: "⚙️", description: "Configuration système" },
  automation: { label: "Automatisation", icon: "🤖", description: "Règles automatiques" },
};

export const ACTION_LABELS: Record<PermissionAction, string> = {
  view: "Voir",
  create: "Créer",
  edit: "Modifier",
  delete: "Supprimer",
  approve: "Approuver",
  escalate: "Escalader",
  export: "Exporter",
};
