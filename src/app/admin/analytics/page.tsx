"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { useAuthStore } from "@/lib/useAuthStore";
import {
  useAdvancedAnalyticsStore,
  type FunnelDefinition,
  type UserSegment,
  type ABTest,
} from "@/lib/useAdvancedAnalyticsStore";

export default function AdvancedAnalyticsPage() {
  const router = useRouter();
  const { currentUser, isAdmin } = useAuthStore();
  const {
    funnels,
    funnelsData,
    retentionData,
    segments,
    abTests,
    customEvents,
    metrics,
    getFunnelAnalysis,
    getChurnAnalysis,
    createSegment,
    deleteSegment,
    createABTest,
    startABTest,
    pauseABTest,
    completeABTest,
    deleteABTest,
    exportRetentionData,
    exportFunnelData,
  } = useAdvancedAnalyticsStore();

  const [activeTab, setActiveTab] = useState<"overview" | "retention" | "funnels" | "segments" | "abtests" | "events">("overview");
  const [selectedFunnel, setSelectedFunnel] = useState<string | null>(null);
  const [showCreateSegment, setShowCreateSegment] = useState(false);
  const [showCreateABTest, setShowCreateABTest] = useState(false);

  // Form states
  const [newSegmentName, setNewSegmentName] = useState("");
  const [newSegmentDescription, setNewSegmentDescription] = useState("");
  const [newTestName, setNewTestName] = useState("");
  const [newTestDescription, setNewTestDescription] = useState("");
  const [newTestGoal, setNewTestGoal] = useState("");

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

  const churnAnalysis = getChurnAnalysis();

  const handleExportRetention = (format: "csv" | "json") => {
    const data = exportRetentionData(format);
    const blob = new Blob([data], { type: format === "json" ? "application/json" : "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `retention.${format}`;
    a.click();
  };

  const handleExportFunnel = (funnelId: string, format: "csv" | "json") => {
    const data = exportFunnelData(funnelId, format);
    const blob = new Blob([data], { type: format === "json" ? "application/json" : "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `funnel_${funnelId}.${format}`;
    a.click();
  };

  const handleCreateSegment = () => {
    if (!newSegmentName.trim()) return;
    createSegment({
      name: newSegmentName,
      description: newSegmentDescription,
      conditions: [],
    });
    setNewSegmentName("");
    setNewSegmentDescription("");
    setShowCreateSegment(false);
  };

  const handleCreateABTest = () => {
    if (!newTestName.trim() || !newTestGoal.trim()) return;
    createABTest({
      name: newTestName,
      description: newTestDescription,
      variants: [
        { id: "control", name: "Contrôle", traffic: 50, conversions: 0, visitors: 0 },
        { id: "variant_a", name: "Variante A", traffic: 50, conversions: 0, visitors: 0 },
      ],
      goal: newTestGoal,
    });
    setNewTestName("");
    setNewTestDescription("");
    setNewTestGoal("");
    setShowCreateABTest(false);
  };

  const tabs = [
    { id: "overview", label: "Vue d'ensemble", icon: "📊" },
    { id: "retention", label: "Rétention", icon: "📈" },
    { id: "funnels", label: "Funnels", icon: "🔄" },
    { id: "segments", label: "Segments", icon: "👥" },
    { id: "abtests", label: "A/B Tests", icon: "🧪" },
    { id: "events", label: "Événements", icon: "⚡" },
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
                📊 Analytics Avancés
              </h1>
              <p className="text-sm text-neutral-500">Rétention, cohortes, funnels et A/B testing</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex gap-1 overflow-x-auto border-t border-neutral-100 dark:border-neutral-800">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
                  activeTab === tab.id
                    ? "border-fuchsia-500 text-fuchsia-600"
                    : "border-transparent text-neutral-500 hover:text-neutral-900"
                )}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-4">
              <MetricCard label="DAU" value={metrics.dau} icon="👥" change={8} />
              <MetricCard label="WAU" value={metrics.wau} icon="📅" change={5} />
              <MetricCard label="MAU" value={metrics.mau} icon="📆" change={12} />
              <MetricCard label="Stickiness" value={`${Math.round(metrics.dauMauRatio * 100)}%`} icon="📌" />
            </div>

            {/* Engagement & Growth */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-neutral-900">
                <h3 className="font-semibold mb-4">🎯 Engagement</h3>
                <div className="space-y-4">
                  <MetricRow label="Durée session moyenne" value={`${Math.round(metrics.avgSessionDuration / 60)} min`} />
                  <MetricRow label="Sessions/utilisateur" value={metrics.avgSessionsPerUser.toString()} />
                  <MetricRow label="Actions/session" value={metrics.avgActionsPerSession.toString()} />
                  <MetricRow label="Taux d'engagement" value={`${metrics.contentEngagementRate}%`} />
                </div>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-neutral-900">
                <h3 className="font-semibold mb-4">🚀 Croissance</h3>
                <div className="space-y-4">
                  <MetricRow label="Nouveaux utilisateurs" value={metrics.newUsers.toString()} color="green" />
                  <MetricRow label="Utilisateurs de retour" value={metrics.returningUsers.toString()} />
                  <MetricRow label="Réactivés" value={metrics.reactivatedUsers.toString()} color="blue" />
                  <MetricRow label="Taux de croissance" value={`${metrics.growthRate}%`} color="green" />
                </div>
              </div>
            </div>

            {/* Retention Quick View */}
            <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-neutral-900">
              <h3 className="font-semibold mb-4">📈 Rétention rapide</h3>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center p-4 bg-neutral-50 rounded-lg dark:bg-neutral-800">
                  <p className="text-3xl font-bold text-green-600">{metrics.d1Retention}%</p>
                  <p className="text-sm text-neutral-500">D1 Retention</p>
                </div>
                <div className="text-center p-4 bg-neutral-50 rounded-lg dark:bg-neutral-800">
                  <p className="text-3xl font-bold text-blue-600">{metrics.d7Retention}%</p>
                  <p className="text-sm text-neutral-500">D7 Retention</p>
                </div>
                <div className="text-center p-4 bg-neutral-50 rounded-lg dark:bg-neutral-800">
                  <p className="text-3xl font-bold text-purple-600">{metrics.d30Retention}%</p>
                  <p className="text-sm text-neutral-500">D30 Retention</p>
                </div>
                <div className="text-center p-4 bg-neutral-50 rounded-lg dark:bg-neutral-800">
                  <p className="text-3xl font-bold text-red-600">{metrics.churnRate}%</p>
                  <p className="text-sm text-neutral-500">Churn Rate</p>
                </div>
              </div>
            </div>

            {/* Virality */}
            <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-neutral-900">
              <h3 className="font-semibold mb-4">🔥 Viralité</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 bg-gradient-to-br from-fuchsia-50 to-amber-50 rounded-lg dark:from-fuchsia-900/20 dark:to-amber-900/20">
                  <p className="text-sm text-neutral-500">K-Factor</p>
                  <p className="text-3xl font-bold">{metrics.viralCoefficient}</p>
                  <p className="text-xs text-neutral-500">{metrics.viralCoefficient >= 1 ? "🚀 Croissance virale !" : "Améliorer la viralité"}</p>
                </div>
                <div className="p-4 bg-neutral-50 rounded-lg dark:bg-neutral-800">
                  <p className="text-sm text-neutral-500">Invitations moy./user</p>
                  <p className="text-3xl font-bold">{metrics.avgInvitesSent}</p>
                </div>
                <div className="p-4 bg-neutral-50 rounded-lg dark:bg-neutral-800">
                  <p className="text-sm text-neutral-500">Conversion invitations</p>
                  <p className="text-3xl font-bold">{metrics.inviteConversionRate}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Retention Tab */}
        {activeTab === "retention" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Analyse de rétention par cohorte</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => handleExportRetention("csv")}
                  className="rounded-lg bg-green-100 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-200"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => handleExportRetention("json")}
                  className="rounded-lg bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-200"
                >
                  Export JSON
                </button>
              </div>
            </div>

            {/* Retention Table */}
            <div className="rounded-xl bg-white shadow-sm overflow-hidden dark:bg-neutral-900">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 dark:bg-neutral-800">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">Cohorte</th>
                      <th className="text-right px-4 py-3 font-medium">Taille</th>
                      <th className="text-right px-4 py-3 font-medium">D1</th>
                      <th className="text-right px-4 py-3 font-medium">D7</th>
                      <th className="text-right px-4 py-3 font-medium">D14</th>
                      <th className="text-right px-4 py-3 font-medium">D30</th>
                      <th className="text-right px-4 py-3 font-medium">D60</th>
                      <th className="text-right px-4 py-3 font-medium">D90</th>
                    </tr>
                  </thead>
                  <tbody>
                    {retentionData.map((row, i) => (
                      <tr key={row.period} className={clsx("border-t dark:border-neutral-800", i === 0 && "bg-fuchsia-50/50 dark:bg-fuchsia-900/10")}>
                        <td className="px-4 py-3 font-medium">{row.period}</td>
                        <td className="px-4 py-3 text-right">{row.cohortSize}</td>
                        <td className="px-4 py-3 text-right">
                          <RetentionCell value={row.retention["D1"]} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <RetentionCell value={row.retention["D7"]} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <RetentionCell value={row.retention["D14"]} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <RetentionCell value={row.retention["D30"]} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <RetentionCell value={row.retention["D60"]} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <RetentionCell value={row.retention["D90"]} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Churn Analysis */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-neutral-900">
                <h3 className="font-semibold mb-4">📉 Analyse du churn</h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-red-50 rounded-lg dark:bg-red-900/20">
                    <p className="text-2xl font-bold text-red-600">{churnAnalysis.churned}</p>
                    <p className="text-xs text-neutral-500">Partis</p>
                  </div>
                  <div className="text-center p-3 bg-amber-50 rounded-lg dark:bg-amber-900/20">
                    <p className="text-2xl font-bold text-amber-600">{churnAnalysis.atRisk}</p>
                    <p className="text-xs text-neutral-500">À risque</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg dark:bg-green-900/20">
                    <p className="text-2xl font-bold text-green-600">{churnAnalysis.healthy}</p>
                    <p className="text-xs text-neutral-500">Sains</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-neutral-900">
                <h3 className="font-semibold mb-4">❓ Raisons du churn</h3>
                <div className="space-y-2">
                  {churnAnalysis.churnReasons.map((reason, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-40 text-sm truncate">{reason.reason}</span>
                      <div className="flex-1 h-2 bg-neutral-100 rounded-full dark:bg-neutral-800">
                        <div
                          className="h-full bg-red-500 rounded-full"
                          style={{ width: `${(reason.count / churnAnalysis.churned) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-neutral-500 w-12 text-right">{reason.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Funnels Tab */}
        {activeTab === "funnels" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Entonnoirs de conversion</h2>

            <div className="grid gap-4 md:grid-cols-2">
              {funnels.map(funnel => {
                const data = getFunnelAnalysis(funnel.id);
                return (
                  <FunnelCard
                    key={funnel.id}
                    funnel={funnel}
                    data={data}
                    onSelect={() => setSelectedFunnel(funnel.id)}
                    onExport={(format) => handleExportFunnel(funnel.id, format)}
                  />
                );
              })}
            </div>

            {/* Selected Funnel Detail */}
            {selectedFunnel && (
              <FunnelDetail
                funnel={funnels.find(f => f.id === selectedFunnel)!}
                data={getFunnelAnalysis(selectedFunnel)}
                onClose={() => setSelectedFunnel(null)}
              />
            )}
          </div>
        )}

        {/* Segments Tab */}
        {activeTab === "segments" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Segments d'utilisateurs</h2>
              <button
                onClick={() => setShowCreateSegment(true)}
                className="rounded-lg bg-fuchsia-500 px-4 py-2 font-medium text-white hover:bg-fuchsia-600"
              >
                + Nouveau segment
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {segments.map(segment => (
                <SegmentCard
                  key={segment.id}
                  segment={segment}
                  onDelete={() => deleteSegment(segment.id)}
                />
              ))}
            </div>

            {/* Create Segment Modal */}
            {showCreateSegment && (
              <Modal onClose={() => setShowCreateSegment(false)} title="Nouveau segment">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nom</label>
                    <input
                      type="text"
                      value={newSegmentName}
                      onChange={(e) => setNewSegmentName(e.target.value)}
                      className="w-full rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={newSegmentDescription}
                      onChange={(e) => setNewSegmentDescription(e.target.value)}
                      className="w-full rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
                      rows={2}
                    />
                  </div>
                  <button
                    onClick={handleCreateSegment}
                    disabled={!newSegmentName.trim()}
                    className="w-full rounded-lg bg-fuchsia-500 px-4 py-2 font-medium text-white hover:bg-fuchsia-600 disabled:opacity-50"
                  >
                    Créer
                  </button>
                </div>
              </Modal>
            )}
          </div>
        )}

        {/* A/B Tests Tab */}
        {activeTab === "abtests" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Tests A/B</h2>
              <button
                onClick={() => setShowCreateABTest(true)}
                className="rounded-lg bg-fuchsia-500 px-4 py-2 font-medium text-white hover:bg-fuchsia-600"
              >
                + Nouveau test
              </button>
            </div>

            <div className="space-y-4">
              {abTests.map(test => (
                <ABTestCard
                  key={test.id}
                  test={test}
                  onStart={() => startABTest(test.id)}
                  onPause={() => pauseABTest(test.id)}
                  onComplete={(winnerId) => completeABTest(test.id, winnerId)}
                  onDelete={() => deleteABTest(test.id)}
                />
              ))}
            </div>

            {/* Create A/B Test Modal */}
            {showCreateABTest && (
              <Modal onClose={() => setShowCreateABTest(false)} title="Nouveau test A/B">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nom du test</label>
                    <input
                      type="text"
                      value={newTestName}
                      onChange={(e) => setNewTestName(e.target.value)}
                      className="w-full rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={newTestDescription}
                      onChange={(e) => setNewTestDescription(e.target.value)}
                      className="w-full rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Objectif (événement)</label>
                    <input
                      type="text"
                      value={newTestGoal}
                      onChange={(e) => setNewTestGoal(e.target.value)}
                      placeholder="ex: signup_completed"
                      className="w-full rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
                    />
                  </div>
                  <button
                    onClick={handleCreateABTest}
                    disabled={!newTestName.trim() || !newTestGoal.trim()}
                    className="w-full rounded-lg bg-fuchsia-500 px-4 py-2 font-medium text-white hover:bg-fuchsia-600 disabled:opacity-50"
                  >
                    Créer
                  </button>
                </div>
              </Modal>
            )}
          </div>
        )}

        {/* Events Tab */}
        {activeTab === "events" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Événements trackés</h2>

            <div className="rounded-xl bg-white shadow-sm overflow-hidden dark:bg-neutral-900">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 dark:bg-neutral-800">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Événement</th>
                    <th className="text-left px-4 py-3 font-medium">Catégorie</th>
                    <th className="text-right px-4 py-3 font-medium">Total</th>
                    <th className="text-left px-4 py-3 font-medium">Propriétés</th>
                    <th className="text-left px-4 py-3 font-medium">Dernier vu</th>
                  </tr>
                </thead>
                <tbody>
                  {customEvents.map(event => (
                    <tr key={event.id} className="border-t dark:border-neutral-800">
                      <td className="px-4 py-3 font-mono text-sm">{event.name}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-xs dark:bg-neutral-800">
                          {event.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{event.count.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {event.properties.slice(0, 3).map(prop => (
                            <span key={prop} className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-xs dark:bg-blue-900/20">
                              {prop}
                            </span>
                          ))}
                          {event.properties.length > 3 && (
                            <span className="text-xs text-neutral-500">+{event.properties.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-500 text-xs">
                        {new Date(event.lastSeen).toLocaleString("fr-FR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Components

function MetricCard({ label, value, icon, change }: { label: string; value: string | number; icon: string; change?: number }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-neutral-900">
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        {change !== undefined && (
          <span className={clsx("text-xs font-medium", change >= 0 ? "text-green-600" : "text-red-600")}>
            {change >= 0 ? "+" : ""}{change}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold mt-2">{value}</p>
      <p className="text-sm text-neutral-500">{label}</p>
    </div>
  );
}

function MetricRow({ label, value, color }: { label: string; value: string; color?: "green" | "blue" }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-neutral-500">{label}</span>
      <span className={clsx("font-medium", color === "green" && "text-green-600", color === "blue" && "text-blue-600")}>
        {value}
      </span>
    </div>
  );
}

function RetentionCell({ value }: { value: number }) {
  const getBgColor = (v: number) => {
    if (v >= 60) return "bg-green-500";
    if (v >= 40) return "bg-green-400";
    if (v >= 30) return "bg-amber-400";
    if (v >= 20) return "bg-amber-500";
    return "bg-red-400";
  };

  return (
    <span className={clsx("px-2 py-0.5 rounded text-white text-xs font-medium", getBgColor(value))}>
      {value}%
    </span>
  );
}

function FunnelCard({
  funnel,
  data,
  onSelect,
  onExport,
}: {
  funnel: FunnelDefinition;
  data: ReturnType<typeof useAdvancedAnalyticsStore.getState>["funnelsData"][0] | undefined;
  onSelect: () => void;
  onExport: (format: "csv" | "json") => void;
}) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-neutral-900">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold">{funnel.name}</h3>
          <p className="text-sm text-neutral-500">{funnel.description}</p>
        </div>
        {data && (
          <span className="text-2xl font-bold text-fuchsia-600">{data.overallConversion}%</span>
        )}
      </div>

      {data && (
        <div className="space-y-2 mb-4">
          {data.stepData.map((step, i) => (
            <div key={step.stepId} className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-neutral-200 flex items-center justify-center text-xs dark:bg-neutral-700">
                {i + 1}
              </span>
              <span className="text-sm flex-1 truncate">{step.stepName}</span>
              <div className="w-20 h-2 bg-neutral-100 rounded-full dark:bg-neutral-800">
                <div className="h-full bg-fuchsia-500 rounded-full" style={{ width: `${step.conversionRate}%` }} />
              </div>
              <span className="text-xs text-neutral-500 w-12 text-right">{step.conversionRate}%</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onSelect}
          className="flex-1 rounded-lg bg-neutral-100 px-3 py-1.5 text-sm font-medium hover:bg-neutral-200 dark:bg-neutral-800"
        >
          Détails
        </button>
        <button
          onClick={() => onExport("csv")}
          className="rounded-lg bg-green-100 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-200"
        >
          CSV
        </button>
      </div>
    </div>
  );
}

function FunnelDetail({
  funnel,
  data,
  onClose,
}: {
  funnel: FunnelDefinition;
  data: ReturnType<typeof useAdvancedAnalyticsStore.getState>["funnelsData"][0] | undefined;
  onClose: () => void;
}) {
  if (!data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-6 dark:bg-neutral-900">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold">{funnel.name}</h2>
            <p className="text-neutral-500">{funnel.description}</p>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-900">✕</button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-neutral-50 rounded-lg dark:bg-neutral-800">
            <p className="text-2xl font-bold">{data.totalStarted.toLocaleString()}</p>
            <p className="text-sm text-neutral-500">Entrées</p>
          </div>
          <div className="text-center p-4 bg-neutral-50 rounded-lg dark:bg-neutral-800">
            <p className="text-2xl font-bold">{data.totalCompleted.toLocaleString()}</p>
            <p className="text-sm text-neutral-500">Complétés</p>
          </div>
          <div className="text-center p-4 bg-fuchsia-50 rounded-lg dark:bg-fuchsia-900/20">
            <p className="text-2xl font-bold text-fuchsia-600">{data.overallConversion}%</p>
            <p className="text-sm text-neutral-500">Conversion</p>
          </div>
        </div>

        <div className="space-y-4">
          {data.stepData.map((step, i) => (
            <div key={step.stepId} className="p-4 bg-neutral-50 rounded-lg dark:bg-neutral-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-fuchsia-500 text-white flex items-center justify-center text-sm font-medium">
                    {i + 1}
                  </span>
                  <span className="font-medium">{step.stepName}</span>
                </div>
                <span className="text-lg font-bold">{step.conversionRate}%</span>
              </div>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-neutral-500">Entrés</p>
                  <p className="font-medium">{step.entered.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-neutral-500">Complétés</p>
                  <p className="font-medium text-green-600">{step.completed.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-neutral-500">Abandons</p>
                  <p className="font-medium text-red-600">{step.dropped.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-neutral-500">Temps moy.</p>
                  <p className="font-medium">{Math.round(step.avgTimeToNextSeconds / 60)}min</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SegmentCard({ segment, onDelete }: { segment: UserSegment; onDelete: () => void }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-neutral-900">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold">{segment.name}</h3>
        <button onClick={onDelete} className="text-red-500 hover:text-red-700 text-sm">🗑️</button>
      </div>
      <p className="text-sm text-neutral-500 mb-3">{segment.description}</p>
      <div className="flex justify-between items-center">
        <span className="text-2xl font-bold text-fuchsia-600">{segment.userCount.toLocaleString()}</span>
        <span className="text-xs text-neutral-500">utilisateurs</span>
      </div>
    </div>
  );
}

function ABTestCard({
  test,
  onStart,
  onPause,
  onComplete,
  onDelete,
}: {
  test: ABTest;
  onStart: () => void;
  onPause: () => void;
  onComplete: (winnerId: string) => void;
  onDelete: () => void;
}) {
  const statusColors = {
    draft: "bg-neutral-100 text-neutral-600",
    running: "bg-green-100 text-green-700",
    paused: "bg-amber-100 text-amber-700",
    completed: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-neutral-900">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{test.name}</h3>
            <span className={clsx("px-2 py-0.5 rounded-full text-xs font-medium", statusColors[test.status])}>
              {test.status}
            </span>
          </div>
          <p className="text-sm text-neutral-500">{test.description}</p>
          <p className="text-xs text-neutral-400 mt-1">Objectif: {test.goal}</p>
        </div>
        {test.significance && (
          <div className="text-right">
            <p className="text-xs text-neutral-500">Significativité</p>
            <p className={clsx("font-bold", test.significance >= 95 ? "text-green-600" : "text-amber-600")}>
              {test.significance}%
            </p>
          </div>
        )}
      </div>

      {/* Variants */}
      <div className="space-y-3 mb-4">
        {test.variants.map(variant => {
          const conversionRate = variant.visitors > 0 ? Math.round((variant.conversions / variant.visitors) * 100) : 0;
          const isWinner = test.winner === variant.id;
          return (
            <div key={variant.id} className={clsx("p-3 rounded-lg", isWinner ? "bg-green-50 dark:bg-green-900/20" : "bg-neutral-50 dark:bg-neutral-800")}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{variant.name}</span>
                  {isWinner && <span className="text-green-600">🏆</span>}
                  <span className="text-xs text-neutral-500">{variant.traffic}% trafic</span>
                </div>
                <span className="font-bold">{conversionRate}%</span>
              </div>
              <div className="flex gap-4 mt-1 text-xs text-neutral-500">
                <span>{variant.visitors.toLocaleString()} visiteurs</span>
                <span>{variant.conversions.toLocaleString()} conversions</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {test.status === "draft" && (
          <button onClick={onStart} className="flex-1 rounded-lg bg-green-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-600">
            Démarrer
          </button>
        )}
        {test.status === "running" && (
          <>
            <button onClick={onPause} className="flex-1 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-600">
              Pause
            </button>
            <button
              onClick={() => {
                const best = test.variants.reduce((a, b) =>
                  (a.visitors > 0 ? a.conversions / a.visitors : 0) > (b.visitors > 0 ? b.conversions / b.visitors : 0) ? a : b
                );
                onComplete(best.id);
              }}
              className="flex-1 rounded-lg bg-blue-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-600"
            >
              Terminer
            </button>
          </>
        )}
        {test.status === "paused" && (
          <button onClick={onStart} className="flex-1 rounded-lg bg-green-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-600">
            Reprendre
          </button>
        )}
        <button onClick={onDelete} className="rounded-lg bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-200">
          🗑️
        </button>
      </div>
    </div>
  );
}

function Modal({ children, title, onClose }: { children: React.ReactNode; title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-neutral-900">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-900">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
