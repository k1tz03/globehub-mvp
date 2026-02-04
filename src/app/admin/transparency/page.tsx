"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { useAuthStore } from "@/lib/useAuthStore";
import { useTransparencyStore, REPORT_CATEGORY_LABELS, type TransparencyReport } from "@/lib/useTransparencyStore";

export default function TransparencyPage() {
  const router = useRouter();
  const { currentUser, isAdmin } = useAuthStore();
  const {
    reports,
    generateReport,
    publishReport,
    archiveReport,
    exportReportAsJSON,
    exportReportAsCSV,
    getPublishedReports,
    getLatestReport,
  } = useTransparencyStore();

  const [selectedReport, setSelectedReport] = useState<TransparencyReport | null>(null);
  const [generatingPeriod, setGeneratingPeriod] = useState<"monthly" | "quarterly" | "annual">("monthly");
  const [generatingStartDate, setGeneratingStartDate] = useState(
    new Date().toISOString().slice(0, 7) + "-01"
  );

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

  const publishedReports = getPublishedReports();
  const latestReport = getLatestReport();

  const handleGenerate = () => {
    generateReport(generatingPeriod, generatingStartDate, currentUser.handle);
  };

  const handlePublish = (reportId: string) => {
    publishReport(reportId);
  };

  const handleExportJSON = (reportId: string) => {
    const json = exportReportAsJSON(reportId);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transparency_${reportId}.json`;
    a.click();
  };

  const handleExportCSV = (reportId: string) => {
    const csv = exportReportAsCSV(reportId);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transparency_${reportId}.csv`;
    a.click();
  };

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
                📋 Rapports de Transparence
              </h1>
              <p className="text-sm text-neutral-500">Conformité DSA - Publication des données de modération</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Génération de rapport */}
        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm dark:bg-neutral-900">
          <h2 className="text-lg font-semibold mb-4">Générer un nouveau rapport</h2>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-neutral-500 mb-1">Période</label>
              <select
                value={generatingPeriod}
                onChange={(e) => setGeneratingPeriod(e.target.value as "monthly" | "quarterly" | "annual")}
                className="rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
              >
                <option value="monthly">Mensuel</option>
                <option value="quarterly">Trimestriel</option>
                <option value="annual">Annuel</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-500 mb-1">Date de début</label>
              <input
                type="date"
                value={generatingStartDate}
                onChange={(e) => setGeneratingStartDate(e.target.value)}
                className="rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
              />
            </div>
            <button
              onClick={handleGenerate}
              className="rounded-lg bg-fuchsia-500 px-6 py-2 font-medium text-white hover:bg-fuchsia-600"
            >
              Générer
            </button>
          </div>
        </div>

        {/* Liste des rapports */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Rapports générés</h2>

          {reports.length === 0 ? (
            <div className="rounded-xl bg-white p-12 text-center dark:bg-neutral-900">
              <span className="text-5xl">📋</span>
              <p className="mt-4 text-neutral-500">Aucun rapport généré</p>
            </div>
          ) : (
            reports.map(report => (
              <div
                key={report.id}
                className="rounded-xl bg-white p-6 shadow-sm dark:bg-neutral-900"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">
                        Rapport {report.period.type === "monthly" ? "mensuel" : report.period.type === "quarterly" ? "trimestriel" : "annuel"}
                      </h3>
                      <span className={clsx(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        report.status === "draft" && "bg-amber-100 text-amber-700",
                        report.status === "published" && "bg-green-100 text-green-700",
                        report.status === "archived" && "bg-neutral-100 text-neutral-700"
                      )}>
                        {report.status === "draft" ? "Brouillon" : report.status === "published" ? "Publié" : "Archivé"}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-500">
                      Du {new Date(report.period.start).toLocaleDateString("fr-FR")} au {new Date(report.period.end).toLocaleDateString("fr-FR")}
                    </p>
                    <p className="text-xs text-neutral-400">
                      Généré le {new Date(report.generatedAt).toLocaleString("fr-FR")} par @{report.generatedBy}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="rounded-lg bg-neutral-100 px-3 py-1.5 text-sm font-medium hover:bg-neutral-200 dark:bg-neutral-800"
                    >
                      Voir
                    </button>
                    <button
                      onClick={() => handleExportJSON(report.id)}
                      className="rounded-lg bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-200"
                    >
                      JSON
                    </button>
                    <button
                      onClick={() => handleExportCSV(report.id)}
                      className="rounded-lg bg-green-100 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-200"
                    >
                      CSV
                    </button>
                    {report.status === "draft" && (
                      <button
                        onClick={() => handlePublish(report.id)}
                        className="rounded-lg bg-fuchsia-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-fuchsia-600"
                      >
                        Publier
                      </button>
                    )}
                  </div>
                </div>

                {/* Aperçu des stats */}
                <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
                  <div className="rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800">
                    <p className="text-neutral-500">Signalements</p>
                    <p className="text-xl font-bold">{report.moderation.totalReports}</p>
                  </div>
                  <div className="rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800">
                    <p className="text-neutral-500">Contenus supprimés</p>
                    <p className="text-xl font-bold">{report.moderation.actionsCount.contentRemoved}</p>
                  </div>
                  <div className="rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800">
                    <p className="text-neutral-500">Appels</p>
                    <p className="text-xl font-bold">{report.appeals.totalAppeals}</p>
                  </div>
                  <div className="rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800">
                    <p className="text-neutral-500">Demandes RGPD</p>
                    <p className="text-xl font-bold">{report.privacy.dataExportRequests + report.privacy.dataDeletionRequests}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Modal de détails du rapport */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="w-full max-w-4xl my-8 max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 dark:bg-neutral-900">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                Rapport de transparence - {new Date(selectedReport.period.start).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
              </h2>
              <button onClick={() => setSelectedReport(null)} className="text-neutral-500 hover:text-neutral-900">✕</button>
            </div>

            <div className="space-y-6">
              {/* Section Modération */}
              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">🛡️ Modération</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Total signalements" value={selectedReport.moderation.totalReports} />
                  <StatCard label="Contenu supprimé" value={selectedReport.moderation.actionsCount.contentRemoved} />
                  <StatCard label="Contenu masqué" value={selectedReport.moderation.actionsCount.contentHidden} />
                  <StatCard label="Comptes suspendus" value={selectedReport.moderation.actionsCount.accountsSuspended} />
                  <StatCard label="Comptes bannis" value={selectedReport.moderation.actionsCount.accountsBanned} />
                  <StatCard label="Avertissements" value={selectedReport.moderation.actionsCount.warningsIssued} />
                  <StatCard label="Actions auto" value={selectedReport.moderation.automatedActions} />
                  <StatCard label="Actions manuelles" value={selectedReport.moderation.manualActions} />
                </div>

                <div className="mt-4">
                  <p className="text-sm font-medium text-neutral-500 mb-2">Signalements par catégorie</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(selectedReport.moderation.reportsByCategory).map(([cat, count]) => (
                      <span key={cat} className="rounded-full bg-neutral-100 px-3 py-1 text-sm dark:bg-neutral-800">
                        {REPORT_CATEGORY_LABELS[cat] || cat}: <strong>{count}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              </section>

              {/* Section Appels */}
              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">⚖️ Appels</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Total appels" value={selectedReport.appeals.totalAppeals} />
                  <StatCard label="Résolus" value={selectedReport.appeals.resolved} />
                  <StatCard label="Approuvés" value={selectedReport.appeals.approved} color="green" />
                  <StatCard label="Rejetés" value={selectedReport.appeals.rejected} color="red" />
                </div>
                <p className="mt-2 text-sm text-neutral-500">
                  Temps moyen de résolution : <strong>{selectedReport.appeals.averageResolutionTime}h</strong>
                </p>
              </section>

              {/* Section RGPD */}
              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">🔐 RGPD & Confidentialité</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Demandes export" value={selectedReport.privacy.dataExportRequests} />
                  <StatCard label="Demandes suppression" value={selectedReport.privacy.dataDeletionRequests} />
                  <StatCard label="Temps moyen (j)" value={selectedReport.privacy.averageProcessingTime} />
                  <StatCard label="Taux complétion" value={`${selectedReport.privacy.completionRate}%`} color="green" />
                </div>
              </section>

              {/* Section Sécurité */}
              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">🔒 Sécurité</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Incidents" value={selectedReport.security.securityIncidents} color={selectedReport.security.securityIncidents > 0 ? "amber" : undefined} />
                  <StatCard label="Fuites de données" value={selectedReport.security.dataBreaches} color={selectedReport.security.dataBreaches > 0 ? "red" : "green"} />
                  <StatCard label="Comptes compromis" value={selectedReport.security.accountCompromises} />
                  <StatCard label="Tentatives phishing" value={selectedReport.security.phishingAttempts} />
                </div>
              </section>

              {/* Section Demandes légales */}
              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">⚖️ Demandes légales</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Demandes gouvernementales" value={selectedReport.legalRequests.governmentRequests} />
                  <StatCard label="Ordonnances judiciaires" value={selectedReport.legalRequests.courtOrders} />
                  <StatCard label="Contenus retirés (loi)" value={selectedReport.legalRequests.contentRemovedByLaw} />
                  <StatCard label="Comptes désactivés (loi)" value={selectedReport.legalRequests.accountsDisabledByLaw} />
                </div>
                {selectedReport.legalRequests.countriesRequesting.length > 0 && (
                  <p className="mt-2 text-sm text-neutral-500">
                    Pays demandeurs : {selectedReport.legalRequests.countriesRequesting.join(", ")}
                  </p>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number | string; color?: "green" | "red" | "amber" }) {
  return (
    <div className={clsx(
      "rounded-lg p-3",
      color === "green" && "bg-green-50 dark:bg-green-900/20",
      color === "red" && "bg-red-50 dark:bg-red-900/20",
      color === "amber" && "bg-amber-50 dark:bg-amber-900/20",
      !color && "bg-neutral-50 dark:bg-neutral-800"
    )}>
      <p className="text-sm text-neutral-500">{label}</p>
      <p className={clsx(
        "text-xl font-bold",
        color === "green" && "text-green-600",
        color === "red" && "text-red-600",
        color === "amber" && "text-amber-600"
      )}>{value}</p>
    </div>
  );
}
