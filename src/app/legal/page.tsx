'use client';

import Link from 'next/link';

// Inline SVG icons
const IconArrowLeft = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const IconBuilding = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
    <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01" />
  </svg>
);

const IconServer = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
    <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
    <line x1="6" y1="6" x2="6.01" y2="6" />
    <line x1="6" y1="18" x2="6.01" y2="18" />
  </svg>
);

const IconMail = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const IconPhone = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const IconGlobe = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const IconFileText = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <header className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-orange-500 transition-colors mb-4"
          >
            <IconArrowLeft className="w-4 h-4" />
            Retour à l&apos;accueil
          </Link>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white flex items-center gap-3">
            <IconFileText className="w-8 h-8 text-orange-500" />
            Mentions Légales
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-2">
            Conformément à la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l&apos;économie numérique
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Éditeur du site */}
        <section className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <IconBuilding className="w-5 h-5 text-orange-500" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
              1. Éditeur du site
            </h2>
          </div>

          <div className="space-y-4 text-neutral-700 dark:text-neutral-300">
            <p>
              Le site <strong>GlobeHub</strong> est édité par :
            </p>

            <div className="bg-neutral-50 dark:bg-neutral-700/50 rounded-lg p-4 space-y-2">
              <p><strong>Raison sociale :</strong> GlobeHub SAS</p>
              <p><strong>Forme juridique :</strong> Société par Actions Simplifiée (SAS)</p>
              <p><strong>Capital social :</strong> 10 000 €</p>
              <p><strong>Siège social :</strong> 123 Avenue des Champs-Élysées, 75008 Paris, France</p>
              <p><strong>RCS :</strong> Paris B 123 456 789</p>
              <p><strong>SIRET :</strong> 123 456 789 00012</p>
              <p><strong>Numéro TVA intracommunautaire :</strong> FR 12 123456789</p>
            </div>

            <div className="flex flex-col gap-2 mt-4">
              <div className="flex items-center gap-2">
                <IconMail className="w-4 h-4 text-neutral-500" />
                <span><strong>Email :</strong> contact@globehub.app</span>
              </div>
              <div className="flex items-center gap-2">
                <IconPhone className="w-4 h-4 text-neutral-500" />
                <span><strong>Téléphone :</strong> +33 1 23 45 67 89</span>
              </div>
              <div className="flex items-center gap-2">
                <IconGlobe className="w-4 h-4 text-neutral-500" />
                <span><strong>Site web :</strong> www.globehub.app</span>
              </div>
            </div>
          </div>
        </section>

        {/* Directeur de la publication */}
        <section className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
            2. Directeur de la publication
          </h2>
          <div className="text-neutral-700 dark:text-neutral-300">
            <p>
              Le directeur de la publication est <strong>M. Jean Dupont</strong>,
              en qualité de Président de GlobeHub SAS.
            </p>
            <p className="mt-2">
              Contact : direction@globehub.app
            </p>
          </div>
        </section>

        {/* Hébergeur */}
        <section className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <IconServer className="w-5 h-5 text-blue-500" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
              3. Hébergeur
            </h2>
          </div>

          <div className="text-neutral-700 dark:text-neutral-300 space-y-2">
            <p>Le site est hébergé par :</p>
            <div className="bg-neutral-50 dark:bg-neutral-700/50 rounded-lg p-4 space-y-2">
              <p><strong>Raison sociale :</strong> Vercel Inc.</p>
              <p><strong>Adresse :</strong> 340 S Lemon Ave #4133, Walnut, CA 91789, USA</p>
              <p><strong>Site web :</strong> https://vercel.com</p>
            </div>
          </div>
        </section>

        {/* Propriété intellectuelle */}
        <section className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
            4. Propriété intellectuelle
          </h2>
          <div className="text-neutral-700 dark:text-neutral-300 space-y-4">
            <p>
              L&apos;ensemble des éléments constituant le site GlobeHub (textes, graphismes,
              logiciels, photographies, images, vidéos, sons, plans, noms, logos, marques,
              créations et œuvres protégeables diverses, bases de données, etc.) ainsi que
              le site lui-même, relèvent des législations françaises et internationales sur
              le droit d&apos;auteur et la propriété intellectuelle.
            </p>
            <p>
              Ces éléments sont la propriété exclusive de GlobeHub SAS. Toute reproduction
              ou représentation, intégrale ou partielle, par quelque procédé que ce soit,
              faite sans le consentement de GlobeHub SAS est illicite et constitue une
              contrefaçon sanctionnée par les articles L.335-2 et suivants du Code de la
              propriété intellectuelle.
            </p>
          </div>
        </section>

        {/* Données personnelles */}
        <section className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
            5. Protection des données personnelles
          </h2>
          <div className="text-neutral-700 dark:text-neutral-300 space-y-4">
            <p>
              Conformément au Règlement Général sur la Protection des Données (RGPD) et
              à la loi Informatique et Libertés du 6 janvier 1978 modifiée, vous disposez
              d&apos;un droit d&apos;accès, de rectification, de suppression et de portabilité de
              vos données personnelles.
            </p>
            <p>
              Pour toute demande relative à vos données personnelles, vous pouvez nous
              contacter à : <strong>dpo@globehub.app</strong>
            </p>
            <p>
              Pour plus d&apos;informations, consultez notre{' '}
              <Link href="/privacy" className="text-orange-500 hover:underline">
                Politique de confidentialité
              </Link>.
            </p>
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <p className="text-sm">
                <strong>Délégué à la Protection des Données (DPO) :</strong><br />
                Email : dpo@globehub.app<br />
                Adresse : GlobeHub SAS - DPO, 123 Avenue des Champs-Élysées, 75008 Paris
              </p>
            </div>
          </div>
        </section>

        {/* Cookies */}
        <section className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
            6. Cookies
          </h2>
          <div className="text-neutral-700 dark:text-neutral-300 space-y-4">
            <p>
              Le site GlobeHub utilise des cookies pour améliorer l&apos;expérience utilisateur,
              analyser le trafic et personnaliser le contenu. Lors de votre première visite,
              un bandeau vous informe de l&apos;utilisation des cookies et vous permet de les
              accepter ou de les refuser.
            </p>
            <p>
              Vous pouvez à tout moment modifier vos préférences de cookies dans les
              paramètres de votre compte ou en cliquant sur le lien &quot;Gérer les cookies&quot;
              en bas de page.
            </p>
          </div>
        </section>

        {/* DSA - Digital Services Act */}
        <section className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
            7. Conformité au Digital Services Act (DSA)
          </h2>
          <div className="text-neutral-700 dark:text-neutral-300 space-y-4">
            <p>
              Conformément au Règlement (UE) 2022/2065 relatif aux services numériques
              (Digital Services Act), GlobeHub met en place les mesures suivantes :
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Point de contact unique :</strong> dsa@globehub.app pour les
                communications avec les autorités et les utilisateurs
              </li>
              <li>
                <strong>Représentant légal dans l&apos;UE :</strong> GlobeHub SAS,
                123 Avenue des Champs-Élysées, 75008 Paris
              </li>
              <li>
                <strong>Signalement de contenus illicites :</strong> système de signalement
                accessible depuis chaque contenu publié sur la plateforme
              </li>
              <li>
                <strong>Procédure d&apos;appel :</strong> possibilité de contester une décision
                de modération via notre{' '}
                <Link href="/appeal" className="text-orange-500 hover:underline">
                  formulaire d&apos;appel
                </Link>
              </li>
              <li>
                <strong>Rapport de transparence :</strong> publication annuelle des
                statistiques de modération
              </li>
            </ul>
          </div>
        </section>

        {/* Limitation de responsabilité */}
        <section className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
            8. Limitation de responsabilité
          </h2>
          <div className="text-neutral-700 dark:text-neutral-300 space-y-4">
            <p>
              GlobeHub s&apos;efforce d&apos;assurer au mieux de ses possibilités l&apos;exactitude et
              la mise à jour des informations diffusées sur ce site. Toutefois, GlobeHub
              ne peut garantir l&apos;exactitude, la précision ou l&apos;exhaustivité des
              informations mises à disposition sur ce site.
            </p>
            <p>
              En conséquence, GlobeHub décline toute responsabilité pour toute imprécision,
              inexactitude ou omission portant sur des informations disponibles sur ce site.
            </p>
          </div>
        </section>

        {/* Droit applicable */}
        <section className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
            9. Droit applicable et juridiction compétente
          </h2>
          <div className="text-neutral-700 dark:text-neutral-300 space-y-4">
            <p>
              Les présentes mentions légales sont régies par le droit français. En cas de
              litige, les tribunaux français seront seuls compétents.
            </p>
          </div>
        </section>

        {/* Date de mise à jour */}
        <div className="text-center text-neutral-500 dark:text-neutral-400 text-sm py-4">
          Dernière mise à jour : 4 février 2025
        </div>
      </main>
    </div>
  );
}
