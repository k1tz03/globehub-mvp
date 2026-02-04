"use client";

import { useState } from "react";
import { clsx } from "clsx";
import type { ReportReason, ReportCategory } from "@/lib/types";

type ReportModalProps = {
  targetId: string;
  targetType: ReportCategory;
  targetPreview?: string;
  onSubmit: (reason: ReportReason, details?: string) => void;
  onClose: () => void;
};

const REPORT_REASONS: { value: ReportReason; label: string; description: string; icon: string }[] = [
  { value: "spam", label: "Spam", description: "Contenu répétitif ou publicité non sollicitée", icon: "📢" },
  { value: "hate", label: "Discours haineux", description: "Propos racistes, sexistes, homophobes...", icon: "😤" },
  { value: "violence", label: "Violence", description: "Menaces, incitation à la violence", icon: "⚠️" },
  { value: "harassment", label: "Harcèlement", description: "Intimidation, persécution ciblée", icon: "😰" },
  { value: "misinformation", label: "Désinformation", description: "Fausses informations présentées comme vraies", icon: "📰" },
  { value: "inappropriate", label: "Contenu inapproprié", description: "Contenu adulte, choquant ou dérangeant", icon: "🔞" },
  { value: "copyright", label: "Violation de droits d'auteur", description: "Utilisation non autorisée de contenu protégé", icon: "©️" },
  { value: "impersonation", label: "Usurpation d'identité", description: "Se faire passer pour quelqu'un d'autre", icon: "🎭" },
  { value: "suicide_self_harm", label: "Automutilation / Suicide", description: "Contenu promouvant l'automutilation", icon: "💔" },
  { value: "illegal_content", label: "Contenu illégal", description: "Activités illégales, drogues, armes...", icon: "🚫" },
  { value: "other", label: "Autre", description: "Un autre motif non listé ci-dessus", icon: "❓" },
];

export default function ReportModal({ targetId, targetType, targetPreview, onSubmit, onClose }: ReportModalProps) {
  const [step, setStep] = useState<"reason" | "details">("reason");
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSelectReason = (reason: ReportReason) => {
    setSelectedReason(reason);
    setStep("details");
  };

  const handleSubmit = async () => {
    if (!selectedReason) return;
    
    setSubmitting(true);
    try {
      onSubmit(selectedReason, details.trim() || undefined);
    } finally {
      setSubmitting(false);
    }
  };

  const targetLabel = {
    post: "ce post",
    user: "cet utilisateur",
    message: "ce message",
    comment: "ce commentaire",
  }[targetType];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            {step === "details" && (
              <button
                onClick={() => setStep("reason")}
                className="rounded-full p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h3 className="text-lg font-bold">Signaler {targetLabel}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-6">
          {/* Preview */}
          {targetPreview && (
            <div className="mb-4 rounded-xl bg-neutral-100 p-3 dark:bg-neutral-800">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">{targetPreview}</p>
            </div>
          )}

          {step === "reason" && (
            <div className="space-y-2">
              <p className="mb-4 text-sm text-neutral-500">
                Pourquoi signalez-vous {targetLabel} ?
              </p>
              
              {REPORT_REASONS.map((reason) => (
                <button
                  key={reason.value}
                  onClick={() => handleSelectReason(reason.value)}
                  className="flex w-full items-center gap-3 rounded-xl border border-neutral-200 p-4 text-left transition-colors hover:border-fuchsia-400 hover:bg-fuchsia-50 dark:border-neutral-700 dark:hover:bg-fuchsia-950/20"
                >
                  <span className="text-2xl">{reason.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium">{reason.label}</p>
                    <p className="text-sm text-neutral-500">{reason.description}</p>
                  </div>
                  <svg className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          )}

          {step === "details" && selectedReason && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl bg-fuchsia-50 p-4 dark:bg-fuchsia-950/30">
                <span className="text-2xl">
                  {REPORT_REASONS.find((r) => r.value === selectedReason)?.icon}
                </span>
                <div>
                  <p className="font-medium">
                    {REPORT_REASONS.find((r) => r.value === selectedReason)?.label}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {REPORT_REASONS.find((r) => r.value === selectedReason)?.description}
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Détails supplémentaires (optionnel)
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Décrivez le problème en détail..."
                  rows={4}
                  maxLength={500}
                  className="w-full resize-none rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-fuchsia-400 dark:border-neutral-700 dark:bg-neutral-800"
                />
                <p className="mt-1 text-xs text-neutral-500">{details.length}/500 caractères</p>
              </div>

              <div className="rounded-xl bg-amber-50 p-4 dark:bg-amber-950/30">
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  <strong>Important :</strong> Les faux signalements peuvent entraîner des sanctions sur votre compte. 
                  Signalez uniquement du contenu qui enfreint réellement nos règles.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === "details" && (
          <div className="border-t border-neutral-200 px-6 py-4 dark:border-neutral-700">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border border-neutral-200 py-3 text-sm font-medium transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 rounded-xl bg-rose-500 py-3 text-sm font-medium text-white transition-colors hover:bg-rose-600 disabled:opacity-50"
              >
                {submitting ? "Envoi..." : "Envoyer le signalement"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
