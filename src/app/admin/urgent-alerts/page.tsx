"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { useAuthStore } from "@/lib/useAuthStore";
import {
  useUrgentAlertsStore,
  ALERT_TYPE_LABELS,
  ALERT_STATUS_LABELS,
  SEVERITY_LABELS,
  type UrgentAlert,
  type AlertStatus,
  type AlertSeverity,
} from "@/lib/useUrgentAlertsStore";
import { timeAgo } from "@/lib/time";

export default function UrgentAlertsPage() {
  const router = useRouter();
  const { currentUser, isModerator, isAdmin } = useAuthStore();
  const {
    getActiveAlerts,
    getCriticalAlerts,
    getOverdueAlerts,
    acknowledgeAlert,
    startInvestigation,
    takeAction,
    markFalsePositive,
    escalateToAuthorities,
    preserveEvidence,
    addNote,
    getStats,
  } = useUrgentAlertsStore();

  const [selectedAlert, setSelectedAlert] = useState<UrgentAlert | null>(null);
  const [actionText, setActionText] = useState("");
  const [noteText, setNoteText] = useState("");
  const [falsePositiveReason, setFalsePositiveReason] = useState("");
  const [escalateRef, setEscalateRef] = useState("");
  const [filterSeverity, setFilterSeverity] = useState<AlertSeverity | "all">("all");
  const [filterStatus, setFilterStatus] = useState<AlertStatus | "all">("all");

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
  const activeAlerts = getActiveAlerts();
  const criticalAlerts = getCriticalAlerts();
  const overdueAlerts = getOverdueAlerts();

  const filteredAlerts = useMemo(() => {
    let alerts = activeAlerts;
    if (filterSeverity !== "all") {
      alerts = alerts.filter(a => a.severity === filterSeverity);
    }
    if (filterStatus !== "all") {
      alerts = alerts.filter(a => a.status === filterStatus);
    }
    return alerts.sort((a, b) => {
      // Priorité: overdue > critical > high > medium
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      const severityOrder = { critical: 0, high: 1, medium: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }, [activeAlerts, filterSeverity, filterStatus]);

  const handleAcknowledge = (alert: UrgentAlert) => {
    acknowledgeAlert(alert.id, currentUser.handle);
    preserveEvidence(alert.id);
  };

  const handleStartInvestigation = (alert: UrgentAlert) => {
    startInvestigation(alert.id, currentUser.handle);
  };

  const handleTakeAction = () => {
    if (!selectedAlert || !actionText.trim()) return;
    takeAction(selectedAlert.id, actionText, currentUser.handle);
    setActionText("");
    setSelectedAlert(null);
  };

  const handleMarkFalsePositive = () => {
    if (!selectedAlert || !falsePositiveReason.trim()) return;
    markFalsePositive(selectedAlert.id, falsePositiveReason, currentUser.handle);
    setFalsePositiveReason("");
    setSelectedAlert(null);
  };

  const handleEscalate = () => {
    if (!selectedAlert || !escalateRef.trim()) return;
    escalateToAuthorities(selectedAlert.id, escalateRef, currentUser.handle);
    setEscalateRef("");
    setSelectedAlert(null);
  };

  const handleAddNote = () => {
    if (!selectedAlert || !noteText.trim()) return;
    addNote(selectedAlert.id, noteText, currentUser.handle, true);
    setNoteText("");
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header avec alerte critique */}
      <header className={clsx(
        "sticky top-0 z-40 border-b backdrop-blur-xl",
        criticalAlerts.length > 0
          ? "border-red-500 bg-red-50/80 dark:bg-red-950/80"
          : "border-neutral-200 bg-white/80 dark:border-neutral-800 dark:bg-neutral-900/80"
      )}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/admin")} className="text-neutral-500 hover:text-neutral-900">
              ← Retour
            </button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                🚨 Alertes Urgentes
                {criticalAlerts.length > 0 && (
                  <span className="rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white animate-pulse">
                    {criticalAlerts.length} CRITIQUE{criticalAlerts.length > 1 ? "S" : ""}
                  </span>
                )}
              </h1>
              <p className="text-sm text-neutral-500">Contenu nécessitant une action immédiate</p>
            </div>
          </div>

          {/* SLA Warning */}
          {overdueAlerts.length > 0 && (
            <div className="flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-white animate-pulse">
              <span>⏰</span>
              <span className="font-bold">{overdueAlerts.length} SLA dépassé{overdueAlerts.length > 1 ? "s" : ""} !</span>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Stats urgentes */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
          <div className={clsx(
            "rounded-xl p-4 shadow-sm",
            stats.critical > 0 ? "bg-red-500 text-white" : "bg-white dark:bg-neutral-900"
          )}>
            <p className={clsx("text-sm", stats.critical > 0 ? "text-red-100" : "text-neutral-500")}>Critiques</p>
            <p className="text-3xl font-bold">{stats.critical}</p>
          </div>
          <div className={clsx(
            "rounded-xl p-4 shadow-sm",
            stats.overdue > 0 ? "bg-amber-500 text-white" : "bg-white dark:bg-neutral-900"
          )}>
            <p className={clsx("text-sm", stats.overdue > 0 ? "text-amber-100" : "text-neutral-500")}>En retard</p>
            <p className="text-3xl font-bold">{stats.overdue}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-neutral-900">
            <p className="text-sm text-neutral-500">Actives</p>
            <p className="text-3xl font-bold">{activeAlerts.length}</p>
          </div>
          <div className="rounded-xl bg-green-50 p-4 shadow-sm dark:bg-green-900/20">
            <p className="text-sm text-green-600">Traitées aujourd'hui</p>
            <p className="text-3xl font-bold text-green-600">{stats.actionedToday}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-neutral-900">
            <p className="text-sm text-neutral-500">Temps moyen</p>
            <p className="text-3xl font-bold">{stats.averageResponseTime}min</p>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-500">Sévérité:</span>
            {(["all", "critical", "high", "medium"] as const).map(sev => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={clsx(
                  "rounded-full px-3 py-1 text-sm font-medium",
                  filterSeverity === sev
                    ? sev === "critical" ? "bg-red-500 text-white"
                    : sev === "high" ? "bg-amber-500 text-white"
                    : sev === "medium" ? "bg-blue-500 text-white"
                    : "bg-fuchsia-500 text-white"
                    : "bg-neutral-100 dark:bg-neutral-800"
                )}
              >
                {sev === "all" ? "Toutes" : SEVERITY_LABELS[sev].label}
              </button>
            ))}
          </div>
        </div>

        {/* Liste des alertes */}
        <div className="space-y-3">
          {filteredAlerts.length === 0 ? (
            <div className="rounded-xl bg-white p-12 text-center dark:bg-neutral-900">
              <span className="text-5xl">✅</span>
              <p className="mt-4 text-xl font-bold text-green-600">Aucune alerte active</p>
              <p className="text-neutral-500">Le système est sécurisé</p>
            </div>
          ) : (
            filteredAlerts.map(alert => {
              const typeInfo = ALERT_TYPE_LABELS[alert.alertType];
              const statusInfo = ALERT_STATUS_LABELS[alert.status];
              const severityInfo = SEVERITY_LABELS[alert.severity];

              return (
                <div
                  key={alert.id}
                  className={clsx(
                    "rounded-xl p-4 shadow-sm transition-all",
                    alert.severity === "critical" && "bg-red-50 ring-2 ring-red-500 dark:bg-red-950",
                    alert.severity === "high" && "bg-amber-50 ring-2 ring-amber-400 dark:bg-amber-950",
                    alert.severity === "medium" && "bg-white dark:bg-neutral-900",
                    alert.isOverdue && "animate-pulse"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{typeInfo.icon}</span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={clsx(
                            "rounded-full px-2 py-0.5 text-xs font-bold text-white",
                            severityInfo.color === "red" && "bg-red-500",
                            severityInfo.color === "amber" && "bg-amber-500",
                            severityInfo.color === "blue" && "bg-blue-500"
                          )}>
                            {severityInfo.label.toUpperCase()}
                          </span>
                          <h3 className="font-bold">{typeInfo.label}</h3>
                          <span className={clsx(
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            statusInfo.color === "red" && "bg-red-100 text-red-700",
                            statusInfo.color === "amber" && "bg-amber-100 text-amber-700",
                            statusInfo.color === "blue" && "bg-blue-100 text-blue-700",
                            statusInfo.color === "green" && "bg-green-100 text-green-700"
                          )}>
                            {statusInfo.label}
                          </span>
                          {alert.isOverdue && (
                            <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                              ⏰ SLA DÉPASSÉ
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-2">
                          Par <strong>@{alert.contentAuthorHandle}</strong> • {alert.contentType}
                        </p>

                        <p className="text-sm mt-2 p-2 rounded bg-neutral-100 dark:bg-neutral-800 line-clamp-2">
                          "{alert.contentText}"
                        </p>

                        {alert.matchedKeywords && alert.matchedKeywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {alert.matchedKeywords.map((kw, i) => (
                              <span key={i} className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700 dark:bg-red-900/30">
                                {kw}
                              </span>
                            ))}
                          </div>
                        )}

                        <p className="text-xs text-neutral-400 mt-2">
                          Détecté {timeAgo(alert.detectedAt)} • Confidence: {alert.confidence}% • SLA: {alert.slaHours}h
                        </p>
                      </div>
                    </div>

                    {/* Actions rapides */}
                    <div className="flex flex-col gap-2">
                      {alert.status === "new" && (
                        <button
                          onClick={() => handleAcknowledge(alert)}
                          className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-bold text-white hover:bg-blue-600"
                        >
                          Prendre en charge
                        </button>
                      )}
                      {alert.status === "acknowledged" && (
                        <button
                          onClick={() => handleStartInvestigation(alert)}
                          className="rounded-lg bg-purple-500 px-4 py-2 text-sm font-bold text-white hover:bg-purple-600"
                        >
                          Investiguer
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedAlert(alert)}
                        className="rounded-lg bg-neutral-200 px-4 py-2 text-sm font-medium dark:bg-neutral-700"
                      >
                        Actions
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Modal d'actions */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 dark:bg-neutral-900">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                {ALERT_TYPE_LABELS[selectedAlert.alertType].icon}
                Actions pour l'alerte
              </h3>
              <button onClick={() => setSelectedAlert(null)} className="text-neutral-500 hover:text-neutral-900">✕</button>
            </div>

            <div className="space-y-4">
              {/* Action principale */}
              <div>
                <label className="block text-sm font-medium mb-1">Action à prendre</label>
                <textarea
                  value={actionText}
                  onChange={(e) => setActionText(e.target.value)}
                  placeholder="Décrivez l'action prise (suppression, avertissement, etc.)..."
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                  rows={3}
                />
                <button
                  onClick={handleTakeAction}
                  disabled={!actionText.trim()}
                  className="mt-2 w-full rounded-lg bg-green-500 px-4 py-2 text-sm font-bold text-white hover:bg-green-600 disabled:opacity-50"
                >
                  ✅ Marquer comme traité
                </button>
              </div>

              {/* Faux positif */}
              <div className="border-t border-neutral-200 pt-4 dark:border-neutral-700">
                <label className="block text-sm font-medium mb-1">Marquer comme faux positif</label>
                <input
                  type="text"
                  value={falsePositiveReason}
                  onChange={(e) => setFalsePositiveReason(e.target.value)}
                  placeholder="Raison du faux positif..."
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                />
                <button
                  onClick={handleMarkFalsePositive}
                  disabled={!falsePositiveReason.trim()}
                  className="mt-2 w-full rounded-lg bg-neutral-500 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-600 disabled:opacity-50"
                >
                  Faux positif
                </button>
              </div>

              {/* Escalade aux autorités */}
              {isAdmin && (
                <div className="border-t border-neutral-200 pt-4 dark:border-neutral-700">
                  <label className="block text-sm font-medium mb-1 text-red-600">🚔 Escalader aux autorités</label>
                  <input
                    type="text"
                    value={escalateRef}
                    onChange={(e) => setEscalateRef(e.target.value)}
                    placeholder="Numéro de référence des autorités..."
                    className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm dark:border-red-700 dark:bg-red-900/20"
                  />
                  <button
                    onClick={handleEscalate}
                    disabled={!escalateRef.trim()}
                    className="mt-2 w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    Transmettre aux autorités
                  </button>
                </div>
              )}

              {/* Note interne */}
              <div className="border-t border-neutral-200 pt-4 dark:border-neutral-700">
                <label className="block text-sm font-medium mb-1">Ajouter une note</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Note interne..."
                    className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={!noteText.trim()}
                    className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
                  >
                    Ajouter
                  </button>
                </div>
              </div>

              {/* Notes existantes */}
              {selectedAlert.notes.length > 0 && (
                <div className="border-t border-neutral-200 pt-4 dark:border-neutral-700">
                  <p className="text-sm font-medium mb-2">Notes ({selectedAlert.notes.length})</p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {selectedAlert.notes.map(note => (
                      <div key={note.id} className="rounded bg-neutral-50 p-2 text-xs dark:bg-neutral-800">
                        <span className="font-medium">@{note.author}</span>
                        {note.isConfidential && <span className="ml-1 text-amber-600">(confidentiel)</span>}
                        <span className="text-neutral-400 ml-2">{timeAgo(note.timestamp)}</span>
                        <p className="mt-1">{note.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
