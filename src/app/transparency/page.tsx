'use client';

import Link from 'next/link';

// Inline SVG icons
const IconArrowLeft = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const IconBrain = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.54" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.54" />
  </svg>
);

const IconEye = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconShuffle = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 3 21 3 21 8" />
    <line x1="4" y1="20" x2="21" y2="3" />
    <polyline points="21 16 21 21 16 21" />
    <line x1="15" y1="15" x2="21" y2="21" />
    <line x1="4" y1="4" x2="9" y2="9" />
  </svg>
);

const IconTrendUp = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const IconUsers = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconClock = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconMapPin = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const IconHeart = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const IconInfo = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const IconExternalLink = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

export default function TransparencyPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <header className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-fuchsia-500 transition-colors mb-4"
          >
            <IconArrowLeft className="w-4 h-4" />
            Retour à l&apos;accueil
          </Link>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white flex items-center gap-3">
            <IconBrain className="w-8 h-8 text-fuchsia-500" />
            Transparence algorithmique
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-2">
            Conformément au Digital Services Act (DSA), nous vous expliquons comment
            fonctionnent nos systèmes de recommandation.
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Introduction */}
        <section className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
            Comment fonctionne notre système de recommandation ?
          </h2>
          <p className="text-neutral-700 dark:text-neutral-300 mb-4">
            GlobeHub utilise des algorithmes pour vous proposer des contenus susceptibles
            de vous intéresser. Cette page vous explique de manière transparente les critères
            utilisés et comment vous pouvez influencer ces recommandations.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <IconInfo className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Votre droit selon le DSA :</strong> Vous avez le droit de comprendre
                pourquoi certains contenus vous sont recommandés et de modifier vos préférences
                à tout moment.
              </p>
            </div>
          </div>
        </section>

        {/* Critères de classement */}
        <section className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
            <IconShuffle className="w-5 h-5 text-fuchsia-500" />
            Critères de classement des contenus
          </h2>
          <p className="text-neutral-700 dark:text-neutral-300 mb-6">
            Voici les principaux facteurs qui influencent l&apos;ordre d&apos;affichage des posts :
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg">
              <div className="p-2 bg-fuchsia-100 dark:bg-fuchsia-900/30 rounded-lg">
                <IconMapPin className="w-5 h-5 text-fuchsia-500" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-white">
                  Proximité géographique (30%)
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  Les posts proches de votre localisation sont privilégiés.
                  Vous pouvez modifier votre zone de visibilité dans vos paramètres.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <IconHeart className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-white">
                  Centres d&apos;intérêt (25%)
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  Basé sur les catégories que vous avez sélectionnées et les posts
                  que vous avez aimés ou avec lesquels vous avez interagi.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <IconClock className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-white">
                  Fraîcheur du contenu (20%)
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  Les posts récents sont mis en avant. Les contenus plus anciens
                  perdent progressivement en visibilité.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <IconTrendUp className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-white">
                  Popularité (15%)
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  Nombre de likes, commentaires et partages. Les posts
                  populaires auprès d&apos;utilisateurs similaires sont légèrement favorisés.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <IconUsers className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-white">
                  Réseau social (10%)
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  Les posts des personnes que vous suivez ou de vos amis
                  peuvent être mis en avant.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Ce que nous n'utilisons PAS */}
        <section className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
            <IconEye className="w-5 h-5 text-fuchsia-500" />
            Ce que nous n&apos;utilisons PAS
          </h2>
          <p className="text-neutral-700 dark:text-neutral-300 mb-4">
            Pour respecter votre vie privée, les critères suivants ne sont <strong>jamais</strong> utilisés :
          </p>
          <ul className="list-disc list-inside space-y-2 text-neutral-700 dark:text-neutral-300">
            <li>Vos données de santé ou données sensibles</li>
            <li>Vos opinions politiques ou religieuses</li>
            <li>Votre orientation sexuelle</li>
            <li>Vos revenus ou situation financière</li>
            <li>Votre historique de navigation en dehors de GlobeHub</li>
            <li>Des données achetées à des tiers</li>
          </ul>
        </section>

        {/* Contenu sponsorisé */}
        <section className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
            Contenu sponsorisé et publicité
          </h2>
          <p className="text-neutral-700 dark:text-neutral-300 mb-4">
            Certains contenus peuvent être mis en avant moyennant paiement.
            Ces contenus sont <strong>toujours clairement identifiés</strong> par la mention
            &quot;Sponsorisé&quot; ou &quot;Publicité&quot;.
          </p>
          <div className="bg-fuchsia-50 dark:bg-fuchsia-900/20 border border-fuchsia-200 dark:border-fuchsia-800 rounded-lg p-4">
            <p className="text-sm text-fuchsia-800 dark:text-fuchsia-200">
              <strong>Important :</strong> Le contenu sponsorisé représente au maximum 10%
              des posts affichés sur votre fil. Vous pouvez réduire leur visibilité
              dans vos paramètres de compte.
            </p>
          </div>
        </section>

        {/* Contrôler vos recommandations */}
        <section className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
            Comment contrôler vos recommandations ?
          </h2>
          <p className="text-neutral-700 dark:text-neutral-300 mb-4">
            Vous avez plusieurs moyens d&apos;influencer les recommandations :
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg">
              <span className="w-8 h-8 flex items-center justify-center bg-fuchsia-500 text-white rounded-full text-sm font-bold">1</span>
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">Modifier vos centres d&apos;intérêt</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Dans Paramètres &gt; Intérêts, sélectionnez les catégories qui vous intéressent.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg">
              <span className="w-8 h-8 flex items-center justify-center bg-fuchsia-500 text-white rounded-full text-sm font-bold">2</span>
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">Masquer un post</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Cliquez sur &quot;Pas intéressé&quot; pour ne plus voir des posts similaires.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg">
              <span className="w-8 h-8 flex items-center justify-center bg-fuchsia-500 text-white rounded-full text-sm font-bold">3</span>
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">Désactiver la personnalisation</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Dans Paramètres &gt; Confidentialité, vous pouvez désactiver la personnalisation
                  pour voir un flux chronologique non personnalisé.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg">
              <span className="w-8 h-8 flex items-center justify-center bg-fuchsia-500 text-white rounded-full text-sm font-bold">4</span>
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">Réinitialiser vos recommandations</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Effacez votre historique de recommandations pour repartir de zéro.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Modération automatique */}
        <section className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
            Modération automatique
          </h2>
          <p className="text-neutral-700 dark:text-neutral-300 mb-4">
            Nous utilisons des outils automatisés pour détecter les contenus qui enfreignent
            nos règles communautaires. Voici comment cela fonctionne :
          </p>

          <ul className="list-disc list-inside space-y-2 text-neutral-700 dark:text-neutral-300 mb-4">
            <li>
              <strong>Détection de spam :</strong> Filtrage automatique des contenus répétitifs
              ou promotionnels excessifs
            </li>
            <li>
              <strong>Détection de contenu inapproprié :</strong> Analyse automatique des images
              et textes pour détecter les contenus violents ou à caractère sexuel
            </li>
            <li>
              <strong>Vérification de l&apos;identité :</strong> Contrôle anti-fraude pour les
              comptes suspects
            </li>
          </ul>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>Révision humaine :</strong> Toutes les décisions de modération
              automatique sont vérifiées par un modérateur humain avant d&apos;être appliquées.
              Vous pouvez contester toute décision via notre{' '}
              <Link href="/appeal" className="underline">formulaire d&apos;appel</Link>.
            </p>
          </div>
        </section>

        {/* En savoir plus */}
        <section className="bg-gradient-to-r from-fuchsia-500 to-fuchsia-600 rounded-xl p-6 text-white">
          <h2 className="text-xl font-bold mb-4">
            Des questions sur notre algorithme ?
          </h2>
          <p className="mb-4 opacity-90">
            Notre équipe est disponible pour répondre à vos questions sur le fonctionnement
            de nos systèmes de recommandation.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="mailto:dsa@globehub.app"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-fuchsia-600 rounded-lg hover:bg-fuchsia-50 transition-colors font-medium"
            >
              Nous contacter
              <IconExternalLink className="w-4 h-4" />
            </a>
            <Link
              href="/privacy"
              className="inline-flex items-center gap-2 px-4 py-2 border border-white/30 rounded-lg hover:bg-white/10 transition-colors"
            >
              Politique de confidentialité
            </Link>
          </div>
        </section>

        {/* Date de mise à jour */}
        <div className="text-center text-neutral-500 dark:text-neutral-400 text-sm py-4">
          Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </div>
      </main>
    </div>
  );
}
