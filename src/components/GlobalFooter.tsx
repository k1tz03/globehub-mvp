'use client';

import Link from 'next/link';
import { useCookieConsentStore } from '@/lib/useCookieConsentStore';

export function GlobalFooter() {
  const { openPreferences } = useCookieConsentStore();

  return (
    <footer className="bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo et description */}
          <div className="md:col-span-1">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-sky-500 via-fuchsia-500 to-amber-500 bg-clip-text text-transparent">
              GlobeHub
            </Link>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
              Le réseau social géolocalisé sur globe 3D.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">Navigation</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-neutral-600 dark:text-neutral-400 hover:text-fuchsia-500 transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-neutral-600 dark:text-neutral-400 hover:text-fuchsia-500 transition-colors">
                  À propos
                </Link>
              </li>
              <li>
                <Link href="/groups" className="text-neutral-600 dark:text-neutral-400 hover:text-fuchsia-500 transition-colors">
                  Groupes
                </Link>
              </li>
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">Informations légales</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/legal" className="text-neutral-600 dark:text-neutral-400 hover:text-fuchsia-500 transition-colors">
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-neutral-600 dark:text-neutral-400 hover:text-fuchsia-500 transition-colors">
                  Conditions d&apos;utilisation
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-neutral-600 dark:text-neutral-400 hover:text-fuchsia-500 transition-colors">
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <button
                  onClick={openPreferences}
                  className="text-neutral-600 dark:text-neutral-400 hover:text-fuchsia-500 transition-colors"
                >
                  Gérer les cookies
                </button>
              </li>
            </ul>
          </div>

          {/* DSA & Conformité */}
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">Conformité DSA</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/transparency" className="text-neutral-600 dark:text-neutral-400 hover:text-fuchsia-500 transition-colors">
                  Transparence algorithmique
                </Link>
              </li>
              <li>
                <Link href="/appeal" className="text-neutral-600 dark:text-neutral-400 hover:text-fuchsia-500 transition-colors">
                  Contester une décision
                </Link>
              </li>
              <li>
                <a href="mailto:dsa@globehub.app" className="text-neutral-600 dark:text-neutral-400 hover:text-fuchsia-500 transition-colors">
                  Contact DSA
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Ligne de copyright */}
        <div className="border-t border-neutral-200 dark:border-neutral-700 mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400">
            <p>
              © 2025 GlobeHub SAS. Tous droits réservés.
            </p>
            <p>
              Hébergé en Union Européenne | RCS Paris B 123 456 789
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
