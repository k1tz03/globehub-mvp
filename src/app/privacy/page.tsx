import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politique de Confidentialité",
  description: "Politique de confidentialité de GlobeHub - Découvrez comment nous protégeons vos données personnelles et respectons votre vie privée.",
  openGraph: {
    title: "Politique de Confidentialité | GlobeHub",
    description: "Découvrez comment GlobeHub protège vos données personnelles et respecte votre vie privée.",
  },
};

export default function PrivacyPage() {
  const lastUpdate = "1er février 2025";
  
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/90 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-900/90">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-4">
          <Link href="/" className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold">Politique de Confidentialité</h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <p className="text-sm text-neutral-500">Dernière mise à jour : {lastUpdate}</p>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">1. Introduction</h2>
            <p>
              Bienvenue sur GlobeHub. Nous prenons la protection de vos données personnelles très au sérieux. 
              Cette politique de confidentialité explique comment nous collectons, utilisons, partageons et 
              protégeons vos informations lorsque vous utilisez notre plateforme.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">2. Données Collectées</h2>
            
            <h3 className="mt-4 text-lg font-semibold">2.1 Données que vous nous fournissez</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Informations de compte</strong> : nom d'utilisateur, adresse email, mot de passe (hashé)</li>
              <li><strong>Informations de profil</strong> : photo, biographie, localisation affichée</li>
              <li><strong>Contenu</strong> : posts, commentaires, messages, photos partagées</li>
              <li><strong>Préférences</strong> : centres d'intérêt, paramètres de l'application</li>
            </ul>

            <h3 className="mt-4 text-lg font-semibold">2.2 Données collectées automatiquement</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Données de géolocalisation</strong> : position GPS (uniquement avec votre consentement)</li>
              <li><strong>Données d'utilisation</strong> : interactions, temps passé, fonctionnalités utilisées</li>
              <li><strong>Données techniques</strong> : type d'appareil, système d'exploitation, navigateur</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">3. Utilisation des Données</h2>
            <p>Nous utilisons vos données pour :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Fournir et améliorer nos services</li>
              <li>Personnaliser votre expérience (recommandations, feed "Pour Toi")</li>
              <li>Assurer la sécurité de la plateforme</li>
              <li>Communiquer avec vous (notifications, mises à jour)</li>
              <li>Respecter nos obligations légales</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">4. Sécurité des Données</h2>
            <p>Nous mettons en œuvre des mesures de sécurité robustes :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Chiffrement</strong> : vos mots de passe sont hashés avec PBKDF2-SHA256</li>
              <li><strong>HTTPS</strong> : toutes les communications sont chiffrées</li>
              <li><strong>Protection XSS/CSRF</strong> : filtrage et tokens de sécurité</li>
              <li><strong>Rate limiting</strong> : protection contre les attaques par force brute</li>
              <li><strong>Audits réguliers</strong> : surveillance continue de la sécurité</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">5. Partage des Données</h2>
            <p>Nous ne vendons jamais vos données personnelles. Nous pouvons les partager uniquement :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Avec votre consentement explicite</li>
              <li>Pour respecter des obligations légales</li>
              <li>Avec des prestataires de services (sous contrat de confidentialité)</li>
              <li>En cas de fusion ou acquisition (avec notification préalable)</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">6. Vos Droits (RGPD)</h2>
            <p>Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Accès</strong> : obtenir une copie de vos données</li>
              <li><strong>Rectification</strong> : corriger vos données inexactes</li>
              <li><strong>Suppression</strong> : demander l'effacement de vos données</li>
              <li><strong>Portabilité</strong> : recevoir vos données dans un format standard</li>
              <li><strong>Opposition</strong> : vous opposer à certains traitements</li>
              <li><strong>Limitation</strong> : limiter le traitement de vos données</li>
            </ul>
            <p className="mt-4">
              Pour exercer ces droits, contactez-nous à : <strong>privacy@globehub.app</strong>
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">7. Conservation des Données</h2>
            <p>
              Nous conservons vos données aussi longtemps que votre compte est actif. 
              Après suppression de votre compte, vos données sont supprimées sous 30 jours, 
              sauf obligation légale de conservation plus longue.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">8. Cookies</h2>
            <p>Nous utilisons des cookies pour :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Cookies essentiels</strong> : authentification, sécurité</li>
              <li><strong>Cookies de préférences</strong> : langue, thème</li>
              <li><strong>Cookies d'analyse</strong> : amélioration de nos services (anonymisés)</li>
            </ul>
            <p className="mt-4">
              Vous pouvez gérer vos préférences de cookies dans les paramètres de votre navigateur.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">9. Modifications</h2>
            <p>
              Nous pouvons mettre à jour cette politique. En cas de modification significative, 
              nous vous en informerons par notification dans l'application ou par email.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">10. Contact</h2>
            <p>Pour toute question concernant cette politique :</p>
            <ul className="list-none space-y-2 mt-4">
              <li>📧 Email : <a href="mailto:privacy@globehub.app" className="text-fuchsia-600">privacy@globehub.app</a></li>
              <li>📍 Adresse : GlobeHub SAS, 123 Avenue de la Tech, 75001 Paris, France</li>
              <li>🔐 DPO : dpo@globehub.app</li>
            </ul>
          </section>
        </div>

        {/* Navigation */}
        <div className="mt-12 flex flex-wrap gap-4 border-t border-neutral-200 pt-8 dark:border-neutral-800">
          <Link href="/terms" className="text-fuchsia-600 hover:underline">
            Conditions d'utilisation →
          </Link>
          <Link href="/help" className="text-fuchsia-600 hover:underline">
            Centre d'aide →
          </Link>
          <Link href="/" className="text-fuchsia-600 hover:underline">
            Retour à l'accueil →
          </Link>
        </div>
      </main>
    </div>
  );
}
