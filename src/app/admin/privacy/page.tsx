"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { useAuthStore } from "@/lib/useAuthStore";
import {
  usePrivacyStore,
  PRIVACY_REQUEST_TYPE_LABELS,
  PRIVACY_REQUEST_STATUS_LABELS,
  LEGAL_BASIS_LABELS,
  type PrivacyRequest,
  type PrivacyRequestStatus,
  type ProcessingActivity,
} from "@/lib/usePrivacyStore";
import { timeAgo } from "@/lib/time";

type Tab = "requests" | "register" | "consents" | "anonymized" | "stats";

export default function AdminPrivacyPage() {
  const router = useRouter();
  const { currentUser, isModerator } = useAuthStore();
  const {
    requests,
    processingActivities,
    anonymizedUsers,
    consents,
    processRequest,
    completeRequest,
    rejectRequest,
    addAdminNote,
    addProcessingActivity,
    updateProcessingActivity,
    archiveProcessingActivity,
    getStats,
    getPendingRequests,
    getOverdueRequests,
  } = usePrivacyStore();

  const [activeTab, setActiveTab] = useState<Tab>("requests");
  const [statusFilter, setStatusFilter] = useState<PrivacyRequestStatus | "all">("all");
  const [selectedRequest, setSelectedRequest] = useState<PrivacyRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [showAddActivity, setShowAddActivity] = useState(false);

  // New activity form
  const [newActivity, setNewActivity] = useState({
    name: "",
    description: "",
    controller: "GlobeHub SAS",
    dpo: "dpo@globehub.com",
    dataCategories: "",
    dataSubjects: "",
    purposes: "",
    legalBasis: "consent" as ProcessingActivity["legalBasis"],
    recipients: "",
    retentionPeriod: "",
    securityMeasures: "",
  });

  // Check access
  if (!currentUser || !isModerator) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="text-center">
          <span className="text-6xl">🔒</span>
          <h1 className="mt-4 text-xl font-bold">Accès refusé</h1>
          <p className="mt-2 text-neutral-500">Vous devez être modérateur ou admin.</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 rounded-lg bg-fuchsia-500 px-4 py-2 text-white"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  const stats = getStats();
  const pendingRequests = getPendingRequests();
  const overdueRequests = getOverdueRequests();

  const filteredRequests = useMemo(() => {
    if (statusFilter === "all") return requests;
    return requests.filter(r => r.status === statusFilter);
  }, [requests, statusFilter]);

  const handleProcess = (request: PrivacyRequest) => {
    processRequest(request.id, currentUser.handle);
  };

  const handleComplete = (request: PrivacyRequest) => {
    // Simuler la génération d'un fichier d'export
    if (request.type === "data_export" || request.type === "data_portability") {
      completeRequest(request.id, {
        exportFileUrl: `/api/exports/${request.id}.zip`,
        exportFileSize: Math.floor(Math.random() * 5000000) + 100000,
      });
    } else {
      completeRequest(request.id);
    }
    setSelectedRequest(null);
  };

  const handleReject = (request: PrivacyRequest) => {
    if (!rejectReason.trim()) return;
    rejectRequest(request.id, rejectReason, currentUser.handle);
    setRejectReason("");
    setSelectedRequest(null);
  };

  const handleAddNote = (request: PrivacyRequest) => {
    if (!adminNote.trim()) return;
    addAdminNote(request.id, `[${currentUser.handle}] ${adminNote}`);
    setAdminNote("");
  };

  const handleAddActivity = () => {
    if (!newActivity.name.trim()) return;

    addProcessingActivity({
      name: newActivity.name,
      description: newActivity.description,
      controller: newActivity.controller,
      dpo: newActivity.dpo,
      dataCategories: newActivity.dataCategories.split(",").map(s => s.trim()).filter(Boolean),
      dataSubjects: newActivity.dataSubjects.split(",").map(s => s.trim()).filter(Boolean),
      purposes: newActivity.purposes.split(",").map(s => s.trim()).filter(Boolean),
      legalBasis: newActivity.legalBasis,
      recipients: newActivity.recipients.split(",").map(s => s.trim()).filter(Boolean),
      retentionPeriod: newActivity.retentionPeriod,
      securityMeasures: newActivity.securityMeasures.split(",").map(s => s.trim()).filter(Boolean),
      status: "active",
    });

    setNewActivity({
      name: "",
      description: "",
      controller: "GlobeHub SAS",
      dpo: "dpo@globehub.com",
      dataCategories: "",
      dataSubjects: "",
      purposes: "",
      legalBasis: "consent",
      recipients: "",
      retentionPeriod: "",
      securityMeasures: "",
    });
    setShowAddActivity(false);
  };

  const tabs: { id: Tab; label: string; icon: string; badge?: number }[] = [
    { id: "requests", label: "Demandes RGPD", icon: "📋", badge: pendingRequests.length },
    { id: "register", label: "Registre des traitements", icon: "📑" },
    { id: "consents", label: "Consentements", icon: "✅" },
    { id: "anonymized", label: "Données anonymisées", icon: "👤" },
    { id: "stats", label: "Statistiques", icon: "📊" },
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
                🔐 Centre de Confidentialité RGPD
              </h1>
              <p className="text-sm text-neutral-500">Gestion des données personnelles et conformité</p>
            </div>
          </div>

          {/* Alertes urgentes */}
          {overdueRequests.length > 0 && (
            <div className="flex items-center gap-2 rounded-full bg-red-100 px-4 py-2 text-red-700 animate-pulse dark:bg-red-900/30 dark:text-red-400">
              <span>⚠️</span>
              <span className="font-medium">{overdueRequests.length} demande(s) en retard !</span>
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
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Stats cards (toujours visibles) */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
          <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-neutral-900">
            <p className="text-sm text-neutral-500">Total demandes</p>
            <p className="text-2xl font-bold">{stats.totalRequests}</p>
          </div>
          <div className="rounded-xl bg-amber-50 p-4 shadow-sm dark:bg-amber-900/20">
            <p className="text-sm text-amber-600">En attente</p>
            <p className="text-2xl font-bold text-amber-600">{stats.pendingRequests}</p>
          </div>
          <div className={clsx(
            "rounded-xl p-4 shadow-sm",
            stats.overdueRequests > 0
              ? "bg-red-50 dark:bg-red-900/20"
              : "bg-white dark:bg-neutral-900"
          )}>
            <p className={clsx("text-sm", stats.overdueRequests > 0 ? "text-red-600" : "text-neutral-500")}>
              En retard
            </p>
            <p className={clsx("text-2xl font-bold", stats.overdueRequests > 0 && "text-red-600")}>
              {stats.overdueRequests}
            </p>
          </div>
          <div className="rounded-xl bg-green-50 p-4 shadow-sm dark:bg-green-900/20">
            <p className="text-sm text-green-600">Ce mois</p>
            <p className="text-2xl font-bold text-green-600">{stats.completedThisMonth}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-neutral-900">
            <p className="text-sm text-neutral-500">Temps moyen</p>
            <p className="text-2xl font-bold">{stats.averageProcessingTime}j</p>
          </div>
        </div>

        {/* Tab content */}
        {activeTab === "requests" && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-500">Filtrer :</span>
              {(["all", "pending", "processing", "completed", "rejected"] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={clsx(
                    "rounded-full px-3 py-1 text-sm font-medium transition-colors",
                    statusFilter === status
                      ? "bg-fuchsia-500 text-white"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
                  )}
                >
                  {status === "all" ? "Toutes" : PRIVACY_REQUEST_STATUS_LABELS[status].label}
                </button>
              ))}
            </div>

            {/* Requests list */}
            <div className="space-y-3">
              {filteredRequests.length === 0 ? (
                <div className="rounded-xl bg-white p-12 text-center dark:bg-neutral-900">
                  <span className="text-5xl">✅</span>
                  <p className="mt-4 text-neutral-500">Aucune demande à afficher</p>
                </div>
              ) : (
                filteredRequests.map(request => {
                  const typeInfo = PRIVACY_REQUEST_TYPE_LABELS[request.type];
                  const statusInfo = PRIVACY_REQUEST_STATUS_LABELS[request.status];
                  const isOverdue = request.status !== "completed" && request.status !== "rejected" &&
                    new Date(request.deadline) < new Date();

                  return (
                    <div
                      key={request.id}
                      className={clsx(
                        "rounded-xl bg-white p-4 shadow-sm dark:bg-neutral-900",
                        isOverdue && "ring-2 ring-red-500"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{typeInfo.icon}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{typeInfo.label}</h3>
                              <span className={clsx(
                                "rounded-full px-2 py-0.5 text-xs font-medium",
                                statusInfo.color === "amber" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30",
                                statusInfo.color === "blue" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30",
                                statusInfo.color === "green" && "bg-green-100 text-green-700 dark:bg-green-900/30",
                                statusInfo.color === "red" && "bg-red-100 text-red-700 dark:bg-red-900/30",
                                statusInfo.color === "neutral" && "bg-neutral-100 text-neutral-700 dark:bg-neutral-800"
                              )}>
                                {statusInfo.label}
                              </span>
                              {isOverdue && (
                                <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-medium text-white animate-pulse">
                                  ⚠️ EN RETARD
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-neutral-500">
                              De <strong>@{request.userHandle}</strong> ({request.userEmail})
                            </p>
                            <p className="text-xs text-neutral-400">
                              Créée {timeAgo(request.createdAt)} • Deadline : {new Date(request.deadline).toLocaleDateString("fr-FR")}
                            </p>
                            {request.reason && (
                              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                                Motif : {request.reason}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          {request.status === "pending" && (
                            <button
                              onClick={() => handleProcess(request)}
                              className="rounded-lg bg-blue-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-600"
                            >
                              Traiter
                            </button>
                          )}
                          {request.status === "processing" && (
                            <>
                              <button
                                onClick={() => handleComplete(request)}
                                className="rounded-lg bg-green-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-600"
                              >
                                Terminer
                              </button>
                              <button
                                onClick={() => setSelectedRequest(request)}
                                className="rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600"
                              >
                                Rejeter
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setSelectedRequest(request)}
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
          </div>
        )}

        {activeTab === "register" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Registre des activités de traitement (Article 30 RGPD)</h2>
              <button
                onClick={() => setShowAddActivity(true)}
                className="rounded-lg bg-fuchsia-500 px-4 py-2 text-sm font-medium text-white hover:bg-fuchsia-600"
              >
                + Ajouter une activité
              </button>
            </div>

            <div className="space-y-4">
              {processingActivities.filter(a => a.status === "active").map(activity => (
                <div key={activity.id} className="rounded-xl bg-white p-6 shadow-sm dark:bg-neutral-900">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{activity.name}</h3>
                      <p className="text-sm text-neutral-500">{activity.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => archiveProcessingActivity(activity.id)}
                        className="rounded-lg bg-neutral-100 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800"
                      >
                        Archiver
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-neutral-500">Responsable</p>
                      <p>{activity.controller}</p>
                    </div>
                    <div>
                      <p className="font-medium text-neutral-500">DPO</p>
                      <p>{activity.dpo || "Non défini"}</p>
                    </div>
                    <div>
                      <p className="font-medium text-neutral-500">Base légale</p>
                      <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30">
                        {LEGAL_BASIS_LABELS[activity.legalBasis]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-neutral-500">Conservation</p>
                      <p>{activity.retentionPeriod}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="font-medium text-neutral-500">Catégories de données</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {activity.dataCategories.map((cat, i) => (
                          <span key={i} className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs dark:bg-neutral-800">
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <p className="font-medium text-neutral-500">Finalités</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {activity.purposes.map((purpose, i) => (
                          <span key={i} className="rounded-full bg-fuchsia-100 px-2 py-0.5 text-xs text-fuchsia-700 dark:bg-fuchsia-900/30">
                            {purpose}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <p className="font-medium text-neutral-500">Mesures de sécurité</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {activity.securityMeasures.map((measure, i) => (
                          <span key={i} className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/30">
                            {measure}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 text-xs text-neutral-400">
                    Mis à jour le {new Date(activity.updatedAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "consents" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Historique des consentements</h2>

            {consents.size === 0 ? (
              <div className="rounded-xl bg-white p-12 text-center dark:bg-neutral-900">
                <span className="text-5xl">✅</span>
                <p className="mt-4 text-neutral-500">Aucun consentement enregistré</p>
              </div>
            ) : (
              <div className="space-y-3">
                {Array.from(consents.values()).map(consent => (
                  <div key={consent.userId} className="rounded-xl bg-white p-4 shadow-sm dark:bg-neutral-900">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">@{consent.userHandle}</p>
                        <p className="text-xs text-neutral-500">
                          Dernière mise à jour : {timeAgo(consent.lastUpdatedAt)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {consent.analyticsCookies && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">Analytics</span>}
                        {consent.marketingCookies && <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">Marketing</span>}
                        {consent.locationTracking && <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Localisation</span>}
                        {consent.personalization && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">Personnalisation</span>}
                      </div>
                    </div>

                    {consent.history.length > 0 && (
                      <div className="mt-3 border-t border-neutral-100 pt-3 dark:border-neutral-800">
                        <p className="text-xs font-medium text-neutral-500 mb-2">Historique des modifications :</p>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {consent.history.slice(-5).reverse().map((entry, i) => (
                            <p key={i} className="text-xs text-neutral-500">
                              {new Date(entry.timestamp).toLocaleString("fr-FR")} - {entry.field}: {entry.oldValue ? "✓" : "✗"} → {entry.newValue ? "✓" : "✗"} ({entry.source})
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "anonymized" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Comptes supprimés et anonymisés</h2>
            <p className="text-sm text-neutral-500">
              Ces données agrégées sont conservées à des fins statistiques (sans identification possible).
            </p>

            {anonymizedUsers.length === 0 ? (
              <div className="rounded-xl bg-white p-12 text-center dark:bg-neutral-900">
                <span className="text-5xl">👤</span>
                <p className="mt-4 text-neutral-500">Aucun compte supprimé</p>
              </div>
            ) : (
              <div className="rounded-xl bg-white shadow-sm dark:bg-neutral-900">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100 dark:border-neutral-800">
                      <th className="px-4 py-3 text-left font-medium text-neutral-500">ID anonyme</th>
                      <th className="px-4 py-3 text-left font-medium text-neutral-500">Supprimé le</th>
                      <th className="px-4 py-3 text-left font-medium text-neutral-500">Par</th>
                      <th className="px-4 py-3 text-left font-medium text-neutral-500">Posts</th>
                      <th className="px-4 py-3 text-left font-medium text-neutral-500">Likes</th>
                      <th className="px-4 py-3 text-left font-medium text-neutral-500">Durée compte</th>
                    </tr>
                  </thead>
                  <tbody>
                    {anonymizedUsers.map(user => (
                      <tr key={user.id} className="border-b border-neutral-50 last:border-0 dark:border-neutral-800">
                        <td className="px-4 py-3 font-mono text-xs">{user.id}</td>
                        <td className="px-4 py-3">{new Date(user.deletedAt).toLocaleDateString("fr-FR")}</td>
                        <td className="px-4 py-3">
                          <span className={clsx(
                            "rounded-full px-2 py-0.5 text-xs",
                            user.deletedBy === "user" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                          )}>
                            {user.deletedBy === "user" ? "Utilisateur" : "Admin"}
                          </span>
                        </td>
                        <td className="px-4 py-3">{user.aggregatedStats.totalPosts}</td>
                        <td className="px-4 py-3">{user.aggregatedStats.totalLikes}</td>
                        <td className="px-4 py-3">{user.aggregatedStats.accountAgeInDays} jours</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "stats" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Statistiques RGPD</h2>

            {/* Demandes par type */}
            <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-neutral-900">
              <h3 className="font-semibold mb-4">Répartition par type de demande</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(PRIVACY_REQUEST_TYPE_LABELS).map(([type, info]) => (
                  <div key={type} className="rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{info.icon}</span>
                      <div>
                        <p className="text-2xl font-bold">
                          {stats.requestsByType[type as keyof typeof stats.requestsByType] || 0}
                        </p>
                        <p className="text-xs text-neutral-500">{info.label}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Conformité */}
            <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-neutral-900">
              <h3 className="font-semibold mb-4">Indicateurs de conformité</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className={clsx(
                    "mx-auto h-16 w-16 rounded-full flex items-center justify-center text-2xl font-bold",
                    stats.overdueRequests === 0
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-600"
                  )}>
                    {stats.overdueRequests === 0 ? "✓" : stats.overdueRequests}
                  </div>
                  <p className="mt-2 text-sm text-neutral-500">Demandes en retard</p>
                </div>
                <div className="text-center">
                  <div className="mx-auto h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600">
                    {stats.averageProcessingTime}j
                  </div>
                  <p className="mt-2 text-sm text-neutral-500">Temps moyen</p>
                  <p className="text-xs text-neutral-400">(max légal: 30j)</p>
                </div>
                <div className="text-center">
                  <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center text-2xl font-bold text-green-600">
                    {processingActivities.filter(a => a.status === "active").length}
                  </div>
                  <p className="mt-2 text-sm text-neutral-500">Traitements actifs</p>
                </div>
                <div className="text-center">
                  <div className="mx-auto h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center text-2xl font-bold text-purple-600">
                    {consents.size}
                  </div>
                  <p className="mt-2 text-sm text-neutral-500">Consentements</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal de détails / rejet */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 dark:bg-neutral-900">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Détails de la demande</h3>
              <button onClick={() => setSelectedRequest(null)} className="text-neutral-500 hover:text-neutral-900">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-neutral-500">Type</p>
                  <p>{PRIVACY_REQUEST_TYPE_LABELS[selectedRequest.type].label}</p>
                </div>
                <div>
                  <p className="font-medium text-neutral-500">Statut</p>
                  <p>{PRIVACY_REQUEST_STATUS_LABELS[selectedRequest.status].label}</p>
                </div>
                <div>
                  <p className="font-medium text-neutral-500">Utilisateur</p>
                  <p>@{selectedRequest.userHandle}</p>
                </div>
                <div>
                  <p className="font-medium text-neutral-500">Email</p>
                  <p>{selectedRequest.userEmail}</p>
                </div>
                <div>
                  <p className="font-medium text-neutral-500">Créée le</p>
                  <p>{new Date(selectedRequest.createdAt).toLocaleString("fr-FR")}</p>
                </div>
                <div>
                  <p className="font-medium text-neutral-500">Deadline</p>
                  <p className={new Date(selectedRequest.deadline) < new Date() ? "text-red-600 font-medium" : ""}>
                    {new Date(selectedRequest.deadline).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>

              {selectedRequest.reason && (
                <div>
                  <p className="font-medium text-neutral-500 text-sm">Motif de la demande</p>
                  <p className="text-sm mt-1 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800">{selectedRequest.reason}</p>
                </div>
              )}

              {selectedRequest.adminNotes && (
                <div>
                  <p className="font-medium text-neutral-500 text-sm">Notes admin</p>
                  <p className="text-sm mt-1 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800 whitespace-pre-wrap">{selectedRequest.adminNotes}</p>
                </div>
              )}

              {/* Ajouter une note */}
              <div>
                <p className="font-medium text-neutral-500 text-sm mb-1">Ajouter une note</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Note interne..."
                    className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                  />
                  <button
                    onClick={() => handleAddNote(selectedRequest)}
                    className="rounded-lg bg-neutral-100 px-3 py-2 text-sm font-medium hover:bg-neutral-200 dark:bg-neutral-800"
                  >
                    Ajouter
                  </button>
                </div>
              </div>

              {/* Motif de rejet */}
              {selectedRequest.status === "processing" && (
                <div>
                  <p className="font-medium text-neutral-500 text-sm mb-1">Rejeter la demande</p>
                  <input
                    type="text"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Motif du rejet..."
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                  />
                  <button
                    onClick={() => handleReject(selectedRequest)}
                    disabled={!rejectReason.trim()}
                    className="mt-2 w-full rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
                  >
                    Confirmer le rejet
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal d'ajout d'activité */}
      {showAddActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 dark:bg-neutral-900">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Nouvelle activité de traitement</h3>
              <button onClick={() => setShowAddActivity(false)} className="text-neutral-500 hover:text-neutral-900">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-500 mb-1">Nom *</label>
                <input
                  type="text"
                  value={newActivity.name}
                  onChange={(e) => setNewActivity({ ...newActivity, name: e.target.value })}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
                  placeholder="Ex: Gestion des newsletters"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-500 mb-1">Description</label>
                <textarea
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-500 mb-1">Responsable</label>
                  <input
                    type="text"
                    value={newActivity.controller}
                    onChange={(e) => setNewActivity({ ...newActivity, controller: e.target.value })}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-500 mb-1">DPO</label>
                  <input
                    type="text"
                    value={newActivity.dpo}
                    onChange={(e) => setNewActivity({ ...newActivity, dpo: e.target.value })}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-500 mb-1">Base légale</label>
                <select
                  value={newActivity.legalBasis}
                  onChange={(e) => setNewActivity({ ...newActivity, legalBasis: e.target.value as ProcessingActivity["legalBasis"] })}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
                >
                  {Object.entries(LEGAL_BASIS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-500 mb-1">Catégories de données (séparées par virgule)</label>
                <input
                  type="text"
                  value={newActivity.dataCategories}
                  onChange={(e) => setNewActivity({ ...newActivity, dataCategories: e.target.value })}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
                  placeholder="Identité, Email, Préférences"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-500 mb-1">Finalités (séparées par virgule)</label>
                <input
                  type="text"
                  value={newActivity.purposes}
                  onChange={(e) => setNewActivity({ ...newActivity, purposes: e.target.value })}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
                  placeholder="Marketing, Communication"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-500 mb-1">Durée de conservation</label>
                <input
                  type="text"
                  value={newActivity.retentionPeriod}
                  onChange={(e) => setNewActivity({ ...newActivity, retentionPeriod: e.target.value })}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
                  placeholder="3 ans après la fin du contrat"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-500 mb-1">Mesures de sécurité (séparées par virgule)</label>
                <input
                  type="text"
                  value={newActivity.securityMeasures}
                  onChange={(e) => setNewActivity({ ...newActivity, securityMeasures: e.target.value })}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
                  placeholder="Chiffrement, Backup, Audit"
                />
              </div>

              <button
                onClick={handleAddActivity}
                disabled={!newActivity.name.trim()}
                className="w-full rounded-lg bg-fuchsia-500 px-4 py-2 font-medium text-white hover:bg-fuchsia-600 disabled:opacity-50"
              >
                Créer l'activité
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
