"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { useAuthStore } from "@/lib/useAuthStore";
import {
  useAutomationStore,
  TRIGGER_TYPE_LABELS,
  ACTION_TYPE_LABELS,
  type TriggerType,
  type AutoActionType,
  type AutomationRule,
  type Webhook,
  type ScheduledTask,
  type RuleCondition,
} from "@/lib/useAutomationStore";

export default function AutomationPage() {
  const router = useRouter();
  const { currentUser, isAdmin } = useAuthStore();
  const {
    rules,
    webhooks,
    scheduledTasks,
    executionLogs,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
    testRule,
    createWebhook,
    deleteWebhook,
    toggleWebhook,
    testWebhook,
    createScheduledTask,
    deleteScheduledTask,
    toggleScheduledTask,
    runScheduledTask,
    getExecutionLogs,
    getStats,
  } = useAutomationStore();

  const [activeTab, setActiveTab] = useState<"rules" | "webhooks" | "tasks" | "logs">("rules");
  const [showCreateRule, setShowCreateRule] = useState(false);
  const [showCreateWebhook, setShowCreateWebhook] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null);
  const [testResult, setTestResult] = useState<{ ruleId: string; result: string } | null>(null);
  const [webhookTestResult, setWebhookTestResult] = useState<{ id: string; success: boolean; message: string } | null>(null);

  // Form states for new rule
  const [newRuleName, setNewRuleName] = useState("");
  const [newRuleDescription, setNewRuleDescription] = useState("");
  const [newRuleTrigger, setNewRuleTrigger] = useState<TriggerType>("post_created");
  const [newRuleConditions, setNewRuleConditions] = useState<RuleCondition[]>([]);
  const [newRuleActions, setNewRuleActions] = useState<Array<{ type: AutoActionType; config: Record<string, unknown> }>>([]);

  // Form states for new webhook
  const [newWebhookName, setNewWebhookName] = useState("");
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [newWebhookEvents, setNewWebhookEvents] = useState<TriggerType[]>([]);

  // Form states for new scheduled task
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskScheduleType, setNewTaskScheduleType] = useState<"daily" | "weekly" | "monthly">("daily");
  const [newTaskTime, setNewTaskTime] = useState("09:00");
  const [newTaskAction, setNewTaskAction] = useState<AutoActionType>("send_notification");

  if (!currentUser || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="text-center">
          <span className="text-6xl">🔒</span>
          <h1 className="mt-4 text-xl font-bold">Accès refusé</h1>
          <p className="text-neutral-500">Réservé aux administrateurs</p>
          <button onClick={() => router.push("/")} className="mt-4 rounded-lg bg-fuchsia-500 px-4 py-2 text-white">
            Retour
          </button>
        </div>
      </div>
    );
  }

  const stats = getStats();
  const recentLogs = getExecutionLogs({ limit: 50 });

  const handleCreateRule = () => {
    if (!newRuleName.trim()) return;

    createRule({
      name: newRuleName,
      description: newRuleDescription,
      trigger: newRuleTrigger,
      conditions: newRuleConditions,
      actions: newRuleActions.length > 0 ? newRuleActions : [{ type: "flag_content", config: {} }],
      creatorHandle: currentUser.handle,
    });

    setNewRuleName("");
    setNewRuleDescription("");
    setNewRuleTrigger("post_created");
    setNewRuleConditions([]);
    setNewRuleActions([]);
    setShowCreateRule(false);
  };

  const handleCreateWebhook = () => {
    if (!newWebhookName.trim() || !newWebhookUrl.trim()) return;

    createWebhook({
      name: newWebhookName,
      url: newWebhookUrl,
      events: newWebhookEvents,
      creatorHandle: currentUser.handle,
    });

    setNewWebhookName("");
    setNewWebhookUrl("");
    setNewWebhookEvents([]);
    setShowCreateWebhook(false);
  };

  const handleCreateTask = () => {
    if (!newTaskName.trim()) return;

    createScheduledTask({
      name: newTaskName,
      description: newTaskDescription,
      schedule: {
        type: newTaskScheduleType,
        time: newTaskTime,
      },
      action: {
        type: newTaskAction,
        config: {},
      },
      creatorHandle: currentUser.handle,
    });

    setNewTaskName("");
    setNewTaskDescription("");
    setNewTaskScheduleType("daily");
    setNewTaskTime("09:00");
    setNewTaskAction("send_notification");
    setShowCreateTask(false);
  };

  const handleTestRule = (rule: AutomationRule) => {
    const result = testRule(rule.id, { linkCount: 5, content: "test" });
    setTestResult({ ruleId: rule.id, result: result.result });
    setTimeout(() => setTestResult(null), 3000);
  };

  const handleTestWebhook = async (webhook: Webhook) => {
    setWebhookTestResult({ id: webhook.id, success: true, message: "Test en cours..." });
    const result = await testWebhook(webhook.id);
    setWebhookTestResult({
      id: webhook.id,
      success: result.success,
      message: result.success ? `OK (${result.statusCode})` : `Erreur: ${result.error}`,
    });
    setTimeout(() => setWebhookTestResult(null), 3000);
  };

  const addCondition = () => {
    setNewRuleConditions([...newRuleConditions, { field: "", operator: "equals", value: "" }]);
  };

  const updateCondition = (index: number, updates: Partial<RuleCondition>) => {
    const updated = [...newRuleConditions];
    updated[index] = { ...updated[index], ...updates };
    setNewRuleConditions(updated);
  };

  const removeCondition = (index: number) => {
    setNewRuleConditions(newRuleConditions.filter((_, i) => i !== index));
  };

  const addAction = () => {
    setNewRuleActions([...newRuleActions, { type: "flag_content", config: {} }]);
  };

  const updateAction = (index: number, type: AutoActionType) => {
    const updated = [...newRuleActions];
    updated[index] = { type, config: {} };
    setNewRuleActions(updated);
  };

  const removeAction = (index: number) => {
    setNewRuleActions(newRuleActions.filter((_, i) => i !== index));
  };

  const toggleWebhookEvent = (event: TriggerType) => {
    setNewWebhookEvents(
      newWebhookEvents.includes(event)
        ? newWebhookEvents.filter(e => e !== event)
        : [...newWebhookEvents, event]
    );
  };

  const tabs = [
    { id: "rules", label: "Règles", count: rules.length },
    { id: "webhooks", label: "Webhooks", count: webhooks.length },
    { id: "tasks", label: "Tâches planifiées", count: scheduledTasks.length },
    { id: "logs", label: "Logs", count: recentLogs.length },
  ] as const;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/80 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/admin")} className="text-neutral-500 hover:text-neutral-900">
              ← Retour
            </button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                ⚡ Automatisation
              </h1>
              <p className="text-sm text-neutral-500">Règles automatiques, webhooks et tâches planifiées</p>
            </div>
          </div>

          {/* Stats rapides */}
          <div className="flex items-center gap-4 text-sm">
            <div className="text-center">
              <p className="text-neutral-500">Règles actives</p>
              <p className="text-xl font-bold">{stats.enabledRules}/{stats.totalRules}</p>
            </div>
            <div className="text-center">
              <p className="text-neutral-500">Exécutions (24h)</p>
              <p className="text-xl font-bold">{stats.executionsToday}</p>
            </div>
            <div className="text-center">
              <p className="text-neutral-500">Succès</p>
              <p className="text-xl font-bold text-green-600">{stats.successRate}%</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex gap-1 border-t border-neutral-100 dark:border-neutral-800">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
                  activeTab === tab.id
                    ? "border-fuchsia-500 text-fuchsia-600"
                    : "border-transparent text-neutral-500 hover:text-neutral-900"
                )}
              >
                {tab.label}
                <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-xs dark:bg-neutral-800">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Rules Tab */}
        {activeTab === "rules" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Règles d'automatisation</h2>
              <button
                onClick={() => setShowCreateRule(true)}
                className="rounded-lg bg-fuchsia-500 px-4 py-2 font-medium text-white hover:bg-fuchsia-600"
              >
                + Nouvelle règle
              </button>
            </div>

            {rules.length === 0 ? (
              <div className="rounded-xl bg-white p-12 text-center dark:bg-neutral-900">
                <span className="text-5xl">⚡</span>
                <p className="mt-4 text-neutral-500">Aucune règle d'automatisation</p>
              </div>
            ) : (
              rules.map(rule => (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  onToggle={() => toggleRule(rule.id, !rule.enabled)}
                  onDelete={() => deleteRule(rule.id)}
                  onTest={() => handleTestRule(rule)}
                  onView={() => setSelectedRule(rule)}
                  testResult={testResult?.ruleId === rule.id ? testResult.result : undefined}
                />
              ))
            )}
          </div>
        )}

        {/* Webhooks Tab */}
        {activeTab === "webhooks" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Webhooks</h2>
              <button
                onClick={() => setShowCreateWebhook(true)}
                className="rounded-lg bg-fuchsia-500 px-4 py-2 font-medium text-white hover:bg-fuchsia-600"
              >
                + Nouveau webhook
              </button>
            </div>

            {webhooks.length === 0 ? (
              <div className="rounded-xl bg-white p-12 text-center dark:bg-neutral-900">
                <span className="text-5xl">🔗</span>
                <p className="mt-4 text-neutral-500">Aucun webhook configuré</p>
              </div>
            ) : (
              webhooks.map(webhook => (
                <WebhookCard
                  key={webhook.id}
                  webhook={webhook}
                  onToggle={() => toggleWebhook(webhook.id, !webhook.enabled)}
                  onDelete={() => deleteWebhook(webhook.id)}
                  onTest={() => handleTestWebhook(webhook)}
                  testResult={webhookTestResult?.id === webhook.id ? webhookTestResult : undefined}
                />
              ))
            )}
          </div>
        )}

        {/* Scheduled Tasks Tab */}
        {activeTab === "tasks" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Tâches planifiées</h2>
              <button
                onClick={() => setShowCreateTask(true)}
                className="rounded-lg bg-fuchsia-500 px-4 py-2 font-medium text-white hover:bg-fuchsia-600"
              >
                + Nouvelle tâche
              </button>
            </div>

            {scheduledTasks.length === 0 ? (
              <div className="rounded-xl bg-white p-12 text-center dark:bg-neutral-900">
                <span className="text-5xl">⏰</span>
                <p className="mt-4 text-neutral-500">Aucune tâche planifiée</p>
              </div>
            ) : (
              scheduledTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={() => toggleScheduledTask(task.id, !task.enabled)}
                  onDelete={() => deleteScheduledTask(task.id)}
                  onRun={() => runScheduledTask(task.id)}
                />
              ))
            )}
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === "logs" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Logs d'exécution</h2>

            {recentLogs.length === 0 ? (
              <div className="rounded-xl bg-white p-12 text-center dark:bg-neutral-900">
                <span className="text-5xl">📋</span>
                <p className="mt-4 text-neutral-500">Aucun log d'exécution</p>
              </div>
            ) : (
              <div className="rounded-xl bg-white overflow-hidden shadow-sm dark:bg-neutral-900">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 dark:bg-neutral-800">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">Date</th>
                      <th className="text-left px-4 py-3 font-medium">Règle</th>
                      <th className="text-left px-4 py-3 font-medium">Déclencheur</th>
                      <th className="text-left px-4 py-3 font-medium">Actions</th>
                      <th className="text-left px-4 py-3 font-medium">Statut</th>
                      <th className="text-right px-4 py-3 font-medium">Durée</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLogs.map(log => (
                      <tr key={log.id} className="border-t border-neutral-100 dark:border-neutral-800">
                        <td className="px-4 py-3 text-neutral-500">
                          {new Date(log.triggeredAt).toLocaleString("fr-FR")}
                        </td>
                        <td className="px-4 py-3 font-medium">{log.ruleName}</td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1">
                            {TRIGGER_TYPE_LABELS[log.triggerType].icon}
                            {TRIGGER_TYPE_LABELS[log.triggerType].label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {log.actionsExecuted.map((action, i) => (
                              <span key={i} className="text-xs px-2 py-0.5 bg-neutral-100 rounded dark:bg-neutral-800">
                                {ACTION_TYPE_LABELS[action as AutoActionType]?.icon || "?"} {action}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={clsx(
                            "px-2 py-0.5 rounded-full text-xs font-medium",
                            log.success
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          )}>
                            {log.success ? "Succès" : "Échec"}
                          </span>
                          {log.errors && log.errors.length > 0 && (
                            <p className="text-xs text-red-500 mt-1">{log.errors.join(", ")}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-neutral-500">
                          {log.durationMs}ms
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal création règle */}
      {showCreateRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl my-8 rounded-2xl bg-white p-6 dark:bg-neutral-900">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Nouvelle règle d'automatisation</h2>
              <button onClick={() => setShowCreateRule(false)} className="text-neutral-500 hover:text-neutral-900">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom de la règle</label>
                <input
                  type="text"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  placeholder="Ex: Auto-modération spam"
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newRuleDescription}
                  onChange={(e) => setNewRuleDescription(e.target.value)}
                  placeholder="Décrivez ce que fait cette règle..."
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Déclencheur</label>
                <select
                  value={newRuleTrigger}
                  onChange={(e) => setNewRuleTrigger(e.target.value as TriggerType)}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
                >
                  {(Object.keys(TRIGGER_TYPE_LABELS) as TriggerType[]).map(trigger => (
                    <option key={trigger} value={trigger}>
                      {TRIGGER_TYPE_LABELS[trigger].icon} {TRIGGER_TYPE_LABELS[trigger].label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Conditions */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">Conditions</label>
                  <button
                    onClick={addCondition}
                    className="text-sm text-fuchsia-500 hover:text-fuchsia-600"
                  >
                    + Ajouter condition
                  </button>
                </div>
                {newRuleConditions.length === 0 ? (
                  <p className="text-sm text-neutral-500 bg-neutral-50 p-3 rounded-lg dark:bg-neutral-800">
                    Aucune condition (la règle s'exécutera toujours)
                  </p>
                ) : (
                  <div className="space-y-2">
                    {newRuleConditions.map((condition, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={condition.field}
                          onChange={(e) => updateCondition(index, { field: e.target.value })}
                          placeholder="Champ"
                          className="w-32 rounded-lg border border-neutral-200 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                        />
                        <select
                          value={condition.operator}
                          onChange={(e) => updateCondition(index, { operator: e.target.value as RuleCondition["operator"] })}
                          className="rounded-lg border border-neutral-200 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                        >
                          <option value="equals">=</option>
                          <option value="contains">contient</option>
                          <option value="greater_than">&gt;</option>
                          <option value="less_than">&lt;</option>
                          <option value="matches_regex">regex</option>
                        </select>
                        <input
                          type="text"
                          value={String(condition.value)}
                          onChange={(e) => updateCondition(index, { value: e.target.value })}
                          placeholder="Valeur"
                          className="flex-1 rounded-lg border border-neutral-200 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                        />
                        <button
                          onClick={() => removeCondition(index)}
                          className="text-red-500 hover:text-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">Actions</label>
                  <button
                    onClick={addAction}
                    className="text-sm text-fuchsia-500 hover:text-fuchsia-600"
                  >
                    + Ajouter action
                  </button>
                </div>
                {newRuleActions.length === 0 ? (
                  <p className="text-sm text-neutral-500 bg-neutral-50 p-3 rounded-lg dark:bg-neutral-800">
                    Au moins une action requise
                  </p>
                ) : (
                  <div className="space-y-2">
                    {newRuleActions.map((action, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <select
                          value={action.type}
                          onChange={(e) => updateAction(index, e.target.value as AutoActionType)}
                          className="flex-1 rounded-lg border border-neutral-200 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                        >
                          {(Object.keys(ACTION_TYPE_LABELS) as AutoActionType[]).map(actionType => (
                            <option key={actionType} value={actionType}>
                              {ACTION_TYPE_LABELS[actionType].icon} {ACTION_TYPE_LABELS[actionType].label}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => removeAction(index)}
                          className="text-red-500 hover:text-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowCreateRule(false)}
                className="flex-1 rounded-lg border border-neutral-200 px-4 py-2 font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateRule}
                disabled={!newRuleName.trim()}
                className="flex-1 rounded-lg bg-fuchsia-500 px-4 py-2 font-medium text-white hover:bg-fuchsia-600 disabled:opacity-50"
              >
                Créer la règle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal création webhook */}
      {showCreateWebhook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 dark:bg-neutral-900">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Nouveau webhook</h2>
              <button onClick={() => setShowCreateWebhook(false)} className="text-neutral-500 hover:text-neutral-900">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom</label>
                <input
                  type="text"
                  value={newWebhookName}
                  onChange={(e) => setNewWebhookName(e.target.value)}
                  placeholder="Ex: Slack notifications"
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">URL</label>
                <input
                  type="url"
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                  placeholder="https://example.com/webhook"
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Événements</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(TRIGGER_TYPE_LABELS) as TriggerType[]).map(event => (
                    <button
                      key={event}
                      onClick={() => toggleWebhookEvent(event)}
                      className={clsx(
                        "text-left px-3 py-2 rounded-lg text-sm transition-colors",
                        newWebhookEvents.includes(event)
                          ? "bg-fuchsia-100 border-2 border-fuchsia-500 dark:bg-fuchsia-900/20"
                          : "bg-neutral-50 border-2 border-transparent dark:bg-neutral-800"
                      )}
                    >
                      {TRIGGER_TYPE_LABELS[event].icon} {TRIGGER_TYPE_LABELS[event].label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowCreateWebhook(false)}
                className="flex-1 rounded-lg border border-neutral-200 px-4 py-2 font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateWebhook}
                disabled={!newWebhookName.trim() || !newWebhookUrl.trim()}
                className="flex-1 rounded-lg bg-fuchsia-500 px-4 py-2 font-medium text-white hover:bg-fuchsia-600 disabled:opacity-50"
              >
                Créer le webhook
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal création tâche */}
      {showCreateTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 dark:bg-neutral-900">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Nouvelle tâche planifiée</h2>
              <button onClick={() => setShowCreateTask(false)} className="text-neutral-500 hover:text-neutral-900">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom</label>
                <input
                  type="text"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  placeholder="Ex: Rapport quotidien"
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  placeholder="Description de la tâche..."
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Fréquence</label>
                  <select
                    value={newTaskScheduleType}
                    onChange={(e) => setNewTaskScheduleType(e.target.value as "daily" | "weekly" | "monthly")}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
                  >
                    <option value="daily">Quotidien</option>
                    <option value="weekly">Hebdomadaire</option>
                    <option value="monthly">Mensuel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Heure</label>
                  <input
                    type="time"
                    value={newTaskTime}
                    onChange={(e) => setNewTaskTime(e.target.value)}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Action</label>
                <select
                  value={newTaskAction}
                  onChange={(e) => setNewTaskAction(e.target.value as AutoActionType)}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
                >
                  {(Object.keys(ACTION_TYPE_LABELS) as AutoActionType[]).map(actionType => (
                    <option key={actionType} value={actionType}>
                      {ACTION_TYPE_LABELS[actionType].icon} {ACTION_TYPE_LABELS[actionType].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowCreateTask(false)}
                className="flex-1 rounded-lg border border-neutral-200 px-4 py-2 font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateTask}
                disabled={!newTaskName.trim()}
                className="flex-1 rounded-lg bg-fuchsia-500 px-4 py-2 font-medium text-white hover:bg-fuchsia-600 disabled:opacity-50"
              >
                Créer la tâche
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal détail règle */}
      {selectedRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 dark:bg-neutral-900">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{selectedRule.name}</h2>
              <button onClick={() => setSelectedRule(null)} className="text-neutral-500 hover:text-neutral-900">✕</button>
            </div>

            <p className="text-neutral-500 mb-4">{selectedRule.description}</p>

            <div className="space-y-4">
              <div className="p-4 bg-neutral-50 rounded-lg dark:bg-neutral-800">
                <h3 className="font-medium mb-2">Déclencheur</h3>
                <p className="flex items-center gap-2">
                  {TRIGGER_TYPE_LABELS[selectedRule.trigger].icon}
                  {TRIGGER_TYPE_LABELS[selectedRule.trigger].label}
                </p>
              </div>

              <div className="p-4 bg-neutral-50 rounded-lg dark:bg-neutral-800">
                <h3 className="font-medium mb-2">Conditions ({selectedRule.conditions.length})</h3>
                {selectedRule.conditions.length === 0 ? (
                  <p className="text-neutral-500 text-sm">Aucune condition</p>
                ) : (
                  <ul className="space-y-1">
                    {selectedRule.conditions.map((c, i) => (
                      <li key={i} className="text-sm">
                        <code className="bg-neutral-200 px-1 rounded dark:bg-neutral-700">{c.field}</code>{" "}
                        {c.operator}{" "}
                        <code className="bg-neutral-200 px-1 rounded dark:bg-neutral-700">{String(c.value)}</code>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="p-4 bg-neutral-50 rounded-lg dark:bg-neutral-800">
                <h3 className="font-medium mb-2">Actions ({selectedRule.actions.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedRule.actions.map((a, i) => {
                    const info = ACTION_TYPE_LABELS[a.type];
                    return (
                      <span key={i} className={clsx(
                        "px-3 py-1 rounded-full text-sm",
                        info.color === "blue" && "bg-blue-100 text-blue-700",
                        info.color === "amber" && "bg-amber-100 text-amber-700",
                        info.color === "orange" && "bg-orange-100 text-orange-700",
                        info.color === "red" && "bg-red-100 text-red-700",
                        info.color === "purple" && "bg-purple-100 text-purple-700",
                        info.color === "green" && "bg-green-100 text-green-700",
                        info.color === "neutral" && "bg-neutral-200 text-neutral-700"
                      )}>
                        {info.icon} {info.label}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-neutral-50 rounded-lg dark:bg-neutral-800">
                  <p className="text-sm text-neutral-500">Exécutions</p>
                  <p className="text-xl font-bold">{selectedRule.executionCount}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg dark:bg-green-900/20">
                  <p className="text-sm text-neutral-500">Succès</p>
                  <p className="text-xl font-bold text-green-600">{selectedRule.successCount}</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg dark:bg-red-900/20">
                  <p className="text-sm text-neutral-500">Échecs</p>
                  <p className="text-xl font-bold text-red-600">{selectedRule.failureCount}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setSelectedRule(null)}
                className="flex-1 rounded-lg border border-neutral-200 px-4 py-2 font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RuleCard({
  rule,
  onToggle,
  onDelete,
  onTest,
  onView,
  testResult,
}: {
  rule: AutomationRule;
  onToggle: () => void;
  onDelete: () => void;
  onTest: () => void;
  onView: () => void;
  testResult?: string;
}) {
  const triggerInfo = TRIGGER_TYPE_LABELS[rule.trigger];

  return (
    <div className={clsx(
      "rounded-xl bg-white p-4 shadow-sm dark:bg-neutral-900",
      !rule.enabled && "opacity-60"
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{rule.name}</h3>
            <span className={clsx(
              "px-2 py-0.5 rounded-full text-xs font-medium",
              rule.enabled ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-500"
            )}>
              {rule.enabled ? "Actif" : "Inactif"}
            </span>
          </div>
          <p className="text-sm text-neutral-500 mt-1">{rule.description}</p>

          <div className="flex items-center gap-4 mt-3 text-sm">
            <span className="flex items-center gap-1 text-neutral-500">
              {triggerInfo.icon} {triggerInfo.label}
            </span>
            <span className="text-neutral-400">•</span>
            <span className="text-neutral-500">{rule.conditions.length} condition(s)</span>
            <span className="text-neutral-400">•</span>
            <span className="text-neutral-500">{rule.actions.length} action(s)</span>
          </div>

          {testResult && (
            <div className="mt-2 p-2 bg-blue-50 text-blue-700 text-sm rounded dark:bg-blue-900/20 dark:text-blue-300">
              {testResult}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={onView}
            className="rounded-lg bg-neutral-100 px-3 py-1.5 text-sm font-medium hover:bg-neutral-200 dark:bg-neutral-800"
          >
            Voir
          </button>
          <button
            onClick={onTest}
            className="rounded-lg bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-200"
          >
            Tester
          </button>
          <button
            onClick={onToggle}
            className={clsx(
              "w-10 h-6 rounded-full transition-colors",
              rule.enabled ? "bg-green-500" : "bg-neutral-300"
            )}
          >
            <span className={clsx(
              "block w-5 h-5 rounded-full bg-white shadow transition-transform",
              rule.enabled ? "translate-x-4" : "translate-x-0.5"
            )} />
          </button>
          <button
            onClick={onDelete}
            className="text-red-500 hover:text-red-600 p-1"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}

function WebhookCard({
  webhook,
  onToggle,
  onDelete,
  onTest,
  testResult,
}: {
  webhook: Webhook;
  onToggle: () => void;
  onDelete: () => void;
  onTest: () => void;
  testResult?: { success: boolean; message: string };
}) {
  return (
    <div className={clsx(
      "rounded-xl bg-white p-4 shadow-sm dark:bg-neutral-900",
      !webhook.enabled && "opacity-60"
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔗</span>
            <h3 className="font-semibold">{webhook.name}</h3>
            <span className={clsx(
              "px-2 py-0.5 rounded-full text-xs font-medium",
              webhook.enabled ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-500"
            )}>
              {webhook.enabled ? "Actif" : "Inactif"}
            </span>
          </div>
          <p className="text-sm text-neutral-500 mt-1 font-mono">{webhook.url}</p>

          <div className="flex flex-wrap gap-2 mt-3">
            {webhook.events.map(event => (
              <span key={event} className="px-2 py-0.5 bg-neutral-100 text-neutral-600 text-xs rounded dark:bg-neutral-800">
                {TRIGGER_TYPE_LABELS[event].icon} {TRIGGER_TYPE_LABELS[event].label}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-4 mt-3 text-sm text-neutral-500">
            <span>{webhook.successCount} succès</span>
            <span>{webhook.failureCount} échecs</span>
            {webhook.lastCalledAt && (
              <span>Dernier appel: {new Date(webhook.lastCalledAt).toLocaleString("fr-FR")}</span>
            )}
          </div>

          {testResult && (
            <div className={clsx(
              "mt-2 p-2 text-sm rounded",
              testResult.success
                ? "bg-green-50 text-green-700 dark:bg-green-900/20"
                : "bg-red-50 text-red-700 dark:bg-red-900/20"
            )}>
              {testResult.message}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={onTest}
            className="rounded-lg bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-200"
          >
            Tester
          </button>
          <button
            onClick={onToggle}
            className={clsx(
              "w-10 h-6 rounded-full transition-colors",
              webhook.enabled ? "bg-green-500" : "bg-neutral-300"
            )}
          >
            <span className={clsx(
              "block w-5 h-5 rounded-full bg-white shadow transition-transform",
              webhook.enabled ? "translate-x-4" : "translate-x-0.5"
            )} />
          </button>
          <button
            onClick={onDelete}
            className="text-red-500 hover:text-red-600 p-1"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskCard({
  task,
  onToggle,
  onDelete,
  onRun,
}: {
  task: ScheduledTask;
  onToggle: () => void;
  onDelete: () => void;
  onRun: () => void;
}) {
  const scheduleLabels = {
    daily: "Quotidien",
    weekly: "Hebdomadaire",
    monthly: "Mensuel",
    custom: "Personnalisé",
  };

  const actionInfo = ACTION_TYPE_LABELS[task.action.type];

  return (
    <div className={clsx(
      "rounded-xl bg-white p-4 shadow-sm dark:bg-neutral-900",
      !task.enabled && "opacity-60"
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">⏰</span>
            <h3 className="font-semibold">{task.name}</h3>
            <span className={clsx(
              "px-2 py-0.5 rounded-full text-xs font-medium",
              task.enabled ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-500"
            )}>
              {task.enabled ? "Actif" : "Inactif"}
            </span>
          </div>
          <p className="text-sm text-neutral-500 mt-1">{task.description}</p>

          <div className="flex items-center gap-4 mt-3 text-sm">
            <span className="text-neutral-500">
              {scheduleLabels[task.schedule.type]} à {task.schedule.time || "00:00"}
            </span>
            <span className="text-neutral-400">•</span>
            <span className={clsx(
              "px-2 py-0.5 rounded text-xs",
              actionInfo.color === "blue" && "bg-blue-100 text-blue-700",
              actionInfo.color === "amber" && "bg-amber-100 text-amber-700",
              actionInfo.color === "red" && "bg-red-100 text-red-700"
            )}>
              {actionInfo.icon} {actionInfo.label}
            </span>
          </div>

          <div className="flex items-center gap-4 mt-2 text-sm text-neutral-500">
            <span>{task.runCount} exécutions</span>
            {task.lastRunAt && (
              <span>Dernière: {new Date(task.lastRunAt).toLocaleString("fr-FR")}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={onRun}
            className="rounded-lg bg-green-100 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-200"
          >
            Exécuter
          </button>
          <button
            onClick={onToggle}
            className={clsx(
              "w-10 h-6 rounded-full transition-colors",
              task.enabled ? "bg-green-500" : "bg-neutral-300"
            )}
          >
            <span className={clsx(
              "block w-5 h-5 rounded-full bg-white shadow transition-transform",
              task.enabled ? "translate-x-4" : "translate-x-0.5"
            )} />
          </button>
          <button
            onClick={onDelete}
            className="text-red-500 hover:text-red-600 p-1"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}
