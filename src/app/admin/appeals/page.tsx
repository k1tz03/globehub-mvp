"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { useAuthStore } from "@/lib/useAuthStore";
import {
  useAppealsStore,
  DECISION_TYPE_LABELS,
  APPEAL_STATUS_LABELS,
  PRIORITY_LABELS,
  type Appeal,
  type AppealStatus,
  type AppealPriority,
} from "@/lib/useAppealsStore";
import { timeAgo } from "@/lib/time";

type Tab = "all" | "pending" | "mine" | "overdue" | "resolved";

export default function AdminAppealsPage() {
  const router = useRouter();
  const { currentUser, isModerator, isAdmin } = useAuthStore();
  const {
    appeals,
    templates,
    assignAppeal,
    startReview,
    escalateAppeal,
    approveAppeal,
    rejectAppeal,
    partiallyApproveAppeal,
    addMessage,
    applyTemplate,
    getPendingAppeals,
    getOverdueAppeals,
    getAssignedAppeals,
    getStats,
  } = useAppealsStore();

  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [responseText, setResponseText] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveExplanation, setApproveExplanation] = useState("");
  const [approveActions, setApproveActions] = useState("");

  // Check access
  if (!currentUser || !isModerator) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="text-center">
          <span className="text-6xl">🔒</span>
          <h1 className="mt-4 text-xl font-bold">Accès refusé</h1>
          <button onClick={() => router.push("/")} className="mt-4 rounded-lg bg-fuchsia-500 px-4 py-2 text-white">
            Retour
          </button>
        </div>
      </div>
    );
  }

  const stats = getStats();
  const pendingAppeals = getPendingAppeals();
  const overdueAppeals = getOverdueAppeals();
  const myAppeals = getAssignedAppeals(currentUser.handle);

  const filteredAppeals = useMemo(() => {
    switch (activeTab) {
      case "pending":
        return pendingAppeals;
      case "mine":
        return myAppeals;
      case "overdue":
        return overdueAppeals;
      case "resolved":
        return appeals.filter(a => a.status === "approved" || a.status === "rejected" || a.status === "withdrawn");
      default:
        return appeals;
    }
  }, [activeTab, appeals, pendingAppeals, myAppeals, overdueAppeals]);

  const handleTakeAppeal = (appeal: Appeal) => {
    assignAppeal(appeal.id, currentUser.handle);
    startReview(appeal.id, currentUser.handle);
  };

  const handleSendMessage = () => {
    if (!selectedAppeal || !responseText.trim()) return;
    addMessage(selectedAppeal.id, responseText, "moderator", currentUser.handle, false);
    setResponseText("");
  };

  const handleAddInternalNote = () => {
    if (!selectedAppeal || !internalNote.trim()) return;
    addMessage(selectedAppeal.id, internalNote, "moderator", currentUser.handle, true);
    setInternalNote("");
  };

  const handleApplyTemplate = () => {
    if (!selectedTemplate || !selectedAppeal) return;
    const text = applyTemplate(selectedTemplate, {
      username: selectedAppeal.userHandle,
      decisionType: DECISION_TYPE_LABELS[selectedAppeal.decisionType].label,
      explanation: "",
    });
    setResponseText(text);
  };

  const handleApprove = () => {
    if (!selectedAppeal) return;
    const actions = approveActions.split("\n").filter(Boolean);
    approveAppeal(selectedAppeal.id, approveExplanation, actions, currentUser.handle);
    setShowApproveModal(false);
    setApproveExplanation("");
    setApproveActions("");
    setSelectedAppeal(null);
  };

  const handleReject = () => {
    if (!selectedAppeal || !rejectReason.trim()) return;
    rejectAppeal(selectedAppeal.id, rejectReason, currentUser.handle);
    setShowRejectModal(false);
    setRejectReason("");
    setSelectedAppeal(null);
  };

  const handleEscalate = () => {
    if (!selectedAppeal) return;
    escalateAppeal(selectedAppeal.id, "Nécessite une décision de niveau supérieur", currentUser.handle);
  };

  const tabs: { id: Tab; label: string; count?: number; urgent?: boolean }[] = [
    { id: "pending", label: "En attente", count: pendingAppeals.length },
    { id: "mine", label: "Mes appels", count: myAppeals.length },
    { id: "overdue", label: "En retard", count: overdueAppeals.length, urgent: overdueAppeals.length > 0 },
    { id: "resolved", label: "Résolus" },
    { id: "all", label: "Tous" },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/80 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/admin")} className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
              ← Retour
            </button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                ⚖️ Gestion des Appels
              </h1>
              <p className="text-sm text-neutral-500">Conformité DSA - Système d'appel des décisions</p>
            </div>
          </div>

          {overdueAppeals.length > 0 && (
            <div className="flex items-center gap-2 rounded-full bg-red-100 px-4 py-2 text-red-700 animate-pulse dark:bg-red-900/30 dark:text-red-400">
              <span>⚠️</span>
              <span className="font-medium">{overdueAppeals.length} appel(s) en retard SLA !</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex gap-1 overflow-x-auto pb-px">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "border-fuchsia-500 text-fuchsia-600 dark:text-fuchsia-400"
                    : "border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                )}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={clsx(
                    "rounded-full px-2 py-0.5 text-xs text-white",
                    tab.urgent ? "bg-red-500 animate-pulse" : "bg-neutral-400"
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-6">
          <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-neutral-900">
            <p className="text-sm text-neutral-500">Total</p>
            <p className="text-2xl font-bold">{stats.totalAppeals}</p>
          </div>
          <div className="rounded-xl bg-amber-50 p-4 shadow-sm dark:bg-amber-900/20">
            <p className="text-sm text-amber-600">En attente</p>
            <p className="text-2xl font-bold text-amber-600">{stats.pendingAppeals}</p>
          </div>
          <div className={clsx(
            "rounded-xl p-4 shadow-sm",
            stats.overdueAppeals > 0 ? "bg-red-50 dark:bg-red-900/20" : "bg-white dark:bg-neutral-900"
          )}>
            <p className={clsx("text-sm", stats.overdueAppeals > 0 ? "text-red-600" : "text-neutral-500")}>
              En retard
            </p>
            <p className={clsx("text-2xl font-bold", stats.overdueAppeals > 0 && "text-red-600")}>
              {stats.overdueAppeals}
            </p>
          </div>
          <div className="rounded-xl bg-green-50 p-4 shadow-sm dark:bg-green-900/20">
            <p className="text-sm text-green-600">Taux acceptation</p>
            <p className="text-2xl font-bold text-green-600">{stats.approvalRate}%</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-neutral-900">
            <p className="text-sm text-neutral-500">Temps moyen</p>
            <p className="text-2xl font-bold">{stats.avgResolutionTime}h</p>
          </div>
          <div className="rounded-xl bg-blue-50 p-4 shadow-sm dark:bg-blue-900/20">
            <p className="text-sm text-blue-600">Cette semaine</p>
            <p className="text-2xl font-bold text-blue-600">{stats.thisWeek}</p>
          </div>
        </div>

        {/* Appeals list */}
        <div className="space-y-3">
          {filteredAppeals.length === 0 ? (
            <div className="rounded-xl bg-white p-12 text-center dark:bg-neutral-900">
              <span className="text-5xl">✅</span>
              <p className="mt-4 text-neutral-500">Aucun appel à afficher</p>
            </div>
          ) : (
            filteredAppeals.map(appeal => {
              const decisionInfo = DECISION_TYPE_LABELS[appeal.decisionType];
              const statusInfo = APPEAL_STATUS_LABELS[appeal.status];
              const priorityInfo = PRIORITY_LABELS[appeal.priority];

              return (
                <div
                  key={appeal.id}
                  className={clsx(
                    "rounded-xl bg-white p-4 shadow-sm dark:bg-neutral-900",
                    appeal.isOverdue && "ring-2 ring-red-500"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="text-2xl flex-shrink-0">{decisionInfo.icon}</span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">{decisionInfo.label}</h3>
                          <span className={clsx(
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            statusInfo.color === "amber" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30",
                            statusInfo.color === "blue" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30",
                            statusInfo.color === "green" && "bg-green-100 text-green-700 dark:bg-green-900/30",
                            statusInfo.color === "red" && "bg-red-100 text-red-700 dark:bg-red-900/30",
                            statusInfo.color === "purple" && "bg-purple-100 text-purple-700 dark:bg-purple-900/30",
                            statusInfo.color === "neutral" && "bg-neutral-100 text-neutral-700 dark:bg-neutral-800"
                          )}>
                            {statusInfo.icon} {statusInfo.label}
                          </span>
                          <span className={clsx(
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            priorityInfo.color === "neutral" && "bg-neutral-100 text-neutral-600",
                            priorityInfo.color === "blue" && "bg-blue-100 text-blue-600",
                            priorityInfo.color === "amber" && "bg-amber-100 text-amber-600",
                            priorityInfo.color === "red" && "bg-red-100 text-red-600"
                          )}>
                            {priorityInfo.label}
                          </span>
                          {appeal.isOverdue && (
                            <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-medium text-white animate-pulse">
                              ⚠️ SLA dépassé
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-500 mt-1">
                          De <strong>@{appeal.userHandle}</strong> • {timeAgo(appeal.createdAt)}
                        </p>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 line-clamp-2">
                          {appeal.appealReason}
                        </p>
                        {appeal.assignedTo && (
                          <p className="text-xs text-neutral-400 mt-1">
                            Assigné à @{appeal.assignedTo}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      {appeal.status === "pending" && !appeal.assignedTo && (
                        <button
                          onClick={() => handleTakeAppeal(appeal)}
                          className="rounded-lg bg-fuchsia-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-fuchsia-600"
                        >
                          Prendre en charge
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedAppeal(appeal)}
                        className="rounded-lg bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
                      >
                        Détails
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Appeal detail modal */}
      {selectedAppeal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
          <div className="w-full max-w-3xl my-8 rounded-2xl bg-white dark:bg-neutral-900">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-200 p-4 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">{DECISION_TYPE_LABELS[selectedAppeal.decisionType].icon}</span>
                <h2 className="text-lg font-semibold">Détails de l'appel</h2>
                <span className={clsx(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  APPEAL_STATUS_LABELS[selectedAppeal.status].color === "amber" && "bg-amber-100 text-amber-700",
                  APPEAL_STATUS_LABELS[selectedAppeal.status].color === "blue" && "bg-blue-100 text-blue-700",
                  APPEAL_STATUS_LABELS[selectedAppeal.status].color === "green" && "bg-green-100 text-green-700",
                  APPEAL_STATUS_LABELS[selectedAppeal.status].color === "red" && "bg-red-100 text-red-700"
                )}>
                  {APPEAL_STATUS_LABELS[selectedAppeal.status].label}
                </span>
              </div>
              <button onClick={() => setSelectedAppeal(null)} className="text-neutral-500 hover:text-neutral-900">
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Info cards */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800">
                  <p className="font-medium text-neutral-500">Appelant</p>
                  <p>@{selectedAppeal.userHandle}</p>
                  <p className="text-xs text-neutral-400">{selectedAppeal.userEmail}</p>
                </div>
                <div className="rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800">
                  <p className="font-medium text-neutral-500">Décision contestée</p>
                  <p>{DECISION_TYPE_LABELS[selectedAppeal.decisionType].label}</p>
                  <p className="text-xs text-neutral-400">{timeAgo(selectedAppeal.decisionDate)}</p>
                </div>
                <div className="rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800">
                  <p className="font-medium text-neutral-500">Modérateur initial</p>
                  <p>@{selectedAppeal.originalModerator || "Système"}</p>
                </div>
                <div className="rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800">
                  <p className="font-medium text-neutral-500">Deadline SLA</p>
                  <p className={selectedAppeal.isOverdue ? "text-red-600 font-medium" : ""}>
                    {new Date(selectedAppeal.slaDeadline).toLocaleString("fr-FR")}
                  </p>
                </div>
              </div>

              {/* Decision reason */}
              <div>
                <p className="font-medium text-sm text-neutral-500 mb-1">Raison de la décision initiale</p>
                <p className="rounded-lg bg-red-50 p-3 text-sm dark:bg-red-900/20">{selectedAppeal.decisionReason}</p>
              </div>

              {/* Appeal reason */}
              <div>
                <p className="font-medium text-sm text-neutral-500 mb-1">Motif de l'appel</p>
                <p className="rounded-lg bg-blue-50 p-3 text-sm dark:bg-blue-900/20">{selectedAppeal.appealReason}</p>
              </div>

              {selectedAppeal.additionalContext && (
                <div>
                  <p className="font-medium text-sm text-neutral-500 mb-1">Contexte additionnel</p>
                  <p className="rounded-lg bg-neutral-50 p-3 text-sm dark:bg-neutral-800">{selectedAppeal.additionalContext}</p>
                </div>
              )}

              {selectedAppeal.evidenceUrls && selectedAppeal.evidenceUrls.length > 0 && (
                <div>
                  <p className="font-medium text-sm text-neutral-500 mb-1">Preuves fournies</p>
                  <div className="space-y-1">
                    {selectedAppeal.evidenceUrls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block text-sm text-blue-500 hover:underline">
                        📎 {url}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              <div>
                <p className="font-medium text-sm text-neutral-500 mb-2">Historique des échanges</p>
                <div className="space-y-2 max-h-48 overflow-y-auto rounded-lg border border-neutral-200 p-3 dark:border-neutral-700">
                  {selectedAppeal.messages.map(msg => (
                    <div
                      key={msg.id}
                      className={clsx(
                        "rounded-lg p-2 text-sm",
                        msg.from === "user" && "bg-blue-50 dark:bg-blue-900/20",
                        msg.from === "moderator" && !msg.isInternal && "bg-fuchsia-50 dark:bg-fuchsia-900/20",
                        msg.from === "moderator" && msg.isInternal && "bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500",
                        msg.from === "system" && "bg-neutral-50 dark:bg-neutral-800 text-neutral-500 italic"
                      )}
                    >
                      <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1">
                        <span>
                          {msg.from === "user" && "👤 Utilisateur"}
                          {msg.from === "moderator" && `🛡️ @${msg.senderHandle}`}
                          {msg.from === "system" && "🤖 Système"}
                        </span>
                        {msg.isInternal && <span className="text-amber-600">(Note interne)</span>}
                        <span>{timeAgo(msg.timestamp)}</span>
                      </div>
                      <p>{msg.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resolution */}
              {selectedAppeal.resolution && (
                <div className={clsx(
                  "rounded-lg p-4",
                  selectedAppeal.resolution.decision === "overturned" && "bg-green-50 dark:bg-green-900/20",
                  selectedAppeal.resolution.decision === "upheld" && "bg-red-50 dark:bg-red-900/20",
                  selectedAppeal.resolution.decision === "partially_overturned" && "bg-amber-50 dark:bg-amber-900/20"
                )}>
                  <p className="font-medium text-sm mb-2">
                    {selectedAppeal.resolution.decision === "overturned" && "✅ Décision annulée"}
                    {selectedAppeal.resolution.decision === "upheld" && "❌ Décision maintenue"}
                    {selectedAppeal.resolution.decision === "partially_overturned" && "⚠️ Décision partiellement annulée"}
                  </p>
                  <p className="text-sm">{selectedAppeal.resolution.explanation}</p>
                  {selectedAppeal.resolution.actionsTaken.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-neutral-500">Actions prises :</p>
                      <ul className="list-disc list-inside text-sm">
                        {selectedAppeal.resolution.actionsTaken.map((action, i) => (
                          <li key={i}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions footer */}
            {(selectedAppeal.status === "pending" || selectedAppeal.status === "under_review" || selectedAppeal.status === "escalated") && (
              <div className="border-t border-neutral-200 p-4 dark:border-neutral-800">
                {/* Template selector */}
                <div className="flex gap-2 mb-3">
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                  >
                    <option value="">Utiliser un template...</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleApplyTemplate}
                    disabled={!selectedTemplate}
                    className="rounded-lg bg-neutral-100 px-3 py-2 text-sm font-medium disabled:opacity-50 dark:bg-neutral-800"
                  >
                    Appliquer
                  </button>
                </div>

                {/* Response textarea */}
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Répondre à l'utilisateur..."
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                  rows={3}
                />
                <div className="flex justify-between mt-2">
                  <button
                    onClick={handleSendMessage}
                    disabled={!responseText.trim()}
                    className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
                  >
                    Envoyer
                  </button>
                </div>

                {/* Internal note */}
                <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={internalNote}
                      onChange={(e) => setInternalNote(e.target.value)}
                      placeholder="Note interne (non visible par l'utilisateur)..."
                      className="flex-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm dark:border-amber-900 dark:bg-amber-900/20"
                    />
                    <button
                      onClick={handleAddInternalNote}
                      disabled={!internalNote.trim()}
                      className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>

                {/* Decision buttons */}
                <div className="flex justify-between mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowApproveModal(true)}
                      className="rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
                    >
                      ✅ Accepter l'appel
                    </button>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
                    >
                      ❌ Rejeter l'appel
                    </button>
                  </div>
                  {isAdmin && selectedAppeal.status !== "escalated" && (
                    <button
                      onClick={handleEscalate}
                      className="rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-600"
                    >
                      ⬆️ Escalader
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Approve modal */}
      {showApproveModal && selectedAppeal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-neutral-900">
            <h3 className="text-lg font-semibold mb-4">✅ Accepter l'appel</h3>
            <p className="text-sm text-neutral-500 mb-4">
              La décision initiale sera annulée et l'utilisateur sera notifié.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Explication pour l'utilisateur</label>
                <textarea
                  value={approveExplanation}
                  onChange={(e) => setApproveExplanation(e.target.value)}
                  placeholder="Expliquez pourquoi l'appel est accepté..."
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Actions à prendre (une par ligne)</label>
                <textarea
                  value={approveActions}
                  onChange={(e) => setApproveActions(e.target.value)}
                  placeholder="Restaurer le post&#10;Envoyer des excuses..."
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowApproveModal(false)}
                className="flex-1 rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium dark:bg-neutral-800"
              >
                Annuler
              </button>
              <button
                onClick={handleApprove}
                disabled={!approveExplanation.trim()}
                className="flex-1 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {showRejectModal && selectedAppeal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-neutral-900">
            <h3 className="text-lg font-semibold mb-4">❌ Rejeter l'appel</h3>
            <p className="text-sm text-neutral-500 mb-4">
              La décision initiale sera maintenue et l'utilisateur sera notifié.
            </p>
            <div>
              <label className="block text-sm font-medium mb-1">Raison du rejet</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Expliquez pourquoi l'appel est rejeté..."
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                rows={4}
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium dark:bg-neutral-800"
              >
                Annuler
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
              >
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
