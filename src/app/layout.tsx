import React from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import "maplibre-gl/dist/maplibre-gl.css";
import ThemeProvider from "@/components/ThemeProvider";
import { CookieBanner } from "@/components/CookieBanner";

// Configuration SEO complète
export const metadata: Metadata = {
  // Titres
  title: {
    default: "GlobeHub - Réseau Social Géolocalisé | Partagez sur le Globe",
    template: "%s | GlobeHub",
  },
  
  // Description
  description: "GlobeHub est le premier réseau social géolocalisé sur globe 3D. Partagez vos moments, découvrez des posts autour de vous, rejoignez des groupes et connectez-vous avec le monde entier en temps réel.",
  
  // Mots-clés
  keywords: [
    "réseau social",
    "géolocalisation",
    "globe 3D",
    "carte interactive",
    "partage",
    "communauté",
    "groupes",
    "messagerie",
    "posts géolocalisés",
    "social network",
    "GlobeHub",
  ],
  
  // Auteur et éditeur
  authors: [{ name: "GlobeHub Team" }],
  creator: "GlobeHub",
  publisher: "GlobeHub",
  
  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  
  // Open Graph (Facebook, LinkedIn, etc.)
  openGraph: {
    type: "website",
    locale: "fr_FR",
    alternateLocale: ["en_US"],
    url: "https://globehub.app",
    siteName: "GlobeHub",
    title: "GlobeHub - Réseau Social Géolocalisé",
    description: "Partagez vos moments sur le globe, découvrez des posts autour de vous et connectez-vous avec le monde entier.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "GlobeHub - Réseau Social sur Globe 3D",
        type: "image/png",
      },
    ],
  },
  
  // Twitter Card
  twitter: {
    card: "summary_large_image",
    site: "@globehub",
    creator: "@globehub",
    title: "GlobeHub - Réseau Social Géolocalisé",
    description: "Partagez vos moments sur le globe, découvrez des posts autour de vous et connectez-vous avec le monde entier.",
    images: ["/twitter-image.png"],
  },
  
  // Icônes
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  
  // Manifest PWA
  manifest: "/manifest.json",
  
  // Vérification des propriétés
  verification: {
    google: "votre-code-google-search-console",
    yandex: "votre-code-yandex",
    // yahoo: "votre-code-yahoo",
  },
  
  // Catégorie
  category: "social networking",
  
  // Autres métadonnées
  applicationName: "GlobeHub",
  referrer: "strict-origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  
  // Base URL pour les URLs relatives
  metadataBase: new URL("https://globehub.app"),
  
  // Alternate languages
  alternates: {
    canonical: "/",
    languages: {
      "fr-FR": "/fr",
      "en-US": "/en",
    },
  },
};

// Viewport configuration
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  colorScheme: "light dark",
};

// Structured Data JSON-LD
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "GlobeHub",
  description: "Réseau social géolocalisé sur globe 3D",
  url: "https://globehub.app",
  applicationCategory: "SocialNetworkingApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EUR",
  },
  author: {
    "@type": "Organization",
    name: "GlobeHub",
    url: "https://globehub.app",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "1250",
    bestRating: "5",
    worstRating: "1",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Preconnect pour les ressources externes */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.mapbox.com" />
        
        {/* DNS Prefetch */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://api.mapbox.com" />
        
        {/* Structured Data JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="gh-gradient">
        <ThemeProvider>
          {children}
          <CookieBanner />
        </ThemeProvider>
      </body>
    </html>
  );
}
