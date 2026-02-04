import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GlobeHub - Réseau Social Géolocalisé",
    short_name: "GlobeHub",
    description: "Partagez vos moments sur le globe, découvrez des posts autour de vous et connectez-vous avec le monde entier.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#d946ef",
    orientation: "portrait-primary",
    scope: "/",
    lang: "fr",
    dir: "ltr",
    categories: ["social", "lifestyle", "communication"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
    screenshots: [
      {
        src: "/screenshot-mobile.png",
        sizes: "390x844",
        type: "image/png",
        // @ts-ignore - form_factor is valid but not in types
        form_factor: "narrow",
        label: "GlobeHub sur mobile",
      },
      {
        src: "/screenshot-desktop.png",
        sizes: "1920x1080",
        type: "image/png",
        // @ts-ignore
        form_factor: "wide",
        label: "GlobeHub sur desktop",
      },
    ],
    shortcuts: [
      {
        name: "Nouveau post",
        short_name: "Post",
        description: "Créer un nouveau post",
        url: "/?compose=true",
        icons: [{ src: "/icon-compose.png", sizes: "96x96" }],
      },
      {
        name: "Messages",
        short_name: "Messages",
        description: "Voir mes messages",
        url: "/messages",
        icons: [{ src: "/icon-messages.png", sizes: "96x96" }],
      },
      {
        name: "Groupes",
        short_name: "Groupes",
        description: "Voir mes groupes",
        url: "/groups",
        icons: [{ src: "/icon-groups.png", sizes: "96x96" }],
      },
    ],
    related_applications: [],
    prefer_related_applications: false,
  };
}
