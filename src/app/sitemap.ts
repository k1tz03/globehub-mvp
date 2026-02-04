import { MetadataRoute } from "next";

// Base URL du site
const BASE_URL = "https://globehub.app";

// Pages statiques principales
const staticPages = [
  "",           // Home
  "/groups",    // Groupes
  "/messages",  // Messages
  "/settings",  // Paramètres
  "/admin",     // Administration
];

// Cette fonction génère le sitemap dynamiquement
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Date de dernière modification
  const lastModified = new Date();

  // Pages statiques
  const staticRoutes = staticPages.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified,
    changeFrequency: route === "" ? "hourly" as const : "daily" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  // En production, vous pourriez récupérer dynamiquement :
  // - Les profils utilisateurs publics
  // - Les groupes publics
  // - Les posts populaires

  // Exemple de pages dynamiques (à adapter selon votre BDD)
  const dynamicRoutes: MetadataRoute.Sitemap = [
    // Profils utilisateurs publics (exemple)
    // ...users.map((user) => ({
    //   url: `${BASE_URL}/u/${user.handle}`,
    //   lastModified: user.updatedAt,
    //   changeFrequency: "weekly" as const,
    //   priority: 0.6,
    // })),
    
    // Groupes publics (exemple)
    // ...groups.filter(g => g.visibility === "public").map((group) => ({
    //   url: `${BASE_URL}/groups/${group.id}`,
    //   lastModified: group.lastActivityAt,
    //   changeFrequency: "daily" as const,
    //   priority: 0.7,
    // })),
  ];

  return [...staticRoutes, ...dynamicRoutes];
}
