'use client';

import { useState } from 'react';
import Link from 'next/link';

type AppealType = 'content_removal' | 'account_suspension' | 'content_restriction' | 'other';
type AppealStatus = 'draft' | 'submitted' | 'success';

// Inline SVG icons
const IconArrowLeft = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const IconScale = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 3h5v5M8 3H3v5M21 21l-5-5M3 21l5-5M5 12l4-8 4 8H5zM19 12l-4-8-4 8h8z" />
  </svg>
);

const IconAlert = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const IconCheck = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconFileText = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const IconSend = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const IconClock = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconInfo = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

interface AppealForm {
  type: AppealType;
  decisionId: string;
  decisionDate: string;
  contentUrl: string;
  reason: string;
  additionalInfo: string;
  email: string;
  acceptTerms: boolean;
}

const APPEAL_TYPES: { value: AppealType; label: string; description: string }[] = [
  {
    value: 'content_removal',
    label: 'Suppression de contenu',
    description: 'Votre contenu (publication, commentaire, événement) a été supprimé',
  },
  {
    value: 'account_suspension',
    label: 'Suspension de compte',
    description: 'Votre compte a été temporairement ou définitivement suspendu',
  },
  {
    value: 'content_restriction',
    label: 'Restriction de visibilité',
    description: 'Votre contenu a été déréférencé ou sa visibilité a été réduite',
  },
  {
    value: 'other',
    label: 'Autre décision',
    description: 'Toute autre décision de modération vous concernant',
  },
];

export default function AppealPage() {
  const [status, setStatus] = useState<AppealStatus>('draft');
  const [form, setForm] = useState<AppealForm>({
    type: 'content_removal',
    decisionId: '',
    decisionDate: '',
    contentUrl: '',
    reason: '',
    additionalInfo: '',
    email: '',
    acceptTerms: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof AppealForm, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof AppealForm, string>> = {};

    if (!form.decisionId.trim()) {
      newErrors.decisionId = 'Veuillez entrer l\'identifiant de la décision';
    }
    if (!form.decisionDate) {
      newErrors.decisionDate = 'Veuillez indiquer la date de la décision';
    }
    if (!form.reason.trim()) {
      newErrors.reason = 'Veuillez expliquer les raisons de votre contestation';
    } else if (form.reason.trim().length < 50) {
      newErrors.reason = 'Veuillez fournir plus de détails (minimum 50 caractères)';
    }
    if (!form.email.trim()) {
      newErrors.email = 'Veuillez entrer votre adresse email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Veuillez entrer une adresse email valide';
    }
    if (!form.acceptTerms) {
      newErrors.acceptTerms = 'Vous devez accepter les conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setStatus('submitted');
      // Simuler l'envoi
      setTimeout(() => {
        setStatus('success');
      }, 2000);
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-8 max-w-lg w-full text-center shadow-lg">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <IconCheck className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
            Appel soumis avec succès
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            Votre contestation a été enregistrée. Vous recevrez une réponse par email
            dans un délai maximum de 7 jours ouvrés, conformément au Digital Services Act.
          </p>
          <div className="bg-neutral-50 dark:bg-neutral-700/50 rounded-lg p-4 mb-6">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              <strong>Numéro de référence :</strong><br />
              <span className="font-mono text-lg">APP-{Date.now().toString(36).toUpperCase()}</span>
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-fuchsia-500 text-white rounded-lg hover:bg-fuchsia-600 transition-colors"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'submitted') {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-8 max-w-lg w-full text-center shadow-lg">
          <div className="w-16 h-16 bg-fuchsia-100 dark:bg-fuchsia-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <IconSend className="w-8 h-8 text-fuchsia-500" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
            Envoi en cours...
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Veuillez patienter pendant le traitement de votre demande.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <header className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-fuchsia-500 transition-colors mb-4"
          >
            <IconArrowLeft className="w-4 h-4" />
            Retour à l&apos;accueil
          </Link>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white flex items-center gap-3">
            <IconScale className="w-8 h-8 text-fuchsia-500" />
            Contester une décision de modération
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-2">
            Conformément au Digital Services Act (DSA), vous avez le droit de contester
            toute décision de modération vous concernant.
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Informations DSA */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <IconInfo className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-semibold mb-1">Vos droits selon le Digital Services Act</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
                <li>Vous pouvez contester toute décision de modération dans un délai de 6 mois</li>
                <li>Nous nous engageons à répondre dans un délai de 7 jours ouvrés</li>
                <li>La décision sera réexaminée par un modérateur différent</li>
                <li>En cas de désaccord persistant, vous pouvez saisir un organisme de règlement extrajudiciaire</li>
              </ul>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type d'appel */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
              <IconFileText className="w-5 h-5 text-fuchsia-500" />
              Type de décision contestée
            </h2>
            <div className="grid gap-3">
              {APPEAL_TYPES.map((type) => (
                <label
                  key={type.value}
                  className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    form.type === type.value
                      ? 'border-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-900/20'
                      : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="type"
                    value={type.value}
                    checked={form.type === type.value}
                    onChange={(e) => setForm({ ...form, type: e.target.value as AppealType })}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-white">{type.label}</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">{type.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Informations sur la décision */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
              <IconClock className="w-5 h-5 text-fuchsia-500" />
              Informations sur la décision
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Identifiant de la décision *
                </label>
                <input
                  type="text"
                  value={form.decisionId}
                  onChange={(e) => setForm({ ...form, decisionId: e.target.value })}
                  placeholder="Ex: MOD-ABC123 (visible dans la notification reçue)"
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white ${
                    errors.decisionId ? 'border-rose-500' : 'border-neutral-300 dark:border-neutral-600'
                  }`}
                />
                {errors.decisionId && (
                  <p className="text-rose-500 text-sm mt-1">{errors.decisionId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Date de la décision *
                </label>
                <input
                  type="date"
                  value={form.decisionDate}
                  onChange={(e) => setForm({ ...form, decisionDate: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white ${
                    errors.decisionDate ? 'border-rose-500' : 'border-neutral-300 dark:border-neutral-600'
                  }`}
                />
                {errors.decisionDate && (
                  <p className="text-rose-500 text-sm mt-1">{errors.decisionDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  URL du contenu concerné (optionnel)
                </label>
                <input
                  type="url"
                  value={form.contentUrl}
                  onChange={(e) => setForm({ ...form, contentUrl: e.target.value })}
                  placeholder="https://globehub.app/..."
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Motifs de contestation */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
              <IconAlert className="w-5 h-5 text-fuchsia-500" />
              Motifs de contestation
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Pourquoi contestez-vous cette décision ? *
                </label>
                <textarea
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  rows={4}
                  placeholder="Expliquez en détail pourquoi vous pensez que cette décision est injustifiée..."
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white resize-none ${
                    errors.reason ? 'border-rose-500' : 'border-neutral-300 dark:border-neutral-600'
                  }`}
                />
                {errors.reason && (
                  <p className="text-rose-500 text-sm mt-1">{errors.reason}</p>
                )}
                <p className="text-neutral-500 text-sm mt-1">
                  {form.reason.length}/500 caractères (minimum 50)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Informations complémentaires (optionnel)
                </label>
                <textarea
                  value={form.additionalInfo}
                  onChange={(e) => setForm({ ...form, additionalInfo: e.target.value })}
                  rows={3}
                  placeholder="Ajoutez tout élément de contexte pertinent..."
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white resize-none"
                />
              </div>
            </div>
          </div>

          {/* Coordonnées */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              Vos coordonnées
            </h2>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Adresse email pour la réponse *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="votre@email.com"
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white ${
                  errors.email ? 'border-rose-500' : 'border-neutral-300 dark:border-neutral-600'
                }`}
              />
              {errors.email && (
                <p className="text-rose-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Acceptation des conditions */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.acceptTerms}
                onChange={(e) => setForm({ ...form, acceptTerms: e.target.checked })}
                className="mt-1"
              />
              <span className="text-sm text-neutral-700 dark:text-neutral-300">
                Je certifie que les informations fournies sont exactes et j&apos;accepte que
                mes données soient traitées conformément à la{' '}
                <Link href="/privacy" className="text-fuchsia-500 hover:underline">
                  politique de confidentialité
                </Link>{' '}
                pour le traitement de cette contestation. *
              </span>
            </label>
            {errors.acceptTerms && (
              <p className="text-rose-500 text-sm mt-2">{errors.acceptTerms}</p>
            )}
          </div>

          {/* Bouton de soumission */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-8 py-3 bg-fuchsia-500 text-white rounded-lg hover:bg-fuchsia-600 transition-colors font-medium flex items-center gap-2"
            >
              <IconSend className="w-5 h-5" />
              Soumettre ma contestation
            </button>
          </div>
        </form>

        {/* Informations supplémentaires */}
        <div className="mt-8 p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-sm text-neutral-600 dark:text-neutral-400">
          <p className="font-medium mb-2">Besoin d&apos;aide ?</p>
          <p>
            Si vous avez des questions sur le processus d&apos;appel, contactez-nous à{' '}
            <a href="mailto:dsa@globehub.app" className="text-fuchsia-500 hover:underline">
              dsa@globehub.app
            </a>
          </p>
          <p className="mt-2">
            Vous pouvez également saisir un organisme de règlement extrajudiciaire des litiges
            certifié par la Commission européenne si vous n&apos;êtes pas satisfait de notre réponse.
          </p>
        </div>
      </main>
    </div>
  );
}
