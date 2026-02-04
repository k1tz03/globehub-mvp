import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "À Propos de GlobeHub",
  description: "Découvrez GlobeHub, le premier réseau social géolocalisé sur globe 3D. Notre mission, notre équipe et notre vision pour connecter le monde.",
  openGraph: {
    title: "À Propos | GlobeHub",
    description: "Découvrez l'histoire et la mission de GlobeHub, le réseau social qui connecte le monde sur un globe 3D.",
  },
};

export default function AboutPage() {
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
          <h1 className="text-xl font-bold">À Propos</h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Hero */}
        <div className="text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-500 via-fuchsia-500 to-amber-500 text-4xl shadow-lg shadow-fuchsia-500/30">
            🌍
          </div>
          <h2 className="mt-6 text-4xl font-bold bg-gradient-to-r from-fuchsia-600 via-sky-500 to-amber-500 bg-clip-text text-transparent">
            GlobeHub
          </h2>
          <p className="mt-2 text-xl text-neutral-600 dark:text-neutral-400">
            Le monde à portée de clic
          </p>
        </div>

        {/* Mission */}
        <section className="mt-16">
          <h3 className="text-2xl font-bold">Notre Mission</h3>
          <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400">
            GlobeHub réinvente le réseau social en plaçant la <strong>géolocalisation</strong> au cœur 
            de l'expérience. Notre mission est de créer un espace où chaque moment partagé trouve 
            sa place sur le globe, permettant aux utilisateurs de découvrir le monde à travers 
            les yeux des autres.
          </p>
          <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400">
            Nous croyons que les meilleures histoires sont ancrées dans un lieu. Que ce soit un 
            coucher de soleil à Santorin, un concert à Paris ou un café à Tokyo, chaque post 
            sur GlobeHub raconte une histoire géographique.
          </p>
        </section>

        {/* Fonctionnalités */}
        <section className="mt-16">
          <h3 className="text-2xl font-bold">Nos Fonctionnalités</h3>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {[
              {
                icon: "🌍",
                title: "Globe 3D Interactif",
                desc: "Explorez le monde en temps réel sur un magnifique globe 3D. Zoomez, tournez, découvrez.",
              },
              {
                icon: "📍",
                title: "Posts Géolocalisés",
                desc: "Chaque post est ancré à un lieu. Partagez vos découvertes et explorez celles des autres.",
              },
              {
                icon: "👥",
                title: "Groupes Communautaires",
                desc: "Créez et rejoignez des groupes basés sur vos passions et votre localisation.",
              },
              {
                icon: "💬",
                title: "Messagerie Sécurisée",
                desc: "Communiquez en privé avec vos amis. Vos conversations sont protégées.",
              },
              {
                icon: "🔥",
                title: "Feed Personnalisé",
                desc: "Notre algorithme apprend vos intérêts pour vous proposer du contenu pertinent.",
              },
              {
                icon: "🛡️",
                title: "Sécurité Renforcée",
                desc: "Chiffrement des données, modération automatique et protection de votre vie privée.",
              },
            ].map((feature) => (
              <div key={feature.title} className="rounded-2xl bg-neutral-50 p-6 dark:bg-neutral-900">
                <span className="text-3xl">{feature.icon}</span>
                <h4 className="mt-3 text-lg font-bold">{feature.title}</h4>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Valeurs */}
        <section className="mt-16">
          <h3 className="text-2xl font-bold">Nos Valeurs</h3>
          <div className="mt-8 space-y-6">
            {[
              {
                title: "🔐 Vie Privée",
                desc: "Vos données vous appartiennent. Nous ne vendons jamais vos informations et minimisons la collecte au strict nécessaire.",
              },
              {
                title: "🌱 Communauté Bienveillante",
                desc: "Nous cultivons un espace positif où le respect et la bienveillance sont les maîtres mots.",
              },
              {
                title: "🚀 Innovation",
                desc: "Nous repoussons les limites de ce qu'un réseau social peut être, en intégrant les dernières technologies.",
              },
              {
                title: "🌍 Accessibilité",
                desc: "GlobeHub est conçu pour être accessible à tous, quels que soient l'appareil ou les capacités.",
              },
            ].map((value) => (
              <div key={value.title} className="flex gap-4">
                <div className="flex-shrink-0 text-2xl">{value.title.split(" ")[0]}</div>
                <div>
                  <h4 className="font-bold">{value.title.split(" ").slice(1).join(" ")}</h4>
                  <p className="mt-1 text-neutral-600 dark:text-neutral-400">{value.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="mt-16">
          <h3 className="text-2xl font-bold">GlobeHub en Chiffres</h3>
          <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { value: "50K+", label: "Utilisateurs" },
              { value: "1M+", label: "Posts partagés" },
              { value: "195", label: "Pays représentés" },
              { value: "99.9%", label: "Disponibilité" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold bg-gradient-to-r from-fuchsia-600 to-amber-500 bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-neutral-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Équipe */}
        <section className="mt-16">
          <h3 className="text-2xl font-bold">L'Équipe</h3>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400">
            GlobeHub a été créé par une équipe passionnée de développeurs, designers et visionnaires 
            qui croient en un Internet plus humain et connecté. Basés à Paris, nous travaillons 
            chaque jour pour améliorer votre expérience.
          </p>
        </section>

        {/* Contact */}
        <section className="mt-16">
          <h3 className="text-2xl font-bold">Nous Contacter</h3>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <a 
              href="mailto:contact@globehub.app" 
              className="flex items-center gap-3 rounded-xl bg-neutral-50 p-4 hover:bg-neutral-100 dark:bg-neutral-900 dark:hover:bg-neutral-800"
            >
              <span className="text-2xl">📧</span>
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-fuchsia-600">contact@globehub.app</p>
              </div>
            </a>
            <a 
              href="https://twitter.com/globehub" 
              className="flex items-center gap-3 rounded-xl bg-neutral-50 p-4 hover:bg-neutral-100 dark:bg-neutral-900 dark:hover:bg-neutral-800"
            >
              <span className="text-2xl">🐦</span>
              <div>
                <p className="font-medium">Twitter</p>
                <p className="text-sm text-fuchsia-600">@globehub</p>
              </div>
            </a>
          </div>
        </section>

        {/* Navigation */}
        <div className="mt-12 flex flex-wrap gap-4 border-t border-neutral-200 pt-8 dark:border-neutral-800">
          <Link href="/privacy" className="text-fuchsia-600 hover:underline">
            Politique de confidentialité →
          </Link>
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
