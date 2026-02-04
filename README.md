# GlobeHub — MVP v0.3.0 (Design unique)

## Objectif
Sortir du “X + map” en donnant une **signature**:
- Les posts deviennent des **signaux** (catégorie + intégrité + lieu flouté)
- Sur la carte: **Pulse** (ondes animées) + **couches** (heatmap / trails)
- Un **filtre temps** (Live / 1h / 24h / 7j) pour lire la planète comme un “radar”

## Nouveautés v0.3.0
- **Catégories** : Vibe / News / Event / Alert (couleurs cohérentes)
- **Signal d’intégrité** : fort / moyen / aucun (visible dans flux + post)
- **Pulse (signature)** : couche animée autour des bulles (activable)
- **Heatmap** : densité des posts (activable)
- **Trails** : traces récentes par auteur (activable)
- **Filtre temps** (desktop) : Live / 1h / 24h / 7j

## Mise en ligne (sans coder)
1) GitHub → repo `globehub-mvp`
2) Upload tout le contenu du zip (décompressé) via **Add file → Upload files**
3) Commit changes → Vercel rebuild

## Test rapide
- Clique une bulle: ouvre le post
- Bouton **Couches** (barre gauche): active Pulse / Heatmap / Trails
- Bouton **+**: crée un “signal” (catégorie + géoloc on/off)
- Bouton **Flux**: liste des signaux + focus map
- Switch **Globe/Carte** + **Sombre/Clair**: stable (console clean)


## v0.3.1 (hotfix build)
- Fix TypeScript MapLibre expressions (cast to ExpressionSpecification) pour éviter l'erreur `DataDrivenPropertyValueSpecification` lors du build Vercel.


## v0.3.2
- Pulse: anneau (stroke) beaucoup plus visible + animation (radius/opacity/stroke-width).
- Filtres: ajout de labels courts (Tout/Trend/Near/Abos/Ads) pour comprendre le code couleur.


## v0.3.2.1 (hotfix)
- Fix compilation LeftRail: ajout du champ `short` (labels courts) + fallback.


## v0.3.2.2 (hotfix)
- Fix TypeScript LeftRail: type `modes` inclut `short` + labels courts stables.


## v0.3.3
- Filtres latéraux : icônes colorées (tooltips) à la place des labels.
- Halo beaucoup plus discret + pulse en cœurs (uniquement signal fort) pour éviter la pollution visuelle.


## v0.3.3.1 (hotfix)
- Fix build: prop `follows` passée au composant GlobeMap (fallback []).


## v0.3.3.2 (hotfix)
- Fix build: prop `follows` devient optionnelle (fallback []).


## v0.3.3.3 (build-stability hotfix)
- Fix exports in mapStyle: ajoute `strokeColorExpr`, `strokeWidthExpr`, `trailsColorExpr` + compat.
- `buildTrailsGeoJSON` accepte `follows` (fallback []).


## v0.3.3.4 (hotfix)
- Fix build Vercel/TypeScript: `map.addImage` utilise `ImageData` (plus de mismatch HTMLCanvasElement).
