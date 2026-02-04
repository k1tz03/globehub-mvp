"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { useAuthStore } from "@/lib/useAuthStore";
import {
  useAIModerationStore,
  AI_CATEGORY_LABELS,
  AI_ACTION_LABELS,
  type AICategory,
  type AIClassification,
} from "@/lib/useAIModerationStore";

export default function AIModerationPage() {
  const router = useRouter();
  const { currentUser, isAdmin } = useAuthStore();
  const {
    classifications,
    config,
    classifyContent,
    submitHumanFeedback,
    updateConfig,
    toggleCategory,
    getRecentClassifications,
    getPendingReviews,
    getFalsePositives,
    getFalseNegatives,
    getStats,
    getModelPerformance,
  } = useAIModerationStore();

  const [activeTab, setActiveTab] = useState<"queue" | "history" | "config" | "performance">("queue");
  const [selectedClassification, setSelectedClassification] = useState<AIClassification | null>(null);
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [correctedCategory, setCorrectedCategory] = useState<AICategory>("safe");
  const [testContent, setTestContent] = useState("");

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
  const pendingReviews = getPendingReviews();
  const recentClassifications = getRecentClassifications(50);
  const performance = getModelPerformance();

  const handleTestClassify = () => {
    if (!testContent.trim()) return;
    classifyContent({
      id: `test_${Date.now()}`,
      type: "post",
      text: testContent,
      authorHandle: "test_user",
    });
    setTestContent("");
  };

  const handleApproveClassification = (classification: AIClassification) => {
    submitHumanFeedback(classification.id, {
      correct: true,
      verifierHandle: currentUser.handle,
      notes: feedbackNotes || undefined,
    });
    setSelectedClassification(null);
    setFeedbackNotes("");
  };

  const handleCorrectClassification = (classification: AIClassification) => {
    submitHumanFeedback(classification.id, {
      correct: false,
      actualCategory: correctedCategory,
      verifierHandle: currentUser.handle,
      notes: feedbackNotes || undefined,
    });
    setSelectedClassification(null);
    setFeedbackNotes("");
    setCorrectedCategory("safe");
  };

  const tabs = [
    { id: "queue", label: "File d'attente", count: pendingReviews.length },
    { id: "history", label: "Historique", count: recentClassifications.length },
    { id: "config", label: "Configuration" },
    { id: "performance", label: "Performance" },
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
                🤖 Modération IA
              </h1>
              <p className="text-sm text-neutral-500">Classification automatique et apprentissage supervisé</p>
            </div>
          </div>

          {/* Stats rapides */}
          <div className="flex items-center gap-4 text-sm">
            <div className="text-center">
              <p className="text-neutral-500">Classifiés</p>
              <p className="text-xl font-bold">{stats.totalClassified}</p>
            </div>
            <div className="text-center">
              <p className="text-neutral-500">Précision</p>
              <p className="text-xl font-bold text-green-600">{stats.accuracy}%</p>
            </div>
            <div className="text-center">
              <p className="text-neutral-500">En attente</p>
              <p className="text-xl font-bold text-amber-600">{pendingReviews.length}</p>
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
                  <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-xs dark:bg-neutral-800">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Test de classification */}
        <div className="mb-6 rounded-xl bg-white p-4 shadow-sm dark:bg-neutral-900">
          <h3 className="text-sm font-medium text-neutral-500 mb-2">Tester la classification</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={testContent}
              onChange={(e) => setTestContent(e.target.value)}
              placeholder="Entrez un texte à classifier..."
              className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
            />
            <button
              onClick={handleTestClassify}
              className="rounded-lg bg-fuchsia-500 px-4 py-2 font-medium text-white hover:bg-fuchsia-600"
            >
              Classifier
            </button>
          </div>
        </div>

        {/* Queue Tab */}
        {activeTab === "queue" && (
          <div className="space-y-4">
            {pendingReviews.length === 0 ? (
              <div className="rounded-xl bg-white p-12 text-center dark:bg-neutral-900">
                <span className="text-5xl">✅</span>
                <p className="mt-4 text-neutral-500">Aucune classification en attente de révision</p>
              </div>
            ) : (
              pendingReviews.map(classification => (
                <ClassificationCard
                  key={classification.id}
                  classification={classification}
                  onReview={() => setSelectedClassification(classification)}
                />
              ))
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="space-y-4">
            {recentClassifications.length === 0 ? (
              <div className="rounded-xl bg-white p-12 text-center dark:bg-neutral-900">
                <span className="text-5xl">📋</span>
                <p className="mt-4 text-neutral-500">Aucune classification récente</p>
              </div>
            ) : (
              recentClassifications.map(classification => (
                <ClassificationCard
                  key={classification.id}
                  classification={classification}
                  onReview={() => setSelectedClassification(classification)}
                  showVerdict
                />
              ))
            )}
          </div>
        )}

        {/* Config Tab */}
        {activeTab === "config" && (
          <div className="space-y-6">
            {/* Paramètres généraux */}
            <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-neutral-900">
              <h3 className="text-lg font-semibold mb-4">Paramètres généraux</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Modération IA activée</p>
                    <p className="text-sm text-neutral-500">Active la classification automatique des contenus</p>
                  </div>
                  <button
                    onClick={() => updateConfig({ enabled: !config.enabled })}
                    className={clsx(
                      "w-12 h-6 rounded-full transition-colors",
                      config.enabled ? "bg-green-500" : "bg-neutral-300"
                    )}
                  >
                    <span className={clsx(
                      "block w-5 h-5 rounded-full bg-white shadow transition-transform",
                      config.enabled ? "translate-x-6" : "translate-x-0.5"
                    )} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Révision humaine obligatoire</p>
                    <p className="text-sm text-neutral-500">Désactive les actions automatiques</p>
                  </div>
                  <button
                    onClick={() => updateConfig({ requireHumanReview: !config.requireHumanReview })}
                    className={clsx(
                      "w-12 h-6 rounded-full transition-colors",
                      config.requireHumanReview ? "bg-green-500" : "bg-neutral-300"
                    )}
                  >
                    <span className={clsx(
                      "block w-5 h-5 rounded-full bg-white shadow transition-transform",
                      config.requireHumanReview ? "translate-x-6" : "translate-x-0.5"
                    )} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Apprentissage actif</p>
                    <p className="text-sm text-neutral-500">Le modèle apprend des corrections humaines</p>
                  </div>
                  <button
                    onClick={() => updateConfig({ learningEnabled: !config.learningEnabled })}
                    className={clsx(
                      "w-12 h-6 rounded-full transition-colors",
                      config.learningEnabled ? "bg-green-500" : "bg-neutral-300"
                    )}
                  >
                    <span className={clsx(
                      "block w-5 h-5 rounded-full bg-white shadow transition-transform",
                      config.learningEnabled ? "translate-x-6" : "translate-x-0.5"
                    )} />
                  </button>
                </div>

                <div>
                  <label className="block font-medium mb-1">Seuil d'action automatique</label>
                  <p className="text-sm text-neutral-500 mb-2">
                    Confiance minimale pour déclencher une action sans révision ({config.autoActionThreshold}%)
                  </p>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={config.autoActionThreshold}
                    onChange={(e) => updateConfig({ autoActionThreshold: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">Seuil de toxicité</label>
                  <p className="text-sm text-neutral-500 mb-2">
                    Score à partir duquel le contenu est considéré toxique ({config.toxicityThreshold}%)
                  </p>
                  <input
                    type="range"
                    min="30"
                    max="100"
                    value={config.toxicityThreshold}
                    onChange={(e) => updateConfig({ toxicityThreshold: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Catégories */}
            <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-neutral-900">
              <h3 className="text-lg font-semibold mb-4">Catégories de détection</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {(Object.keys(AI_CATEGORY_LABELS) as AICategory[])
                  .filter(cat => cat !== "safe")
                  .map(category => {
                    const info = AI_CATEGORY_LABELS[category];
                    const enabled = config.categoriesEnabled.includes(category);
                    return (
                      <button
                        key={category}
                        onClick={() => toggleCategory(category, !enabled)}
                        className={clsx(
                          "rounded-lg p-3 text-left transition-colors",
                          enabled
                            ? "bg-fuchsia-50 border-2 border-fuchsia-500 dark:bg-fuchsia-900/20"
                            : "bg-neutral-50 border-2 border-transparent dark:bg-neutral-800"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span>{info.icon}</span>
                          <span className="font-medium">{info.label}</span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">{info.description}</p>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === "performance" && (
          <div className="space-y-6">
            {/* Stats globales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total classifié" value={stats.totalClassified} />
              <StatCard label="Signalés" value={stats.flaggedCount} />
              <StatCard label="Actions auto" value={stats.autoActioned} />
              <StatCard label="Vérifiés" value={stats.humanVerified} />
              <StatCard label="Précision" value={`${stats.accuracy}%`} color="green" />
              <StatCard label="Confiance moy." value={`${stats.avgConfidence}%`} />
              <StatCard label="Faux positifs" value={`${stats.falsePositiveRate}%`} color={stats.falsePositiveRate > 10 ? "red" : undefined} />
              <StatCard label="Faux négatifs" value={`${stats.falseNegativeRate}%`} color={stats.falseNegativeRate > 10 ? "red" : undefined} />
            </div>

            {/* Par catégorie */}
            <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-neutral-900">
              <h3 className="text-lg font-semibold mb-4">Détections par catégorie</h3>
              <div className="space-y-3">
                {(Object.entries(stats.byCategory) as [AICategory, number][])
                  .filter(([cat]) => cat !== "safe")
                  .sort((a, b) => b[1] - a[1])
                  .map(([category, count]) => {
                    const info = AI_CATEGORY_LABELS[category];
                    const percent = stats.totalClassified > 0 ? Math.round((count / stats.totalClassified) * 100) : 0;
                    return (
                      <div key={category} className="flex items-center gap-3">
                        <span className="w-8">{info.icon}</span>
                        <span className="w-32 font-medium">{info.label}</span>
                        <div className="flex-1 h-4 bg-neutral-100 rounded-full overflow-hidden dark:bg-neutral-800">
                          <div
                            className="h-full bg-fuchsia-500 rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="w-16 text-right text-sm text-neutral-500">{count}</span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Métriques du modèle */}
            <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-neutral-900">
              <h3 className="text-lg font-semibold mb-4">Performance du modèle par catégorie</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b dark:border-neutral-700">
                      <th className="text-left py-2 px-3">Catégorie</th>
                      <th className="text-right py-2 px-3">Précision</th>
                      <th className="text-right py-2 px-3">Rappel</th>
                      <th className="text-right py-2 px-3">F1 Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Object.keys(performance.precision) as AICategory[]).map(category => (
                      <tr key={category} className="border-b dark:border-neutral-800">
                        <td className="py-2 px-3 flex items-center gap-2">
                          <span>{AI_CATEGORY_LABELS[category]?.icon}</span>
                          {AI_CATEGORY_LABELS[category]?.label || category}
                        </td>
                        <td className="text-right py-2 px-3">{performance.precision[category].toFixed(1)}%</td>
                        <td className="text-right py-2 px-3">{performance.recall[category].toFixed(1)}%</td>
                        <td className="text-right py-2 px-3 font-medium">{performance.f1Score[category].toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Faux positifs / négatifs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-neutral-900">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="text-amber-500">⚠️</span> Faux positifs récents
                </h3>
                {getFalsePositives().length === 0 ? (
                  <p className="text-neutral-500 text-sm">Aucun faux positif détecté</p>
                ) : (
                  <div className="space-y-2">
                    {getFalsePositives().slice(0, 5).map(fp => (
                      <div key={fp.id} className="text-sm p-2 bg-amber-50 rounded dark:bg-amber-900/20">
                        <p className="text-neutral-700 dark:text-neutral-300 line-clamp-2">{fp.contentText}</p>
                        <p className="text-xs text-neutral-500 mt-1">
                          Classé: {AI_CATEGORY_LABELS[fp.primaryCategory].label} → Correct: {AI_CATEGORY_LABELS["safe"].label}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-neutral-900">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="text-red-500">❌</span> Faux négatifs récents
                </h3>
                {getFalseNegatives().length === 0 ? (
                  <p className="text-neutral-500 text-sm">Aucun faux négatif détecté</p>
                ) : (
                  <div className="space-y-2">
                    {getFalseNegatives().slice(0, 5).map(fn => (
                      <div key={fn.id} className="text-sm p-2 bg-red-50 rounded dark:bg-red-900/20">
                        <p className="text-neutral-700 dark:text-neutral-300 line-clamp-2">{fn.contentText}</p>
                        <p className="text-xs text-neutral-500 mt-1">
                          Classé: {AI_CATEGORY_LABELS["safe"].label} → Correct: {fn.humanVerdict?.actualCategory ? AI_CATEGORY_LABELS[fn.humanVerdict.actualCategory].label : "?"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal de révision */}
      {selectedClassification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 dark:bg-neutral-900">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Réviser la classification</h2>
              <button onClick={() => setSelectedClassification(null)} className="text-neutral-500 hover:text-neutral-900">✕</button>
            </div>

            {/* Contenu */}
            <div className="mb-4 p-4 bg-neutral-50 rounded-lg dark:bg-neutral-800">
              <p className="text-sm text-neutral-500 mb-1">Contenu analysé :</p>
              <p className="font-medium">{selectedClassification.contentText}</p>
              <p className="text-xs text-neutral-400 mt-2">
                Par @{selectedClassification.contentAuthorHandle} • {selectedClassification.contentType}
              </p>
            </div>

            {/* Classification IA */}
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div className="p-3 bg-neutral-50 rounded-lg dark:bg-neutral-800">
                <p className="text-sm text-neutral-500">Catégorie détectée</p>
                <p className="font-bold flex items-center gap-2">
                  {AI_CATEGORY_LABELS[selectedClassification.primaryCategory].icon}
                  {AI_CATEGORY_LABELS[selectedClassification.primaryCategory].label}
                </p>
              </div>
              <div className="p-3 bg-neutral-50 rounded-lg dark:bg-neutral-800">
                <p className="text-sm text-neutral-500">Confiance</p>
                <p className="font-bold">{selectedClassification.confidence}%</p>
              </div>
              <div className="p-3 bg-neutral-50 rounded-lg dark:bg-neutral-800">
                <p className="text-sm text-neutral-500">Toxicité</p>
                <p className={clsx(
                  "font-bold",
                  selectedClassification.isToxic ? "text-red-600" : "text-green-600"
                )}>
                  {selectedClassification.toxicityScore}%
                </p>
              </div>
              <div className="p-3 bg-neutral-50 rounded-lg dark:bg-neutral-800">
                <p className="text-sm text-neutral-500">Action recommandée</p>
                <p className="font-bold" style={{ color: AI_ACTION_LABELS[selectedClassification.recommendedAction].color }}>
                  {AI_ACTION_LABELS[selectedClassification.recommendedAction].label}
                </p>
              </div>
            </div>

            {/* Phrases signalées */}
            {selectedClassification.flaggedPhrases.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-neutral-500 mb-2">Éléments détectés :</p>
                <div className="flex flex-wrap gap-2">
                  {selectedClassification.flaggedPhrases.map((phrase, i) => (
                    <span key={i} className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm dark:bg-red-900/20 dark:text-red-400">
                      "{phrase.text}" ({AI_CATEGORY_LABELS[phrase.category].label})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tous les scores */}
            <div className="mb-4">
              <p className="text-sm text-neutral-500 mb-2">Scores par catégorie :</p>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(selectedClassification.allScores) as [AICategory, number][])
                  .filter(([_, score]) => score > 0)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, score]) => (
                    <span key={cat} className="px-2 py-1 bg-neutral-100 rounded text-sm dark:bg-neutral-800">
                      {AI_CATEGORY_LABELS[cat].icon} {score}%
                    </span>
                  ))}
              </div>
            </div>

            {/* Feedback */}
            {!selectedClassification.humanVerified && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Catégorie corrigée (si erreur)</label>
                  <select
                    value={correctedCategory}
                    onChange={(e) => setCorrectedCategory(e.target.value as AICategory)}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
                  >
                    {(Object.keys(AI_CATEGORY_LABELS) as AICategory[]).map(cat => (
                      <option key={cat} value={cat}>
                        {AI_CATEGORY_LABELS[cat].icon} {AI_CATEGORY_LABELS[cat].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Notes (optionnel)</label>
                  <textarea
                    value={feedbackNotes}
                    onChange={(e) => setFeedbackNotes(e.target.value)}
                    placeholder="Remarques sur cette classification..."
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproveClassification(selectedClassification)}
                    className="flex-1 rounded-lg bg-green-500 px-4 py-2 font-medium text-white hover:bg-green-600"
                  >
                    ✓ Approuver
                  </button>
                  <button
                    onClick={() => handleCorrectClassification(selectedClassification)}
                    className="flex-1 rounded-lg bg-amber-500 px-4 py-2 font-medium text-white hover:bg-amber-600"
                  >
                    ✎ Corriger
                  </button>
                </div>
              </>
            )}

            {selectedClassification.humanVerified && selectedClassification.humanVerdict && (
              <div className={clsx(
                "p-4 rounded-lg",
                selectedClassification.humanVerdict.correct
                  ? "bg-green-50 dark:bg-green-900/20"
                  : "bg-amber-50 dark:bg-amber-900/20"
              )}>
                <p className="font-medium">
                  {selectedClassification.humanVerdict.correct ? "✓ Classification approuvée" : "✎ Classification corrigée"}
                </p>
                {!selectedClassification.humanVerdict.correct && selectedClassification.humanVerdict.actualCategory && (
                  <p className="text-sm">
                    Catégorie corrigée : {AI_CATEGORY_LABELS[selectedClassification.humanVerdict.actualCategory].label}
                  </p>
                )}
                <p className="text-sm text-neutral-500 mt-1">
                  Par @{selectedClassification.humanVerdict.verifiedBy} le{" "}
                  {new Date(selectedClassification.humanVerdict.verifiedAt).toLocaleString("fr-FR")}
                </p>
                {selectedClassification.humanVerdict.notes && (
                  <p className="text-sm mt-2 italic">"{selectedClassification.humanVerdict.notes}"</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ClassificationCard({
  classification,
  onReview,
  showVerdict = false,
}: {
  classification: AIClassification;
  onReview: () => void;
  showVerdict?: boolean;
}) {
  const categoryInfo = AI_CATEGORY_LABELS[classification.primaryCategory];
  const actionInfo = AI_ACTION_LABELS[classification.recommendedAction];

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-neutral-900">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="line-clamp-2">{classification.contentText}</p>
          <p className="text-sm text-neutral-500 mt-1">
            @{classification.contentAuthorHandle} • {classification.contentType}
          </p>
        </div>

        <div className="flex items-center gap-3 ml-4">
          {/* Catégorie */}
          <div className={clsx(
            "px-3 py-1 rounded-full text-sm font-medium",
            classification.primaryCategory === "safe"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          )}>
            {categoryInfo.icon} {categoryInfo.label}
          </div>

          {/* Confiance */}
          <div className="text-center">
            <p className="text-xs text-neutral-500">Confiance</p>
            <p className="font-bold">{classification.confidence}%</p>
          </div>

          {/* Action */}
          <div className={clsx(
            "px-2 py-1 rounded text-xs font-medium",
            actionInfo.color === "green" && "bg-green-100 text-green-700",
            actionInfo.color === "amber" && "bg-amber-100 text-amber-700",
            actionInfo.color === "orange" && "bg-orange-100 text-orange-700",
            actionInfo.color === "red" && "bg-red-100 text-red-700",
            actionInfo.color === "purple" && "bg-purple-100 text-purple-700"
          )}>
            {actionInfo.label}
          </div>

          {/* Statut vérification */}
          {showVerdict && classification.humanVerified && (
            <span className={clsx(
              "px-2 py-1 rounded text-xs",
              classification.humanVerdict?.correct
                ? "bg-green-100 text-green-700"
                : "bg-amber-100 text-amber-700"
            )}>
              {classification.humanVerdict?.correct ? "✓" : "✎"}
            </span>
          )}

          <button
            onClick={onReview}
            className="rounded-lg bg-neutral-100 px-3 py-1.5 text-sm font-medium hover:bg-neutral-200 dark:bg-neutral-800"
          >
            Voir
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number | string; color?: "green" | "red" | "amber" }) {
  return (
    <div className={clsx(
      "rounded-xl p-4 shadow-sm",
      color === "green" && "bg-green-50 dark:bg-green-900/20",
      color === "red" && "bg-red-50 dark:bg-red-900/20",
      color === "amber" && "bg-amber-50 dark:bg-amber-900/20",
      !color && "bg-white dark:bg-neutral-900"
    )}>
      <p className="text-sm text-neutral-500">{label}</p>
      <p className={clsx(
        "text-2xl font-bold",
        color === "green" && "text-green-600",
        color === "red" && "text-red-600",
        color === "amber" && "text-amber-600"
      )}>{value}</p>
    </div>
  );
}
