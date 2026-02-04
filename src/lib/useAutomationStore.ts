"use client";

import { create } from "zustand";

// Types de déclencheurs
export type TriggerType =
  | "post_created"
  | "comment_created"
  | "user_registered"
  | "report_submitted"
  | "user_flagged"
  | "content_flagged"
  | "strike_threshold"
  | "viral_content"
  | "scheduled";

// Types d'actions automatiques
export type AutoActionType =
  | "send_notification"
  | "send_email"
  | "flag_content"
  | "hide_content"
  | "delete_content"
  | "warn_user"
  | "suspend_user"
  | "ban_user"
  | "escalate_to_admin"
  | "webhook"
  | "add_tag"
  | "assign_moderator";

// Conditions pour les règles
export interface RuleCondition {
  field: string;
  operator: "equals" | "contains" | "greater_than" | "less_than" | "matches_regex" | "in_list";
  value: string | number | string[];
}

// Règle d'automatisation
export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;

  // Déclencheur
  trigger: TriggerType;
  triggerConfig?: Record<string, unknown>;

  // Conditions (toutes doivent être vraies)
  conditions: RuleCondition[];

  // Actions à exécuter
  actions: Array<{
    type: AutoActionType;
    config: Record<string, unknown>;
  }>;

  // Limites
  maxExecutionsPerDay?: number;
  cooldownMinutes?: number;

  // Meta
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  lastExecutedAt?: string;

  // Stats
  executionCount: number;
  successCount: number;
  failureCount: number;
}

// Webhook configuration
export interface Webhook {
  id: string;
  name: string;
  url: string;
  secret?: string;
  enabled: boolean;

  // Events to send
  events: TriggerType[];

  // Headers personnalisés
  headers?: Record<string, string>;

  // Meta
  createdAt: string;
  createdBy: string;

  // Stats
  lastCalledAt?: string;
  successCount: number;
  failureCount: number;
  lastError?: string;
}

// Log d'exécution
export interface ExecutionLog {
  id: string;
  ruleId: string;
  ruleName: string;
  triggeredAt: string;

  // Contexte
  triggerType: TriggerType;
  triggerData: Record<string, unknown>;

  // Résultat
  success: boolean;
  actionsExecuted: string[];
  errors?: string[];

  // Durée
  durationMs: number;
}

// Tâche planifiée
export interface ScheduledTask {
  id: string;
  name: string;
  description: string;
  enabled: boolean;

  // Schedule (cron-like)
  schedule: {
    type: "daily" | "weekly" | "monthly" | "custom";
    time?: string; // HH:MM
    dayOfWeek?: number; // 0-6
    dayOfMonth?: number; // 1-31
    customCron?: string;
  };

  // Action
  action: {
    type: AutoActionType;
    config: Record<string, unknown>;
  };

  // Meta
  createdAt: string;
  createdBy: string;
  lastRunAt?: string;
  nextRunAt?: string;

  // Stats
  runCount: number;
  successCount: number;
  failureCount: number;
}

interface AutomationState {
  rules: AutomationRule[];
  webhooks: Webhook[];
  scheduledTasks: ScheduledTask[];
  executionLogs: ExecutionLog[];
  ready: boolean;

  // === RÈGLES ===

  createRule: (data: {
    name: string;
    description: string;
    trigger: TriggerType;
    triggerConfig?: Record<string, unknown>;
    conditions: RuleCondition[];
    actions: AutomationRule["actions"];
    maxExecutionsPerDay?: number;
    cooldownMinutes?: number;
    creatorHandle: string;
  }) => AutomationRule;

  updateRule: (ruleId: string, updates: Partial<AutomationRule>) => void;
  deleteRule: (ruleId: string) => void;
  toggleRule: (ruleId: string, enabled: boolean) => void;

  // Exécution manuelle pour test
  testRule: (ruleId: string, testData: Record<string, unknown>) => { success: boolean; result: string };

  // === WEBHOOKS ===

  createWebhook: (data: {
    name: string;
    url: string;
    secret?: string;
    events: TriggerType[];
    headers?: Record<string, string>;
    creatorHandle: string;
  }) => Webhook;

  updateWebhook: (webhookId: string, updates: Partial<Webhook>) => void;
  deleteWebhook: (webhookId: string) => void;
  toggleWebhook: (webhookId: string, enabled: boolean) => void;
  testWebhook: (webhookId: string) => Promise<{ success: boolean; statusCode?: number; error?: string }>;

  // === TÂCHES PLANIFIÉES ===

  createScheduledTask: (data: {
    name: string;
    description: string;
    schedule: ScheduledTask["schedule"];
    action: ScheduledTask["action"];
    creatorHandle: string;
  }) => ScheduledTask;

  updateScheduledTask: (taskId: string, updates: Partial<ScheduledTask>) => void;
  deleteScheduledTask: (taskId: string) => void;
  toggleScheduledTask: (taskId: string, enabled: boolean) => void;
  runScheduledTask: (taskId: string) => void;

  // === EXÉCUTION ===

  executeRule: (ruleId: string, triggerData: Record<string, unknown>) => ExecutionLog;
  checkAndExecuteRules: (trigger: TriggerType, data: Record<string, unknown>) => ExecutionLog[];

  // === LOGS ===

  getExecutionLogs: (filters?: { ruleId?: string; limit?: number }) => ExecutionLog[];
  clearOldLogs: (daysToKeep: number) => void;

  // === STATS ===

  getStats: () => {
    totalRules: number;
    enabledRules: number;
    totalWebhooks: number;
    enabledWebhooks: number;
    totalScheduledTasks: number;
    executionsToday: number;
    successRate: number;
    mostActiveRules: Array<{ id: string; name: string; count: number }>;
  };
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// Évaluer une condition
function evaluateCondition(condition: RuleCondition, data: Record<string, unknown>): boolean {
  const fieldValue = data[condition.field];

  switch (condition.operator) {
    case "equals":
      return fieldValue === condition.value;
    case "contains":
      return typeof fieldValue === "string" && fieldValue.includes(String(condition.value));
    case "greater_than":
      return typeof fieldValue === "number" && fieldValue > Number(condition.value);
    case "less_than":
      return typeof fieldValue === "number" && fieldValue < Number(condition.value);
    case "matches_regex":
      if (typeof fieldValue !== "string") return false;
      try {
        return new RegExp(String(condition.value)).test(fieldValue);
      } catch {
        return false;
      }
    case "in_list":
      return Array.isArray(condition.value) && condition.value.includes(fieldValue as string);
    default:
      return false;
  }
}

// Règles par défaut
const defaultRules: AutomationRule[] = [
  {
    id: "rule_auto_flag_spam",
    name: "Auto-flag spam potentiel",
    description: "Signale automatiquement les posts contenant plusieurs liens",
    enabled: true,
    trigger: "post_created",
    conditions: [
      { field: "linkCount", operator: "greater_than", value: 3 }
    ],
    actions: [
      { type: "flag_content", config: { reason: "Spam potentiel - plusieurs liens" } },
      { type: "send_notification", config: { to: "moderators", message: "Post avec plusieurs liens détecté" } }
    ],
    maxExecutionsPerDay: 100,
    createdAt: new Date().toISOString(),
    createdBy: "system",
    updatedAt: new Date().toISOString(),
    executionCount: 0,
    successCount: 0,
    failureCount: 0
  },
  {
    id: "rule_viral_notification",
    name: "Notification contenu viral",
    description: "Notifie les admins quand un post devient viral",
    enabled: true,
    trigger: "viral_content",
    conditions: [
      { field: "likesPerMinute", operator: "greater_than", value: 10 }
    ],
    actions: [
      { type: "send_notification", config: { to: "admins", message: "Post viral détecté !" } },
      { type: "add_tag", config: { tag: "viral" } }
    ],
    createdAt: new Date().toISOString(),
    createdBy: "system",
    updatedAt: new Date().toISOString(),
    executionCount: 0,
    successCount: 0,
    failureCount: 0
  },
  {
    id: "rule_strike_escalation",
    name: "Escalade automatique des strikes",
    description: "Suspend automatiquement les utilisateurs avec 5+ strikes",
    enabled: true,
    trigger: "strike_threshold",
    conditions: [
      { field: "strikeCount", operator: "greater_than", value: 4 }
    ],
    actions: [
      { type: "suspend_user", config: { duration: 7, reason: "Violations répétées" } },
      { type: "escalate_to_admin", config: { priority: "high" } }
    ],
    createdAt: new Date().toISOString(),
    createdBy: "system",
    updatedAt: new Date().toISOString(),
    executionCount: 0,
    successCount: 0,
    failureCount: 0
  }
];

const STORAGE_KEY = "globehub_automation_v1";

export const useAutomationStore = create<AutomationState>((set, get) => ({
  rules: defaultRules,
  webhooks: [],
  scheduledTasks: [],
  executionLogs: [],
  ready: true,

  createRule: (data) => {
    const rule: AutomationRule = {
      id: `rule_${uid()}`,
      name: data.name,
      description: data.description,
      enabled: true,
      trigger: data.trigger,
      triggerConfig: data.triggerConfig,
      conditions: data.conditions,
      actions: data.actions,
      maxExecutionsPerDay: data.maxExecutionsPerDay,
      cooldownMinutes: data.cooldownMinutes,
      createdAt: new Date().toISOString(),
      createdBy: data.creatorHandle,
      updatedAt: new Date().toISOString(),
      executionCount: 0,
      successCount: 0,
      failureCount: 0
    };

    set({ rules: [...get().rules, rule] });
    return rule;
  },

  updateRule: (ruleId, updates) => {
    const { rules } = get();
    const updated = rules.map(r => {
      if (r.id !== ruleId) return r;
      return { ...r, ...updates, updatedAt: new Date().toISOString() };
    });
    set({ rules: updated });
  },

  deleteRule: (ruleId) => {
    set({ rules: get().rules.filter(r => r.id !== ruleId) });
  },

  toggleRule: (ruleId, enabled) => {
    get().updateRule(ruleId, { enabled });
  },

  testRule: (ruleId, testData) => {
    const rule = get().rules.find(r => r.id === ruleId);
    if (!rule) return { success: false, result: "Règle non trouvée" };

    // Évaluer les conditions
    const allConditionsMet = rule.conditions.every(c => evaluateCondition(c, testData));

    if (!allConditionsMet) {
      return { success: false, result: "Conditions non remplies" };
    }

    return {
      success: true,
      result: `Règle déclenchée avec succès. Actions: ${rule.actions.map(a => a.type).join(", ")}`
    };
  },

  createWebhook: (data) => {
    const webhook: Webhook = {
      id: `webhook_${uid()}`,
      name: data.name,
      url: data.url,
      secret: data.secret,
      enabled: true,
      events: data.events,
      headers: data.headers,
      createdAt: new Date().toISOString(),
      createdBy: data.creatorHandle,
      successCount: 0,
      failureCount: 0
    };

    set({ webhooks: [...get().webhooks, webhook] });
    return webhook;
  },

  updateWebhook: (webhookId, updates) => {
    const { webhooks } = get();
    const updated = webhooks.map(w => {
      if (w.id !== webhookId) return w;
      return { ...w, ...updates };
    });
    set({ webhooks: updated });
  },

  deleteWebhook: (webhookId) => {
    set({ webhooks: get().webhooks.filter(w => w.id !== webhookId) });
  },

  toggleWebhook: (webhookId, enabled) => {
    get().updateWebhook(webhookId, { enabled });
  },

  testWebhook: async (webhookId) => {
    const webhook = get().webhooks.find(w => w.id === webhookId);
    if (!webhook) return { success: false, error: "Webhook non trouvé" };

    // Simulation d'appel webhook
    return new Promise(resolve => {
      setTimeout(() => {
        const success = Math.random() > 0.2; // 80% de succès
        if (success) {
          get().updateWebhook(webhookId, {
            lastCalledAt: new Date().toISOString(),
            successCount: webhook.successCount + 1
          });
          resolve({ success: true, statusCode: 200 });
        } else {
          get().updateWebhook(webhookId, {
            lastCalledAt: new Date().toISOString(),
            failureCount: webhook.failureCount + 1,
            lastError: "Connection timeout"
          });
          resolve({ success: false, statusCode: 500, error: "Connection timeout" });
        }
      }, 500);
    });
  },

  createScheduledTask: (data) => {
    const task: ScheduledTask = {
      id: `task_${uid()}`,
      name: data.name,
      description: data.description,
      enabled: true,
      schedule: data.schedule,
      action: data.action,
      createdAt: new Date().toISOString(),
      createdBy: data.creatorHandle,
      runCount: 0,
      successCount: 0,
      failureCount: 0
    };

    set({ scheduledTasks: [...get().scheduledTasks, task] });
    return task;
  },

  updateScheduledTask: (taskId, updates) => {
    const { scheduledTasks } = get();
    const updated = scheduledTasks.map(t => {
      if (t.id !== taskId) return t;
      return { ...t, ...updates };
    });
    set({ scheduledTasks: updated });
  },

  deleteScheduledTask: (taskId) => {
    set({ scheduledTasks: get().scheduledTasks.filter(t => t.id !== taskId) });
  },

  toggleScheduledTask: (taskId, enabled) => {
    get().updateScheduledTask(taskId, { enabled });
  },

  runScheduledTask: (taskId) => {
    const task = get().scheduledTasks.find(t => t.id === taskId);
    if (!task) return;

    get().updateScheduledTask(taskId, {
      lastRunAt: new Date().toISOString(),
      runCount: task.runCount + 1,
      successCount: task.successCount + 1
    });
  },

  executeRule: (ruleId, triggerData) => {
    const startTime = Date.now();
    const rule = get().rules.find(r => r.id === ruleId);

    if (!rule) {
      const log: ExecutionLog = {
        id: `log_${uid()}`,
        ruleId,
        ruleName: "Unknown",
        triggeredAt: new Date().toISOString(),
        triggerType: "post_created",
        triggerData,
        success: false,
        actionsExecuted: [],
        errors: ["Règle non trouvée"],
        durationMs: Date.now() - startTime
      };
      set({ executionLogs: [log, ...get().executionLogs].slice(0, 1000) });
      return log;
    }

    // Évaluer les conditions
    const allConditionsMet = rule.conditions.every(c => evaluateCondition(c, triggerData));

    if (!allConditionsMet) {
      const log: ExecutionLog = {
        id: `log_${uid()}`,
        ruleId,
        ruleName: rule.name,
        triggeredAt: new Date().toISOString(),
        triggerType: rule.trigger,
        triggerData,
        success: false,
        actionsExecuted: [],
        errors: ["Conditions non remplies"],
        durationMs: Date.now() - startTime
      };
      set({ executionLogs: [log, ...get().executionLogs].slice(0, 1000) });
      return log;
    }

    // Simuler l'exécution des actions
    const actionsExecuted = rule.actions.map(a => a.type);

    const log: ExecutionLog = {
      id: `log_${uid()}`,
      ruleId,
      ruleName: rule.name,
      triggeredAt: new Date().toISOString(),
      triggerType: rule.trigger,
      triggerData,
      success: true,
      actionsExecuted,
      durationMs: Date.now() - startTime
    };

    // Mettre à jour les stats de la règle
    get().updateRule(ruleId, {
      lastExecutedAt: new Date().toISOString(),
      executionCount: rule.executionCount + 1,
      successCount: rule.successCount + 1
    });

    set({ executionLogs: [log, ...get().executionLogs].slice(0, 1000) });
    return log;
  },

  checkAndExecuteRules: (trigger, data) => {
    const { rules } = get();
    const logs: ExecutionLog[] = [];

    for (const rule of rules) {
      if (!rule.enabled) continue;
      if (rule.trigger !== trigger) continue;

      const log = get().executeRule(rule.id, data);
      logs.push(log);
    }

    return logs;
  },

  getExecutionLogs: (filters) => {
    let logs = get().executionLogs;

    if (filters?.ruleId) {
      logs = logs.filter(l => l.ruleId === filters.ruleId);
    }

    return logs.slice(0, filters?.limit || 100);
  },

  clearOldLogs: (daysToKeep) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysToKeep);

    set({
      executionLogs: get().executionLogs.filter(l =>
        new Date(l.triggeredAt) >= cutoff
      )
    });
  },

  getStats: () => {
    const { rules, webhooks, scheduledTasks, executionLogs } = get();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayLogs = executionLogs.filter(l => new Date(l.triggeredAt) >= today);
    const successLogs = todayLogs.filter(l => l.success);

    const ruleExecutions = rules
      .map(r => ({ id: r.id, name: r.name, count: r.executionCount }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalRules: rules.length,
      enabledRules: rules.filter(r => r.enabled).length,
      totalWebhooks: webhooks.length,
      enabledWebhooks: webhooks.filter(w => w.enabled).length,
      totalScheduledTasks: scheduledTasks.length,
      executionsToday: todayLogs.length,
      successRate: todayLogs.length > 0 ? Math.round((successLogs.length / todayLogs.length) * 100) : 100,
      mostActiveRules: ruleExecutions
    };
  }
}));

// Labels
export const TRIGGER_TYPE_LABELS: Record<TriggerType, { label: string; icon: string }> = {
  post_created: { label: "Post créé", icon: "📝" },
  comment_created: { label: "Commentaire créé", icon: "💬" },
  user_registered: { label: "Nouvel utilisateur", icon: "👤" },
  report_submitted: { label: "Signalement soumis", icon: "🚩" },
  user_flagged: { label: "Utilisateur signalé", icon: "⚠️" },
  content_flagged: { label: "Contenu signalé", icon: "🚫" },
  strike_threshold: { label: "Seuil de strikes", icon: "⚡" },
  viral_content: { label: "Contenu viral", icon: "🔥" },
  scheduled: { label: "Planifié", icon: "⏰" }
};

export const ACTION_TYPE_LABELS: Record<AutoActionType, { label: string; icon: string; color: string }> = {
  send_notification: { label: "Envoyer notification", icon: "🔔", color: "blue" },
  send_email: { label: "Envoyer email", icon: "📧", color: "blue" },
  flag_content: { label: "Signaler contenu", icon: "🚩", color: "amber" },
  hide_content: { label: "Masquer contenu", icon: "👁️", color: "orange" },
  delete_content: { label: "Supprimer contenu", icon: "🗑️", color: "red" },
  warn_user: { label: "Avertir utilisateur", icon: "⚠️", color: "amber" },
  suspend_user: { label: "Suspendre utilisateur", icon: "⏸️", color: "orange" },
  ban_user: { label: "Bannir utilisateur", icon: "🔨", color: "red" },
  escalate_to_admin: { label: "Escalader à admin", icon: "⬆️", color: "purple" },
  webhook: { label: "Appeler webhook", icon: "🔗", color: "neutral" },
  add_tag: { label: "Ajouter tag", icon: "🏷️", color: "green" },
  assign_moderator: { label: "Assigner modérateur", icon: "👤", color: "blue" }
};
