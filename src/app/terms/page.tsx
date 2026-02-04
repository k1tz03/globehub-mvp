import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Conditions d'Utilisation",
  description: "Conditions générales d'utilisation de GlobeHub - Les règles et engagements pour utiliser notre réseau social géolocalisé.",
  openGraph: {
    title: "Conditions d'Utilisation | GlobeHub",
    description: "Découvrez les conditions d'utilisation de GlobeHub, le réseau social géolocalisé.",
  },
};

export default function TermsPage() {
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
          <h1 className="text-xl font-bold">Conditions d'Utilisation</h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <p className="text-sm text-neutral-500">Dernière mise à jour : {lastUpdate}</p>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">1. Acceptation des Conditions</h2>
            <p>
              En utilisant GlobeHub, vous acceptez ces conditions d'utilisation. Si vous n'êtes pas d'accord 
              avec ces conditions, veuillez ne pas utiliser notre service.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">2. Description du Service</h2>
            <p>
              GlobeHub est un réseau social géolocalisé permettant de partager des contenus positionnés 
              sur un globe 3D interactif. Nos services incluent :
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Publication de posts géolocalisés</li>
              <li>Création et participation à des groupes</li>
              <li>Messagerie entre utilisateurs</li>
              <li>Visualisation sur carte interactive</li>
              <li>Fonctionnalités sociales (likes, commentaires, partages)</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">3. Inscription et Compte</h2>
            
            <h3 className="mt-4 text-lg font-semibold">3.1 Éligibilité</h3>
            <p>
              Vous devez avoir au moins 13 ans pour créer un compte. Si vous avez entre 13 et 18 ans, 
              vous devez avoir l'autorisation de vos parents ou tuteurs légaux.
            </p>

            <h3 className="mt-4 text-lg font-semibold">3.2 Sécurité du Compte</h3>
            <p>Vous êtes responsable de :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>La confidentialité de vos identifiants</li>
              <li>Toutes les activités sur votre compte</li>
              <li>Signaler immédiatement tout accès non autorisé</li>
            </ul>

            <h3 className="mt-4 text-lg font-semibold">3.3 Informations Exactes</h3>
            <p>
              Vous vous engagez à fournir des informations exactes et à les maintenir à jour. 
              L'usurpation d'identité est strictement interdite.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">4. Règles de Conduite</h2>
            
            <h3 className="mt-4 text-lg font-semibold">4.1 Contenu Interdit</h3>
            <p>Il est interdit de publier du contenu :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Illégal, diffamatoire ou menaçant</li>
              <li>Incitant à la haine, la violence ou la discrimination</li>
              <li>Pornographique ou sexuellement explicite</li>
              <li>Violant les droits d'auteur ou de propriété intellectuelle</li>
              <li>Contenant des virus ou codes malveillants</li>
              <li>Spam, publicité non autorisée ou arnaques</li>
              <li>Révélant des informations personnelles sans consentement</li>
            </ul>

            <h3 className="mt-4 text-lg font-semibold">4.2 Comportements Interdits</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Harcèlement ou intimidation d'autres utilisateurs</li>
              <li>Création de faux comptes ou bots</li>
              <li>Manipulation des métriques (faux likes, etc.)</li>
              <li>Contournement des mesures de sécurité</li>
              <li>Collecte non autorisée de données</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">5. Propriété Intellectuelle</h2>
            
            <h3 className="mt-4 text-lg font-semibold">5.1 Votre Contenu</h3>
            <p>
              Vous conservez tous les droits sur le contenu que vous publiez. En le publiant sur GlobeHub, 
              vous nous accordez une licence mondiale, non-exclusive, gratuite pour utiliser, reproduire, 
              modifier et afficher ce contenu dans le cadre du service.
            </p>

            <h3 className="mt-4 text-lg font-semibold">5.2 Notre Contenu</h3>
            <p>
              GlobeHub et son contenu (logo, design, code) sont protégés par les lois sur la propriété 
              intellectuelle. Toute reproduction non autorisée est interdite.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">6. Modération</h2>
            <p>Nous nous réservons le droit de :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Supprimer tout contenu violant ces conditions</li>
              <li>Suspendre ou supprimer des comptes</li>
              <li>Signaler aux autorités tout contenu illégal</li>
              <li>Utiliser des systèmes automatisés de détection</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">7. Limitation de Responsabilité</h2>
            <p>
              GlobeHub est fourni "tel quel". Nous ne garantissons pas que le service sera ininterrompu 
              ou exempt d'erreurs. Dans la mesure permise par la loi, nous déclinons toute responsabilité 
              pour les dommages indirects résultant de l'utilisation du service.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">8. Résiliation</h2>
            <p>
              Vous pouvez supprimer votre compte à tout moment depuis les paramètres. 
              Nous pouvons également suspendre ou supprimer votre compte en cas de violation 
              de ces conditions, avec ou sans préavis.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">9. Modifications</h2>
            <p>
              Nous pouvons modifier ces conditions à tout moment. Les modifications importantes 
              vous seront notifiées. L'utilisation continue du service après notification 
              vaut acceptation des nouvelles conditions.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">10. Droit Applicable</h2>
            <p>
              Ces conditions sont régies par le droit français. Tout litige sera soumis 
              aux tribunaux compétents de Paris, France.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">11. Contact</h2>
            <p>Pour toute question concernant ces conditions :</p>
            <ul className="list-none space-y-2 mt-4">
              <li>📧 Email : <a href="mailto:legal@globehub.app" className="text-fuchsia-600">legal@globehub.app</a></li>
              <li>📍 Adresse : GlobeHub SAS, 123 Avenue de la Tech, 75001 Paris, France</li>
            </ul>
          </section>
        </div>

        {/* Navigation */}
        <div className="mt-12 flex flex-wrap gap-4 border-t border-neutral-200 pt-8 dark:border-neutral-800">
          <Link href="/privacy" className="text-fuchsia-600 hover:underline">
            Politique de confidentialité →
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
