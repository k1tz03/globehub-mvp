'use client';

import { useState } from 'react';
import { useCookieConsentStore, ConsentCategory } from '@/lib/useCookieConsentStore';

// Inline SVG icons
const IconCookie = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="8" cy="9" r="1" fill="currentColor" />
    <circle cx="15" cy="8" r="1" fill="currentColor" />
    <circle cx="10" cy="14" r="1" fill="currentColor" />
    <circle cx="16" cy="14" r="1" fill="currentColor" />
    <circle cx="13" cy="11" r="1" fill="currentColor" />
  </svg>
);

const IconX = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconShield = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const IconSettings = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const IconBarChart = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>
);

const IconTarget = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const COOKIE_CATEGORIES: {
  id: ConsentCategory;
  name: string;
  description: string;
  icon: React.ReactNode;
  required: boolean;
}[] = [
  {
    id: 'necessary',
    name: 'Cookies essentiels',
    description: 'Ces cookies sont nécessaires au fonctionnement du site. Ils permettent la navigation, la connexion sécurisée et les fonctions de base.',
    icon: <IconShield className="w-5 h-5" />,
    required: true,
  },
  {
    id: 'functional',
    name: 'Cookies fonctionnels',
    description: 'Ces cookies permettent de mémoriser vos préférences (langue, région, personnalisation de l\'interface).',
    icon: <IconSettings className="w-5 h-5" />,
    required: false,
  },
  {
    id: 'analytics',
    name: 'Cookies analytiques',
    description: 'Ces cookies nous aident à comprendre comment les visiteurs utilisent le site en collectant des informations de manière anonyme.',
    icon: <IconBarChart className="w-5 h-5" />,
    required: false,
  },
  {
    id: 'marketing',
    name: 'Cookies marketing',
    description: 'Ces cookies sont utilisés pour afficher des publicités pertinentes et mesurer l\'efficacité des campagnes publicitaires.',
    icon: <IconTarget className="w-5 h-5" />,
    required: false,
  },
];

export function CookieBanner() {
  const {
    showBanner,
    showPreferences,
    consent,
    acceptAll,
    rejectAll,
    savePreferences,
    openPreferences,
    closePreferences,
  } = useCookieConsentStore();

  const [preferences, setPreferences] = useState({
    functional: consent?.functional ?? false,
    analytics: consent?.analytics ?? false,
    marketing: consent?.marketing ?? false,
  });

  if (!showBanner && !showPreferences) return null;

  const handleSavePreferences = () => {
    savePreferences(preferences);
  };

  // Modal de préférences détaillées
  if (showPreferences) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <IconCookie className="w-6 h-6 text-orange-500" />
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                Paramètres des cookies
              </h2>
            </div>
            <button
              onClick={closePreferences}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full transition-colors"
            >
              <IconX className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Nous utilisons des cookies pour améliorer votre expérience sur notre site.
              Vous pouvez choisir les catégories de cookies que vous acceptez.
              Pour plus d&apos;informations, consultez notre{' '}
              <a href="/privacy" className="text-orange-500 hover:underline">
                politique de confidentialité
              </a>.
            </p>

            <div className="space-y-4">
              {COOKIE_CATEGORIES.map((category) => (
                <div
                  key={category.id}
                  className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-xl"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-neutral-100 dark:bg-neutral-700 rounded-lg text-neutral-600 dark:text-neutral-400">
                        {category.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-neutral-900 dark:text-white">
                          {category.name}
                          {category.required && (
                            <span className="ml-2 text-xs text-orange-500 font-normal">
                              (obligatoire)
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                          {category.description}
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={category.required || preferences[category.id as keyof typeof preferences] || false}
                        disabled={category.required}
                        onChange={(e) => {
                          if (!category.required) {
                            setPreferences((prev) => ({
                              ...prev,
                              [category.id]: e.target.checked,
                            }));
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className={`w-11 h-6 rounded-full peer
                        ${category.required
                          ? 'bg-orange-500 cursor-not-allowed'
                          : 'bg-neutral-200 dark:bg-neutral-700 peer-checked:bg-orange-500'
                        }
                        peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800
                        after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                        after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all
                        peer-checked:after:translate-x-full`}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 border-t border-neutral-200 dark:border-neutral-700 flex flex-wrap gap-3 justify-end">
            <button
              onClick={rejectAll}
              className="px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
            >
              Tout refuser
            </button>
            <button
              onClick={acceptAll}
              className="px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
            >
              Tout accepter
            </button>
            <button
              onClick={handleSavePreferences}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              Enregistrer mes choix
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Bandeau principal
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 shadow-lg">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex items-start gap-3 flex-1">
            <IconCookie className="w-8 h-8 text-orange-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-white">
                Nous respectons votre vie privée
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                Nous utilisons des cookies pour améliorer votre expérience, analyser le trafic
                et personnaliser le contenu. En cliquant sur &quot;Accepter tout&quot;, vous consentez
                à l&apos;utilisation de tous les cookies. Vous pouvez personnaliser vos préférences
                à tout moment.{' '}
                <a href="/privacy" className="text-orange-500 hover:underline">
                  En savoir plus
                </a>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <button
              onClick={openPreferences}
              className="flex-1 md:flex-none px-4 py-2 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors text-sm"
            >
              Personnaliser
            </button>
            <button
              onClick={rejectAll}
              className="flex-1 md:flex-none px-4 py-2 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors text-sm"
            >
              Tout refuser
            </button>
            <button
              onClick={acceptAll}
              className="flex-1 md:flex-none px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
            >
              Tout accepter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
