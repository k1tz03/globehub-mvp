"use client";

import { useState } from "react";
import { clsx } from "clsx";
import type { ReportReason, ReportCategory } from "@/lib/types";

interface ReportModalProps {
  targetId: string;
  targetType: ReportCategory;
  onClose: () => void;
  onSubmit: (reason: ReportReason, details: string) => void;
}

const reportReasons: { id: ReportReason; label: string; description: string; icon: string }[] = [
  { id: "spam", label: "Spam", description: "Contenu commercial non sollicité ou répétitif", icon: "📧" },
  { id: "hate", label: "Discours haineux", description: "Propos discriminatoires ou incitant à la haine", icon: "🚫" },
  { id: "violence", label: "Violence", description: "Contenu violent ou menaçant", icon: "⚠️" },
  { id: "misinformation", label: "Désinformation", description: "Fausses informations ou fake news", icon: "📰" },
  { id: "harassment", label: "Harcèlement", description: "Comportement harcelant ou intimidant", icon: "😠" },
  { id: "inappropriate", label: "Contenu inapproprié", description: "Contenu sexuel ou choquant", icon: "🔞" },
  { id: "copyright", label: "Violation de droits", description: "Contenu protégé par le droit d'auteur", icon: "©️" },
  { id: "impersonation", label: "Usurpation d'identité", description: "Se fait passer pour quelqu'un d'autre", icon: "🎭" },
  { id: "suicide_self_harm", label: "Automutilation", description: "Contenu promouvant l'automutilation", icon: "💔" },
  { id: "illegal_content", label: "Contenu illégal", description: "Activités illégales ou dangereuses", icon: "⛔" },
  { id: "other", label: "Autre", description: "Autre raison non listée", icon: "📝" },
];

export function ReportModal({ targetId, targetType, onClose, onSubmit }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [step, setStep] = useState<"reason" | "details" | "success">("reason");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) return;
    
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 500));
    onSubmit(selectedReason, details);
    setSubmitting(false);
    setStep("success");
  };

  const getTargetLabel = () => {
    switch (targetType) {
      case "post": return "ce post";
      case "user": return "cet utilisateur";
      case "message": return "ce message";
      case "comment": return "ce commentaire";
      default: return "ce contenu";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div 
        className="w-full max-w-lg rounded-2xl bg-white shadow-xl dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
          <h2 className="text-lg font-bold">
            {step === "success" ? "Signalement envoyé" : `Signaler ${getTargetLabel()}`}
          </h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {step === "reason" && (
            <>
              <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
                Pourquoi signalez-vous {getTargetLabel()} ?
              </p>
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {reportReasons.map((reason) => (
                  <button
                    key={reason.id}
                    onClick={() => setSelectedReason(reason.id)}
                    className={clsx(
                      "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                      selectedReason === reason.id
                        ? "border-fuchsia-500 bg-fuchsia-50 dark:border-fuchsia-400 dark:bg-fuchsia-950/30"
                        : "border-neutral-200 hover:border-neutral-300 dark:border-neutral-700 dark:hover:border-neutral-600"
                    )}
                  >
                    <span className="text-xl">{reason.icon}</span>
                    <div>
                      <p className="font-medium">{reason.label}</p>
                      <p className="text-sm text-neutral-500">{reason.description}</p>
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => selectedReason && setStep("details")}
                disabled={!selectedReason}
                className="mt-4 w-full rounded-xl bg-fuchsia-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-fuchsia-600 disabled:opacity-50"
              >
                Continuer
              </button>
            </>
          )}

          {step === "details" && (
            <>
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-neutral-100 p-3 dark:bg-neutral-800">
                <span className="text-xl">{reportReasons.find((r) => r.id === selectedReason)?.icon}</span>
                <span className="font-medium">{reportReasons.find((r) => r.id === selectedReason)?.label}</span>
              </div>
              
              <label className="mb-2 block text-sm font-medium">Détails supplémentaires (optionnel)</label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={4}
                maxLength={500}
                placeholder="Décrivez le problème en détail..."
                className="w-full resize-none rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 dark:border-neutral-700 dark:bg-neutral-800"
              />
              <p className="mt-1 text-right text-xs text-neutral-500">{details.length}/500</p>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setStep("reason")}
                  className="flex-1 rounded-xl bg-neutral-100 px-6 py-3 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400"
                >
                  Retour
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-rose-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-rose-600 disabled:opacity-50"
                >
                  {submitting ? "Envoi..." : "Envoyer le signalement"}
                </button>
              </div>
            </>
          )}

          {step === "success" && (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50">
                <svg className="h-8 w-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-bold">Merci pour votre signalement</h3>
              <p className="mb-6 text-sm text-neutral-500">
                Notre équipe de modération examinera ce contenu dans les plus brefs délais.
              </p>
              <button
                onClick={onClose}
                className="rounded-xl bg-neutral-900 px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-900"
              >
                Fermer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
