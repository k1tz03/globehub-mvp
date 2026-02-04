"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/useAuthStore";

const GEMINI_PROMPT = `# 🎨 CRÉATION DE FOND ANIMÉ POUR APPLICATION WEB

## CONTEXTE
Je développe une application web avec des fonds animés pour des événements spéciaux (Nouvel An, fêtes, promotions sponsorisées, etc.). Le fond doit s'afficher DERRIÈRE le contenu principal sans interférer avec l'interface utilisateur.

## CONTRAINTES TECHNIQUES
- Le conteneur parent a l'ID "animated-bg-{eventId}" et la classe "pointer-events-none fixed inset-0 z-0 overflow-hidden"
- Le fond doit être SUBTIL et ne pas gêner la lecture
- Utiliser des animations CSS performantes (transform, opacity)
- Le JavaScript reçoit une variable "container" (l'élément parent) et "event" (les données de l'événement)
- Le JS doit retourner une fonction de cleanup pour nettoyer les éléments créés

## CE QUE JE VEUX
[DÉCRIVEZ ICI LE THÈME SOUHAITÉ]
Exemple: "Un fond pour la Saint-Patrick avec des trèfles verts qui flottent doucement, des pièces d'or qui scintillent, et un léger gradient vert"

## FORMAT DE RÉPONSE ATTENDU
Répondez avec exactement 3 blocs de code séparés :

### 1. CSS (à coller dans le champ "CSS personnalisé")
\`\`\`css
/* Styles pour les particules et animations */
.particle-class {
  position: absolute;
  /* ... */
  animation: nomAnimation 3s ease-in-out infinite;
}

@keyframes nomAnimation {
  0%, 100% { /* état initial et final */ }
  50% { /* état intermédiaire */ }
}
\`\`\`

### 2. JavaScript (à coller dans le champ "JavaScript personnalisé")
\`\`\`javascript
// Créer les éléments
const particles = [];
for (let i = 0; i < 30; i++) {
  const el = document.createElement('div');
  el.className = 'particle-class';
  el.style.left = Math.random() * 100 + '%';
  el.style.top = Math.random() * 100 + '%';
  el.style.animationDelay = Math.random() * 3 + 's';
  container.appendChild(el);
  particles.push(el);
}

// IMPORTANT: Retourner une fonction de cleanup
return () => {
  particles.forEach(el => el.remove());
};
\`\`\`

### 3. HTML optionnel (à coller dans le champ "HTML personnalisé")
\`\`\`html
<div class="text-element">Texte décoratif</div>
\`\`\`

## EXEMPLES DE THÈMES
- Nouvel An: Feux d'artifice, confettis, "2026" lumineux
- Nouvel An Chinois: Lanternes rouges, dragons, caractère 福, pétards
- Noël: Flocons de neige, guirlandes lumineuses, étoile
- Halloween: Citrouilles, fantômes, chauves-souris, lune
- Saint-Valentin: Cœurs flottants, roses, couleurs rose/rouge
- Printemps: Fleurs de cerisier, papillons, vert pastel
- Été: Soleil, palmiers, vagues, couleurs chaudes
- Sponsoring: Subtil, étoiles scintillantes, logo discret

## RÈGLES IMPORTANTES
1. Utiliser des emojis ou des formes CSS simples (pas d'images externes)
2. Maximum 50 particules pour les performances
3. Opacité des éléments entre 0.3 et 0.8 pour rester subtil
4. Vitesse d'animation entre 2s et 8s (pas trop rapide)
5. Utiliser will-change: transform pour optimiser
6. Le cleanup doit supprimer TOUS les éléments créés`;

export default function BackgroundsReadmePage() {
  const router = useRouter();
  const { isAdmin } = useAuthStore();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(GEMINI_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100 dark:bg-neutral-950">
        <div className="rounded-2xl bg-white p-8 text-center shadow-xl dark:bg-neutral-900">
          <div className="text-5xl">🔒</div>
          <h1 className="mt-4 text-xl font-bold">Accès administrateur requis</h1>
          <button onClick={() => router.push("/")} className="mt-4 rounded-xl bg-fuchsia-500 px-6 py-3 text-sm font-medium text-white">
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/admin/backgrounds")} className="rounded-xl p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-xl font-bold">📖 Guide de création de fonds animés</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="space-y-8">
          {/* Introduction */}
          <div className="rounded-2xl bg-gradient-to-r from-fuchsia-500 to-amber-500 p-8 text-white">
            <h2 className="text-2xl font-bold">🎨 Créer un fond animé avec Gemini AI</h2>
            <p className="mt-2 text-white/80">
              Utilisez ce prompt avec Gemini (ou Claude, ChatGPT) pour générer automatiquement le code CSS et JavaScript 
              de vos fonds animés personnalisés.
            </p>
          </div>

          {/* Étapes */}
          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
            <h3 className="text-lg font-bold">📋 Comment utiliser ce prompt</h3>
            <ol className="mt-4 space-y-4">
              <li className="flex gap-4">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-fuchsia-100 text-sm font-bold text-fuchsia-700">1</span>
                <div>
                  <p className="font-medium">Copiez le prompt ci-dessous</p>
                  <p className="text-sm text-neutral-500">Cliquez sur le bouton "Copier" pour copier tout le prompt</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-fuchsia-100 text-sm font-bold text-fuchsia-700">2</span>
                <div>
                  <p className="font-medium">Collez-le dans Gemini (ou un autre LLM)</p>
                  <p className="text-sm text-neutral-500">Allez sur <a href="https://gemini.google.com" target="_blank" rel="noopener" className="text-fuchsia-500 underline">gemini.google.com</a></p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-fuchsia-100 text-sm font-bold text-fuchsia-700">3</span>
                <div>
                  <p className="font-medium">Décrivez votre thème</p>
                  <p className="text-sm text-neutral-500">Remplacez [DÉCRIVEZ ICI LE THÈME SOUHAITÉ] par votre description</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-fuchsia-100 text-sm font-bold text-fuchsia-700">4</span>
                <div>
                  <p className="font-medium">Copiez les blocs de code générés</p>
                  <p className="text-sm text-neutral-500">Vous recevrez 3 blocs: CSS, JavaScript et HTML (optionnel)</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-fuchsia-100 text-sm font-bold text-fuchsia-700">5</span>
                <div>
                  <p className="font-medium">Collez dans l&apos;administration</p>
                  <p className="text-sm text-neutral-500">Créez un nouvel événement de type &quot;Personnalisé&quot; et collez chaque bloc dans le champ correspondant</p>
                </div>
              </li>
            </ol>
          </div>

          {/* Prompt */}
          <div className="rounded-2xl bg-white shadow-sm dark:bg-neutral-900">
            <div className="flex items-center justify-between border-b border-neutral-100 p-4 dark:border-neutral-800">
              <h3 className="font-bold">🤖 Prompt pour Gemini</h3>
              <button
                onClick={handleCopy}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  copied 
                    ? "bg-emerald-100 text-emerald-700" 
                    : "bg-fuchsia-100 text-fuchsia-700 hover:bg-fuchsia-200"
                }`}
              >
                {copied ? "✅ Copié !" : "📋 Copier le prompt"}
              </button>
            </div>
            <div className="max-h-[500px] overflow-y-auto p-4">
              <pre className="whitespace-pre-wrap rounded-xl bg-neutral-900 p-4 text-sm text-neutral-300 dark:bg-neutral-800">
                {GEMINI_PROMPT}
              </pre>
            </div>
          </div>

          {/* Exemples */}
          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
            <h3 className="text-lg font-bold">💡 Exemples de descriptions</h3>
            <div className="mt-4 space-y-3">
              {[
                {
                  theme: "🧧 Nouvel An Chinois",
                  desc: "Un fond pour le Nouvel An Chinois avec des lanternes rouges qui se balancent doucement en haut de l'écran, des enveloppes rouges (hongbao) qui flottent, des pièces d'or qui scintillent, et le caractère 福 (bonheur) inversé qui brille au centre. Couleurs dominantes: rouge et or."
                },
                {
                  theme: "🎆 Nouvel An",
                  desc: "Un fond festif pour le réveillon avec des feux d'artifice qui explosent à différents endroits de l'écran, des confettis multicolores qui tombent, et l'année 2026 qui clignote au centre. Utiliser des couleurs vives: or, rose, cyan, violet."
                },
                {
                  theme: "☘️ Saint-Patrick",
                  desc: "Un fond pour la Saint-Patrick avec des trèfles à 4 feuilles verts qui flottent doucement, un arc-en-ciel subtil en arrière-plan, des pièces d'or qui tombent occasionnellement, et un léger effet de brume verte en bas. Couleurs: vert émeraude, or."
                },
                {
                  theme: "🌸 Printemps japonais",
                  desc: "Un fond zen avec des pétales de cerisier roses qui tombent en spirale, des papillons blancs qui volent lentement, et un gradient doux du rose clair au blanc. Mouvement très lent et apaisant."
                },
                {
                  theme: "💰 Promotion Black Friday",
                  desc: "Un fond promotionnel subtil avec des étoiles dorées qui scintillent, des pourcentages de réduction (-50%, -30%) qui flottent et disparaissent, couleurs noir et or. Très discret pour ne pas distraire."
                },
              ].map((ex, i) => (
                <div key={i} className="rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800">
                  <p className="font-medium">{ex.theme}</p>
                  <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">&quot;{ex.desc}&quot;</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950/30">
            <h3 className="text-lg font-bold text-amber-700">⚠️ Conseils importants</h3>
            <ul className="mt-4 space-y-2 text-sm text-amber-800 dark:text-amber-200">
              <li>• <strong>Testez toujours</strong> votre fond avant de l&apos;activer en production</li>
              <li>• <strong>Limitez le nombre de particules</strong> (max 50) pour éviter les problèmes de performance</li>
              <li>• <strong>Gardez les animations subtiles</strong> - l&apos;utilisateur doit pouvoir lire le contenu</li>
              <li>• <strong>Évitez les couleurs trop vives</strong> qui pourraient gêner la lecture</li>
              <li>• <strong>Le cleanup est obligatoire</strong> - toujours retourner une fonction qui supprime les éléments créés</li>
              <li>• <strong>Définissez des dates précises</strong> - un fond de Noël ne doit pas s&apos;afficher en mars !</li>
            </ul>
          </div>

          {/* Back button */}
          <div className="flex justify-center">
            <button
              onClick={() => router.push("/admin/backgrounds")}
              className="rounded-xl bg-fuchsia-500 px-8 py-3 text-sm font-medium text-white hover:bg-fuchsia-600"
            >
              ← Retour à la gestion des fonds
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
