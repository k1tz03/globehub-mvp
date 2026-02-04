"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { useAuthStore } from "@/lib/useAuthStore";
import { useStatsStore } from "@/lib/useStatsStore";
import type { BackgroundEvent, BackgroundEventType } from "@/lib/types";
import { BG_EVENT_LABELS } from "@/lib/types";

type EditMode = "list" | "edit" | "create" | "preview";

export default function BackgroundsAdminPage() {
  const router = useRouter();
  const { currentUser, ready: authReady, isAdmin } = useAuthStore();
  const { bgEvents, ready: statsReady, addBgEvent, updateBgEvent, deleteBgEvent } = useStatsStore();

  const [mode, setMode] = useState<EditMode>("list");
  const [selectedEvent, setSelectedEvent] = useState<BackgroundEvent | null>(null);
  const [previewEvent, setPreviewEvent] = useState<BackgroundEvent | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<Partial<BackgroundEvent>>({
    name: "",
    description: "",
    type: "custom",
    isActive: false,
    startDate: "",
    endDate: "",
    priority: 50,
    customCSS: "",
    customJS: "",
    customHTML: "",
    sponsorName: "",
    sponsorLogo: "",
    sponsorUrl: "",
  });

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Active events
  const activeEvents = useMemo(() => bgEvents.filter(e => e.isActive), [bgEvents]);
  const scheduledEvents = useMemo(() => {
    const now = new Date();
    return bgEvents.filter(e => !e.isActive && new Date(e.startDate) > now);
  }, [bgEvents]);

  // Loading
  if (!authReady || !statsReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100 dark:bg-neutral-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-fuchsia-500 border-t-transparent" />
      </div>
    );
  }

  // Access check
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100 dark:bg-neutral-950">
        <div className="rounded-2xl bg-white p-8 text-center shadow-xl dark:bg-neutral-900">
          <div className="text-5xl">🔒</div>
          <h1 className="mt-4 text-xl font-bold">Accès administrateur requis</h1>
          <button onClick={() => router.push("/admin")} className="mt-4 rounded-xl bg-fuchsia-500 px-6 py-3 text-sm font-medium text-white">
            Retour
          </button>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    if (!formData.name || !formData.startDate || !formData.endDate) {
      setToast("⚠️ Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (selectedEvent) {
      // Update existing
      updateBgEvent(selectedEvent.id, formData);
      setToast("✅ Événement mis à jour");
    } else {
      // Create new
      addBgEvent({
        ...formData,
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.handle,
      } as Omit<BackgroundEvent, "id">);
      setToast("✅ Événement créé");
    }
    
    setMode("list");
    setSelectedEvent(null);
    resetForm();
  };

  const handleEdit = (event: BackgroundEvent) => {
    setSelectedEvent(event);
    setFormData({
      name: event.name,
      description: event.description || "",
      type: event.type,
      isActive: event.isActive,
      startDate: event.startDate.slice(0, 16),
      endDate: event.endDate.slice(0, 16),
      priority: event.priority,
      customCSS: event.customCSS || "",
      customJS: event.customJS || "",
      customHTML: event.customHTML || "",
      sponsorName: event.sponsorName || "",
      sponsorLogo: event.sponsorLogo || "",
      sponsorUrl: event.sponsorUrl || "",
    });
    setMode("edit");
  };

  const handleDelete = (id: string) => {
    if (confirm("Supprimer cet événement ?")) {
      deleteBgEvent(id);
      setToast("🗑️ Événement supprimé");
    }
  };

  const handleToggleActive = (event: BackgroundEvent) => {
    updateBgEvent(event.id, { isActive: !event.isActive });
    setToast(event.isActive ? "⏸️ Événement désactivé" : "▶️ Événement activé");
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "custom",
      isActive: false,
      startDate: "",
      endDate: "",
      priority: 50,
      customCSS: "",
      customJS: "",
      customHTML: "",
      sponsorName: "",
      sponsorLogo: "",
      sponsorUrl: "",
    });
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-neutral-900 px-6 py-3 text-sm font-medium text-white shadow-lg dark:bg-white dark:text-neutral-900">
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/admin")} className="rounded-xl p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold">🎨 Gestion des fonds animés</h1>
              <p className="text-xs text-neutral-500">{bgEvents.length} événements • {activeEvents.length} actif(s)</p>
            </div>
          </div>
          
          {mode === "list" && (
            <button
              onClick={() => { resetForm(); setSelectedEvent(null); setMode("create"); }}
              className="flex items-center gap-2 rounded-xl bg-fuchsia-500 px-4 py-2 text-sm font-medium text-white hover:bg-fuchsia-600"
            >
              <span>+</span> Nouveau fond
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {/* === MODE LISTE === */}
        {mode === "list" && (
          <div className="space-y-6">
            {/* Stats rapides */}
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-900">
                <p className="text-2xl font-bold text-emerald-600">{activeEvents.length}</p>
                <p className="text-sm text-neutral-500">Actifs maintenant</p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-900">
                <p className="text-2xl font-bold text-sky-600">{scheduledEvents.length}</p>
                <p className="text-sm text-neutral-500">Programmés</p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-900">
                <p className="text-2xl font-bold text-fuchsia-600">{bgEvents.filter(e => e.type === "sponsored").length}</p>
                <p className="text-sm text-neutral-500">Sponsorisés</p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-900">
                <p className="text-2xl font-bold text-amber-600">
                  {bgEvents.reduce((s, e) => s + (e.impressions || 0), 0).toLocaleString()}
                </p>
                <p className="text-sm text-neutral-500">Impressions totales</p>
              </div>
            </div>

            {/* Liste des événements */}
            <div className="rounded-2xl bg-white shadow-sm dark:bg-neutral-900">
              <div className="border-b border-neutral-100 p-4 dark:border-neutral-800">
                <h2 className="font-bold">📋 Tous les événements</h2>
              </div>
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {bgEvents.length === 0 ? (
                  <div className="p-8 text-center">
                    <span className="text-4xl">🎨</span>
                    <p className="mt-2 text-neutral-500">Aucun événement de fond</p>
                  </div>
                ) : (
                  bgEvents.map((event) => (
                    <div key={event.id} className={clsx(
                      "flex items-center justify-between p-4",
                      event.isActive && "bg-emerald-50/50 dark:bg-emerald-950/20"
                    )}>
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">
                          {event.type === "new_year" ? "🎆" :
                           event.type === "chinese_new_year" ? "🧧" :
                           event.type === "christmas" ? "🎄" :
                           event.type === "halloween" ? "🎃" :
                           event.type === "valentine" ? "💕" :
                           event.type === "easter" ? "🐣" :
                           event.type === "summer" ? "☀️" :
                           event.type === "sponsored" ? "💰" : "🎨"}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{event.name}</span>
                            {event.isActive && (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                                ACTIF
                              </span>
                            )}
                            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs dark:bg-neutral-800">
                              {BG_EVENT_LABELS[event.type]}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-500">
                            {new Date(event.startDate).toLocaleDateString("fr-FR")} → {new Date(event.endDate).toLocaleDateString("fr-FR")}
                            {event.impressions && ` • ${event.impressions.toLocaleString()} vues`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPreviewEvent(event)}
                          className="rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-medium hover:bg-neutral-200 dark:bg-neutral-800"
                        >
                          👁️ Prévisualiser
                        </button>
                        <button
                          onClick={() => handleToggleActive(event)}
                          className={clsx(
                            "rounded-lg px-3 py-1.5 text-xs font-medium",
                            event.isActive 
                              ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                              : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          )}
                        >
                          {event.isActive ? "⏸️ Désactiver" : "▶️ Activer"}
                        </button>
                        <button
                          onClick={() => handleEdit(event)}
                          className="rounded-lg bg-fuchsia-100 px-3 py-1.5 text-xs font-medium text-fuchsia-700 hover:bg-fuchsia-200"
                        >
                          ✏️ Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-200"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Lien vers le README */}
            <div className="rounded-2xl bg-gradient-to-r from-fuchsia-500 to-amber-500 p-6 text-white">
              <h3 className="text-lg font-bold">💡 Créer un fond animé personnalisé</h3>
              <p className="mt-2 text-sm text-white/80">
                Utilisez notre prompt Gemini pour générer facilement du code CSS/JS pour vos fonds animés.
              </p>
              <button
                onClick={() => router.push("/admin/backgrounds/readme")}
                className="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-medium text-fuchsia-600 hover:bg-white/90"
              >
                📖 Voir le guide & prompt Gemini
              </button>
            </div>
          </div>
        )}

        {/* === MODE ÉDITION/CRÉATION === */}
        {(mode === "edit" || mode === "create") && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {mode === "create" ? "➕ Créer un nouvel événement" : `✏️ Modifier: ${selectedEvent?.name}`}
              </h2>
              <button onClick={() => { setMode("list"); setSelectedEvent(null); }} className="text-sm text-neutral-500 hover:text-neutral-700">
                ← Retour à la liste
              </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Formulaire principal */}
              <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
                <h3 className="font-bold">📝 Informations générales</h3>
                
                <div>
                  <label className="text-sm font-medium">Nom *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm outline-none focus:border-fuchsia-400 dark:border-neutral-700 dark:bg-neutral-800"
                    placeholder="Ex: Nouvel An Chinois 2026"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm outline-none focus:border-fuchsia-400 dark:border-neutral-700 dark:bg-neutral-800"
                    placeholder="Description de l'événement..."
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Type d'événement *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as BackgroundEventType })}
                    className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm outline-none dark:border-neutral-700 dark:bg-neutral-800"
                  >
                    {Object.entries(BG_EVENT_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Date de début *</label>
                    <input
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm outline-none dark:border-neutral-700 dark:bg-neutral-800"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Date de fin *</label>
                    <input
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm outline-none dark:border-neutral-700 dark:bg-neutral-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Priorité (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm outline-none dark:border-neutral-700 dark:bg-neutral-800"
                  />
                  <p className="mt-1 text-xs text-neutral-500">Plus la priorité est élevée, plus l'événement sera affiché en premier</p>
                </div>

                {/* Sponsoring */}
                {formData.type === "sponsored" && (
                  <div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
                    <h4 className="font-medium text-amber-700">💰 Informations sponsor</h4>
                    <div>
                      <label className="text-sm font-medium">Nom du sponsor</label>
                      <input
                        type="text"
                        value={formData.sponsorName}
                        onChange={(e) => setFormData({ ...formData, sponsorName: e.target.value })}
                        className="mt-1 w-full rounded-xl border px-4 py-2 text-sm"
                        placeholder="Ex: TechCorp"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Logo URL</label>
                      <input
                        type="url"
                        value={formData.sponsorLogo}
                        onChange={(e) => setFormData({ ...formData, sponsorLogo: e.target.value })}
                        className="mt-1 w-full rounded-xl border px-4 py-2 text-sm"
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">URL du sponsor</label>
                      <input
                        type="url"
                        value={formData.sponsorUrl}
                        onChange={(e) => setFormData({ ...formData, sponsorUrl: e.target.value })}
                        className="mt-1 w-full rounded-xl border px-4 py-2 text-sm"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Code personnalisé */}
              <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
                <h3 className="font-bold">💻 Code personnalisé</h3>
                <p className="text-xs text-neutral-500">Pour les événements de type "Personnalisé", collez votre code CSS/JS/HTML ici.</p>

                <div>
                  <label className="text-sm font-medium">CSS personnalisé</label>
                  <textarea
                    value={formData.customCSS}
                    onChange={(e) => setFormData({ ...formData, customCSS: e.target.value })}
                    rows={8}
                    className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-900 px-4 py-3 font-mono text-xs text-green-400 outline-none focus:border-fuchsia-400"
                    placeholder=".my-particle {
  position: absolute;
  animation: myAnim 3s infinite;
}
@keyframes myAnim {
  ...
}"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">JavaScript personnalisé</label>
                  <textarea
                    value={formData.customJS}
                    onChange={(e) => setFormData({ ...formData, customJS: e.target.value })}
                    rows={10}
                    className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-900 px-4 py-3 font-mono text-xs text-amber-400 outline-none focus:border-fuchsia-400"
                    placeholder="// 'container' est disponible comme élément parent
// Retournez une fonction pour le cleanup

for (let i = 0; i < 20; i++) {
  const el = document.createElement('div');
  el.className = 'my-particle';
  container.appendChild(el);
}

return () => {
  // Cleanup au démontage
};"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">HTML personnalisé</label>
                  <textarea
                    value={formData.customHTML}
                    onChange={(e) => setFormData({ ...formData, customHTML: e.target.value })}
                    rows={4}
                    className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-900 px-4 py-3 font-mono text-xs text-sky-400 outline-none focus:border-fuchsia-400"
                    placeholder='<div class="my-element">...</div>'
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setMode("list"); setSelectedEvent(null); }}
                className="rounded-xl border border-neutral-200 px-6 py-3 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="rounded-xl bg-fuchsia-500 px-6 py-3 text-sm font-medium text-white hover:bg-fuchsia-600"
              >
                {mode === "create" ? "Créer l'événement" : "Enregistrer les modifications"}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modal de prévisualisation */}
      {previewEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="relative h-[80vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-neutral-900">
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              <button
                onClick={() => setPreviewEvent(null)}
                className="rounded-xl bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
              >
                ✕ Fermer
              </button>
            </div>
            <div className="absolute top-4 left-4 z-10">
              <span className="rounded-full bg-emerald-500 px-3 py-1 text-sm font-bold text-white">
                PRÉVISUALISATION
              </span>
            </div>
            
            {/* Simulation du fond */}
            <div className="relative h-full w-full">
              {/* Import dynamique du composant - simulé ici */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-6xl">
                    {previewEvent.type === "new_year" ? "🎆" :
                     previewEvent.type === "chinese_new_year" ? "🧧" :
                     previewEvent.type === "christmas" ? "🎄" :
                     previewEvent.type === "halloween" ? "🎃" :
                     previewEvent.type === "valentine" ? "💕" : "🎨"}
                  </span>
                  <h3 className="mt-4 text-2xl font-bold text-white">{previewEvent.name}</h3>
                  <p className="text-neutral-400">{BG_EVENT_LABELS[previewEvent.type]}</p>
                  <p className="mt-2 text-sm text-neutral-500">
                    La prévisualisation complète est disponible sur la page principale
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
