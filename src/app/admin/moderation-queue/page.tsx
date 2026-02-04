"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { useAuthStore } from "@/lib/useAuthStore";
import {
  useModerationQueueStore,
  PRIORITY_LABELS,
  STATUS_LABELS,
  CONTENT_TYPE_LABELS,
  type ModerationItem,
  type ModerationItemStatus,
  type Priority,
  type ContentType,
  type ModerationTemplate,
} from "@/lib/useModerationQueueStore";

export default function ModerationQueuePage() {
  const router = useRouter();
  const { currentUser, isAdmin, isModerator } = useAuthStore();
  const {
    items,
    templates,
    getQueueItems,
    getQueueStats,
    getAllModeratorStats,
    getSLAStatus,
    checkSLABreaches,
    claimItem,
    approveItem,
    rejectItem,
    escalateItem,
    addNote,
    addTag,
    removeTag,
    bulkAction,
    applyTemplate,
  } = useModerationQueueStore();

  // Filters
  const [statusFilter, setStatusFilter] = useState<ModerationItemStatus[]>(["pending", "in_review"]);
  const [priorityFilter, setPriorityFilter] = useState<Priority[]>([]);
  const [contentTypeFilter, setContentTypeFilter] = useState<ContentType[]>([]);
  const [showSLABreached, setShowSLABreached] = useState(false);

  // UI State
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [rejectReason, setRejectReason] = useState("");
  const [escalateReason, setEscalateReason] = useState("");
  const [noteText, setNoteText] = useState("");
  const [newTag, setNewTag] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [activeTab, setActiveTab] = useState<"queue" | "templates" | "stats">("queue");

  // Check SLA breaches periodically
  useEffect(() => {
    checkSLABreaches();
    const interval = setInterval(checkSLABreaches, 60000);
    return () => clearInterval(interval);
  }, [checkSLABreaches]);

  if (!currentUser || (!isAdmin && !isModerator)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="text-center">
          <span className="text-6xl">🔒</span>
          <h1 className="mt-4 text-xl font-bold">Accès refusé</h1>
          <p className="text-neutral-500">Réservé aux modérateurs</p>
          <button onClick={() => router.push("/")} className="mt-4 rounded-lg bg-fuchsia-500 px-4 py-2 text-white">
            Retour
          </button>
        </div>
      </div>
    );
  }

  const stats = getQueueStats();
  const moderatorStats = getAllModeratorStats();
  const filteredItems = getQueueItems({
    status: statusFilter.length > 0 ? statusFilter : undefined,
    priority: priorityFilter.length > 0 ? priorityFilter : undefined,
    contentType: contentTypeFilter.length > 0 ? contentTypeFilter : undefined,
    slaBreached: showSLABreached ? true : undefined,
  });

  const handleClaim = (itemId: string) => {
    claimItem(itemId, currentUser.handle);
  };

  const handleApprove = (itemId: string) => {
    approveItem(itemId, currentUser.handle);
    setSelectedItem(null);
  };

  const handleReject = (itemId: string) => {
    if (!rejectReason.trim()) return;
    rejectItem(itemId, currentUser.handle, rejectReason);
    setRejectReason("");
    setSelectedItem(null);
  };

  const handleEscalate = (itemId: string) => {
    if (!escalateReason.trim()) return;
    escalateItem(itemId, currentUser.handle, escalateReason);
    setEscalateReason("");
    setSelectedItem(null);
  };

  const handleAddNote = (itemId: string) => {
    if (!noteText.trim()) return;
    addNote(itemId, noteText, currentUser.handle, true);
    setNoteText("");
  };

  const handleAddTag = (itemId: string) => {
    if (!newTag.trim()) return;
    addTag(itemId, newTag.toLowerCase());
    setNewTag("");
  };

  const handleBulkApprove = () => {
    bulkAction(selectedItems, {
      status: "approved",
      actionTaken: "bulk_approved",
      moderatorHandle: currentUser.handle,
    });
    setSelectedItems([]);
  };

  const handleBulkReject = () => {
    const reason = prompt("Raison du rejet (pour tous les éléments sélectionnés):");
    if (!reason) return;
    bulkAction(selectedItems, {
      status: "rejected",
      actionTaken: "bulk_rejected",
      actionReason: reason,
      moderatorHandle: currentUser.handle,
    });
    setSelectedItems([]);
  };

  const handleApplyTemplate = (itemId: string, templateId: string) => {
    applyTemplate(itemId, templateId, currentUser.handle);
    setShowTemplates(false);
    setSelectedItem(null);
  };

  const toggleSelectItem = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(i => i.id));
    }
  };

  const tabs = [
    { id: "queue", label: "File d'attente", count: stats.pending },
    { id: "templates", label: "Templates" },
    { id: "stats", label: "Statistiques" },
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
                🛡️ File de modération
              </h1>
              <p className="text-sm text-neutral-500">Queue avancée avec SLA et actions en masse</p>
            </div>
          </div>

          {/* Stats rapides */}
          <div className="flex items-center gap-4 text-sm">
            <div className="text-center">
              <p className="text-neutral-500">En attente</p>
              <p className="text-xl font-bold text-amber-600">{stats.pending}</p>
            </div>
            <div className="text-center">
              <p className="text-neutral-500">Urgent</p>
              <p className="text-xl font-bold text-red-600">
                {stats.byPriority.critical || 0 + (stats.byPriority.urgent || 0)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-neutral-500">SLA dépassé</p>
              <p className={clsx(
                "text-xl font-bold",
                stats.slaBreachRate > 10 ? "text-red-600" : "text-green-600"
              )}>
                {stats.slaBreachRate}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-neutral-500">Traités (24h)</p>
              <p className="text-xl font-bold text-green-600">{stats.todayProcessed}</p>
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
                {"count" in tab && tab.count !== undefined && (
                  <span className="ml-2 rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Queue Tab */}
        {activeTab === "queue" && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-neutral-900">
              <div className="flex flex-wrap items-center gap-4">
                {/* Status filter */}
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Statut</label>
                  <div className="flex gap-1">
                    {(["pending", "in_review", "escalated"] as ModerationItemStatus[]).map(status => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(prev =>
                          prev.includes(status)
                            ? prev.filter(s => s !== status)
                            : [...prev, status]
                        )}
                        className={clsx(
                          "px-2 py-1 rounded text-xs font-medium transition-colors",
                          statusFilter.includes(status)
                            ? "bg-fuchsia-500 text-white"
                            : "bg-neutral-100 dark:bg-neutral-800"
                        )}
                      >
                        {STATUS_LABELS[status].label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Priority filter */}
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Priorité</label>
                  <div className="flex gap-1">
                    {(["critical", "urgent", "high", "normal", "low"] as Priority[]).map(priority => (
                      <button
                        key={priority}
                        onClick={() => setPriorityFilter(prev =>
                          prev.includes(priority)
                            ? prev.filter(p => p !== priority)
                            : [...prev, priority]
                        )}
                        className={clsx(
                          "px-2 py-1 rounded text-xs font-medium transition-colors",
                          priorityFilter.includes(priority)
                            ? "bg-fuchsia-500 text-white"
                            : "bg-neutral-100 dark:bg-neutral-800"
                        )}
                      >
                        {PRIORITY_LABELS[priority].icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content type filter */}
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Type</label>
                  <div className="flex gap-1">
                    {(["post", "comment", "message", "profile"] as ContentType[]).map(type => (
                      <button
                        key={type}
                        onClick={() => setContentTypeFilter(prev =>
                          prev.includes(type)
                            ? prev.filter(t => t !== type)
                            : [...prev, type]
                        )}
                        className={clsx(
                          "px-2 py-1 rounded text-xs font-medium transition-colors",
                          contentTypeFilter.includes(type)
                            ? "bg-fuchsia-500 text-white"
                            : "bg-neutral-100 dark:bg-neutral-800"
                        )}
                      >
                        {CONTENT_TYPE_LABELS[type].icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SLA breached */}
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">SLA</label>
                  <button
                    onClick={() => setShowSLABreached(!showSLABreached)}
                    className={clsx(
                      "px-3 py-1 rounded text-xs font-medium transition-colors",
                      showSLABreached
                        ? "bg-red-500 text-white"
                        : "bg-neutral-100 dark:bg-neutral-800"
                    )}
                  >
                    ⏰ Dépassés uniquement
                  </button>
                </div>

                <div className="flex-1" />

                {/* Bulk actions */}
                {selectedItems.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-neutral-500">{selectedItems.length} sélectionnés</span>
                    <button
                      onClick={handleBulkApprove}
                      className="rounded-lg bg-green-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-600"
                    >
                      ✓ Approuver
                    </button>
                    <button
                      onClick={handleBulkReject}
                      className="rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600"
                    >
                      ✕ Rejeter
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Select all */}
            {filteredItems.length > 0 && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedItems.length === filteredItems.length}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded"
                />
                <span className="text-sm text-neutral-500">
                  Tout sélectionner ({filteredItems.length})
                </span>
              </div>
            )}

            {/* Queue items */}
            {filteredItems.length === 0 ? (
              <div className="rounded-xl bg-white p-12 text-center dark:bg-neutral-900">
                <span className="text-5xl">✅</span>
                <p className="mt-4 text-neutral-500">Aucun élément dans la file</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredItems.map(item => {
                  const slaStatus = getSLAStatus(item);
                  const priorityInfo = PRIORITY_LABELS[item.priority];
                  const statusInfo = STATUS_LABELS[item.status];
                  const typeInfo = CONTENT_TYPE_LABELS[item.contentType];

                  return (
                    <div
                      key={item.id}
                      className={clsx(
                        "rounded-xl bg-white p-4 shadow-sm dark:bg-neutral-900 border-l-4",
                        item.priority === "critical" && "border-l-red-500",
                        item.priority === "urgent" && "border-l-orange-500",
                        item.priority === "high" && "border-l-amber-500",
                        item.priority === "normal" && "border-l-blue-500",
                        item.priority === "low" && "border-l-neutral-300"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={() => toggleSelectItem(item.id)}
                          className="mt-1 h-4 w-4 rounded"
                        />

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            {/* Priority */}
                            <span className={clsx(
                              "px-2 py-0.5 rounded-full text-xs font-medium",
                              priorityInfo.color === "red" && "bg-red-100 text-red-700",
                              priorityInfo.color === "orange" && "bg-orange-100 text-orange-700",
                              priorityInfo.color === "amber" && "bg-amber-100 text-amber-700",
                              priorityInfo.color === "blue" && "bg-blue-100 text-blue-700",
                              priorityInfo.color === "neutral" && "bg-neutral-100 text-neutral-600"
                            )}>
                              {priorityInfo.icon} {priorityInfo.label}
                            </span>

                            {/* Status */}
                            <span className={clsx(
                              "px-2 py-0.5 rounded-full text-xs font-medium",
                              statusInfo.color === "amber" && "bg-amber-100 text-amber-700",
                              statusInfo.color === "blue" && "bg-blue-100 text-blue-700",
                              statusInfo.color === "green" && "bg-green-100 text-green-700",
                              statusInfo.color === "red" && "bg-red-100 text-red-700",
                              statusInfo.color === "purple" && "bg-purple-100 text-purple-700"
                            )}>
                              {statusInfo.label}
                            </span>

                            {/* Type */}
                            <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 text-xs dark:bg-neutral-800">
                              {typeInfo.icon} {typeInfo.label}
                            </span>

                            {/* Source */}
                            <span className="text-xs text-neutral-500">
                              via {item.source === "report" ? "signalement" : item.source === "auto_detection" ? "détection auto" : item.source === "ai_flagged" ? "IA" : "manuel"}
                            </span>

                            {/* Report count */}
                            {item.reportCount > 1 && (
                              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs">
                                🚩 {item.reportCount} signalements
                              </span>
                            )}

                            {/* SLA */}
                            <span className={clsx(
                              "px-2 py-0.5 rounded-full text-xs font-medium",
                              slaStatus.status === "ok" && "bg-green-100 text-green-700",
                              slaStatus.status === "warning" && "bg-amber-100 text-amber-700",
                              slaStatus.status === "breached" && "bg-red-100 text-red-700 animate-pulse"
                            )}>
                              ⏰ {slaStatus.status === "breached" ? "SLA dépassé" : `${slaStatus.hoursRemaining}h restantes`}
                            </span>
                          </div>

                          {/* Content text */}
                          <p className="text-sm mb-2">{item.contentText}</p>

                          {/* Meta */}
                          <div className="flex items-center gap-4 text-xs text-neutral-500">
                            <span>@{item.contentAuthorHandle}</span>
                            <span>{item.reason}</span>
                            {item.assignedTo && (
                              <span className="text-blue-600">Assigné à @{item.assignedTo}</span>
                            )}
                          </div>

                          {/* AI Classification */}
                          {item.aiClassification && (
                            <div className="mt-2 p-2 bg-purple-50 rounded text-xs dark:bg-purple-900/20">
                              <span className="font-medium">🤖 IA:</span>{" "}
                              {item.aiClassification.category} ({item.aiClassification.confidence}%) →{" "}
                              <span className="font-medium">{item.aiClassification.suggestedAction}</span>
                            </div>
                          )}

                          {/* Tags */}
                          {item.tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {item.tags.map(tag => (
                                <span key={tag} className="px-2 py-0.5 rounded bg-neutral-100 text-xs dark:bg-neutral-800">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-1">
                          {item.status === "pending" && !item.assignedTo && (
                            <button
                              onClick={() => handleClaim(item.id)}
                              className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600"
                            >
                              Prendre
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-medium hover:bg-neutral-200 dark:bg-neutral-800"
                          >
                            Examiner
                          </button>
                          <button
                            onClick={() => handleApprove(item.id)}
                            className="rounded-lg bg-green-100 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-200"
                          >
                            ✓ OK
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === "templates" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Templates de réponse</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {templates.map(template => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === "stats" && (
          <div className="space-y-6">
            {/* Overview */}
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard label="Total en queue" value={stats.total} />
              <StatCard label="En attente" value={stats.pending} color="amber" />
              <StatCard label="En examen" value={stats.inReview} color="blue" />
              <StatCard label="Approuvés" value={stats.approved} color="green" />
              <StatCard label="Rejetés" value={stats.rejected} color="red" />
              <StatCard label="Escaladés" value={stats.escalated} color="purple" />
              <StatCard label="Temps moyen (h)" value={stats.avgReviewTimeHours} />
              <StatCard label="SLA dépassés" value={`${stats.slaBreachRate}%`} color={stats.slaBreachRate > 10 ? "red" : "green"} />
            </div>

            {/* By priority */}
            <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-neutral-900">
              <h3 className="font-semibold mb-4">Par priorité</h3>
              <div className="space-y-2">
                {(["critical", "urgent", "high", "normal", "low"] as Priority[]).map(priority => {
                  const count = stats.byPriority[priority] || 0;
                  const percent = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                  const info = PRIORITY_LABELS[priority];
                  return (
                    <div key={priority} className="flex items-center gap-3">
                      <span className="w-24">{info.icon} {info.label}</span>
                      <div className="flex-1 h-4 bg-neutral-100 rounded-full overflow-hidden dark:bg-neutral-800">
                        <div
                          className={clsx(
                            "h-full rounded-full",
                            info.color === "red" && "bg-red-500",
                            info.color === "orange" && "bg-orange-500",
                            info.color === "amber" && "bg-amber-500",
                            info.color === "blue" && "bg-blue-500",
                            info.color === "neutral" && "bg-neutral-400"
                          )}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="w-12 text-right text-sm">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Moderator stats */}
            <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-neutral-900">
              <h3 className="font-semibold mb-4">Performance des modérateurs</h3>
              {moderatorStats.length === 0 ? (
                <p className="text-neutral-500 text-sm">Aucune donnée disponible</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b dark:border-neutral-700">
                        <th className="text-left py-2">Modérateur</th>
                        <th className="text-right py-2">Examinés</th>
                        <th className="text-right py-2">Approuvés</th>
                        <th className="text-right py-2">Rejetés</th>
                        <th className="text-right py-2">Escaladés</th>
                        <th className="text-right py-2">Temps moy.</th>
                        <th className="text-right py-2">Aujourd'hui</th>
                      </tr>
                    </thead>
                    <tbody>
                      {moderatorStats.map(stat => (
                        <tr key={stat.moderatorHandle} className="border-b dark:border-neutral-800">
                          <td className="py-2 font-medium">@{stat.moderatorHandle}</td>
                          <td className="text-right py-2">{stat.itemsReviewed}</td>
                          <td className="text-right py-2 text-green-600">{stat.itemsApproved}</td>
                          <td className="text-right py-2 text-red-600">{stat.itemsRejected}</td>
                          <td className="text-right py-2 text-purple-600">{stat.itemsEscalated}</td>
                          <td className="text-right py-2">{Math.round(stat.averageReviewTimeSeconds / 60)}min</td>
                          <td className="text-right py-2 font-medium">{stat.todayStats.reviewed}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl my-8 rounded-2xl bg-white p-6 dark:bg-neutral-900">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Examen du contenu</h2>
              <button onClick={() => setSelectedItem(null)} className="text-neutral-500 hover:text-neutral-900">✕</button>
            </div>

            {/* Content */}
            <div className="p-4 bg-neutral-50 rounded-lg mb-4 dark:bg-neutral-800">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium">@{selectedItem.contentAuthorHandle}</span>
                <span className="text-xs text-neutral-500">{CONTENT_TYPE_LABELS[selectedItem.contentType].label}</span>
              </div>
              <p>{selectedItem.contentText}</p>
            </div>

            {/* Info */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-neutral-50 rounded-lg dark:bg-neutral-800">
                <p className="text-xs text-neutral-500">Raison</p>
                <p className="font-medium">{selectedItem.reason}</p>
              </div>
              <div className="p-3 bg-neutral-50 rounded-lg dark:bg-neutral-800">
                <p className="text-xs text-neutral-500">Signalements</p>
                <p className="font-medium">{selectedItem.reportCount}</p>
              </div>
            </div>

            {/* AI suggestion */}
            {selectedItem.aiClassification && (
              <div className="p-4 bg-purple-50 rounded-lg mb-4 dark:bg-purple-900/20">
                <p className="text-sm font-medium mb-1">🤖 Suggestion IA</p>
                <p className="text-sm">
                  Catégorie: <strong>{selectedItem.aiClassification.category}</strong> ({selectedItem.aiClassification.confidence}%)<br />
                  Action suggérée: <strong>{selectedItem.aiClassification.suggestedAction}</strong>
                </p>
              </div>
            )}

            {/* Notes */}
            {selectedItem.notes.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">Notes</p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedItem.notes.map(note => (
                    <div key={note.id} className="p-2 bg-neutral-50 rounded text-sm dark:bg-neutral-800">
                      <p>{note.text}</p>
                      <p className="text-xs text-neutral-500">@{note.authorHandle} - {new Date(note.createdAt).toLocaleString("fr-FR")}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add note */}
            <div className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Ajouter une note..."
                  className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                />
                <button
                  onClick={() => handleAddNote(selectedItem.id)}
                  disabled={!noteText.trim()}
                  className="rounded-lg bg-neutral-100 px-3 py-2 text-sm font-medium hover:bg-neutral-200 disabled:opacity-50 dark:bg-neutral-800"
                >
                  Ajouter
                </button>
              </div>
            </div>

            {/* Tags */}
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">Tags</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedItem.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 rounded bg-neutral-100 text-sm flex items-center gap-1 dark:bg-neutral-800">
                    #{tag}
                    <button onClick={() => removeTag(selectedItem.id, tag)} className="text-red-500 hover:text-red-700">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Nouveau tag..."
                  className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                />
                <button
                  onClick={() => handleAddTag(selectedItem.id)}
                  disabled={!newTag.trim()}
                  className="rounded-lg bg-neutral-100 px-3 py-2 text-sm font-medium hover:bg-neutral-200 disabled:opacity-50 dark:bg-neutral-800"
                >
                  Ajouter
                </button>
              </div>
            </div>

            {/* Templates */}
            <div className="mb-4">
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="text-sm text-fuchsia-600 hover:text-fuchsia-700"
              >
                📋 Utiliser un template
              </button>
              {showTemplates && (
                <div className="mt-2 p-3 bg-neutral-50 rounded-lg dark:bg-neutral-800">
                  <div className="space-y-2">
                    {templates.map(tpl => (
                      <button
                        key={tpl.id}
                        onClick={() => handleApplyTemplate(selectedItem.id, tpl.id)}
                        className="w-full text-left p-2 rounded bg-white hover:bg-neutral-100 dark:bg-neutral-900 dark:hover:bg-neutral-700"
                      >
                        <p className="font-medium text-sm">{tpl.name}</p>
                        <p className="text-xs text-neutral-500">{tpl.action}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {/* Approve */}
              <button
                onClick={() => handleApprove(selectedItem.id)}
                className="w-full rounded-lg bg-green-500 px-4 py-2 font-medium text-white hover:bg-green-600"
              >
                ✓ Approuver le contenu
              </button>

              {/* Reject */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Raison du rejet..."
                  className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                />
                <button
                  onClick={() => handleReject(selectedItem.id)}
                  disabled={!rejectReason.trim()}
                  className="rounded-lg bg-red-500 px-4 py-2 font-medium text-white hover:bg-red-600 disabled:opacity-50"
                >
                  ✕ Rejeter
                </button>
              </div>

              {/* Escalate */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  placeholder="Raison de l'escalade..."
                  className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                />
                <button
                  onClick={() => handleEscalate(selectedItem.id)}
                  disabled={!escalateReason.trim()}
                  className="rounded-lg bg-purple-500 px-4 py-2 font-medium text-white hover:bg-purple-600 disabled:opacity-50"
                >
                  ⬆️ Escalader
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TemplateCard({ template }: { template: ModerationTemplate }) {
  const actionColors = {
    approve: "bg-green-100 text-green-700",
    reject: "bg-red-100 text-red-700",
    warn: "bg-amber-100 text-amber-700",
    delete: "bg-red-100 text-red-700",
    suspend: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-neutral-900">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold">{template.name}</h3>
          <span className={clsx("px-2 py-0.5 rounded-full text-xs font-medium", actionColors[template.action])}>
            {template.action}
          </span>
        </div>
        <span className="text-xs text-neutral-500">{template.usageCount} utilisations</span>
      </div>
      <p className="text-sm text-neutral-500 mt-2 line-clamp-2">{template.messageTemplate || template.internalNote}</p>
      <p className="text-xs text-neutral-400 mt-2">Catégorie: {template.category}</p>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number | string; color?: "green" | "red" | "amber" | "blue" | "purple" }) {
  return (
    <div className={clsx(
      "rounded-xl p-4 shadow-sm",
      color === "green" && "bg-green-50 dark:bg-green-900/20",
      color === "red" && "bg-red-50 dark:bg-red-900/20",
      color === "amber" && "bg-amber-50 dark:bg-amber-900/20",
      color === "blue" && "bg-blue-50 dark:bg-blue-900/20",
      color === "purple" && "bg-purple-50 dark:bg-purple-900/20",
      !color && "bg-white dark:bg-neutral-900"
    )}>
      <p className="text-sm text-neutral-500">{label}</p>
      <p className={clsx(
        "text-2xl font-bold",
        color === "green" && "text-green-600",
        color === "red" && "text-red-600",
        color === "amber" && "text-amber-600",
        color === "blue" && "text-blue-600",
        color === "purple" && "text-purple-600"
      )}>{value}</p>
    </div>
  );
}
