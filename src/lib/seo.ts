import { Metadata } from "next";

// ============================================
// CONFIGURATION SEO
// ============================================

const SEO_CONFIG = {
  siteName: "GlobeHub",
  siteUrl: "https://globehub.app",
  defaultTitle: "GlobeHub - Réseau Social Géolocalisé",
  defaultDescription: "Le premier réseau social géolocalisé sur globe 3D. Partagez vos moments, découvrez des posts autour de vous, rejoignez des groupes.",
  defaultImage: "/og-image.png",
  twitterHandle: "@globehub",
  locale: "fr_FR",
  alternateLocales: ["en_US", "es_ES", "de_DE"],
};

// ============================================
// TYPES
// ============================================

export interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "profile";
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  tags?: string[];
  noIndex?: boolean;
  noFollow?: boolean;
}

export interface ProfileSEOProps {
  username: string;
  handle: string;
  bio?: string;
  avatar?: string;
  followersCount?: number;
  postsCount?: number;
}

export interface GroupSEOProps {
  name: string;
  description?: string;
  memberCount: number;
  avatar?: string;
  category?: string;
  isPublic: boolean;
}

export interface PostSEOProps {
  id: string;
  text: string;
  author: string;
  authorHandle: string;
  createdAt: string;
  image?: string;
  likesCount?: number;
  commentsCount?: number;
  location?: string;
}

// ============================================
// FONCTIONS GÉNÉRATRICES DE MÉTADONNÉES
// ============================================

/**
 * Génère les métadonnées de base pour une page
 */
export function generateBaseSEO(props: SEOProps = {}): Metadata {
  const {
    title,
    description = SEO_CONFIG.defaultDescription,
    image = SEO_CONFIG.defaultImage,
    url = SEO_CONFIG.siteUrl,
    type = "website",
    publishedTime,
    modifiedTime,
    author,
    tags,
    noIndex = false,
    noFollow = false,
  } = props;

  const fullTitle = title 
    ? `${title} | ${SEO_CONFIG.siteName}`
    : SEO_CONFIG.defaultTitle;

  const fullImageUrl = image.startsWith("http") 
    ? image 
    : `${SEO_CONFIG.siteUrl}${image}`;

  return {
    title: fullTitle,
    description,
    
    // Open Graph
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SEO_CONFIG.siteName,
      locale: SEO_CONFIG.locale,
      type,
      images: [
        {
          url: fullImageUrl,
          width: 1200,
          height: 630,
          alt: title || SEO_CONFIG.defaultTitle,
        },
      ],
      ...(type === "article" && {
        publishedTime,
        modifiedTime,
        authors: author ? [author] : undefined,
        tags,
      }),
    },
    
    // Twitter
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [fullImageUrl],
      site: SEO_CONFIG.twitterHandle,
      creator: SEO_CONFIG.twitterHandle,
    },
    
    // Robots
    robots: {
      index: !noIndex,
      follow: !noFollow,
      googleBot: {
        index: !noIndex,
        follow: !noFollow,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    
    // Canonical
    alternates: {
      canonical: url,
    },
  };
}

/**
 * Génère les métadonnées pour un profil utilisateur
 */
export function generateProfileSEO(profile: ProfileSEOProps): Metadata {
  const title = `${profile.username} (@${profile.handle})`;
  const description = profile.bio 
    ? `${profile.bio.substring(0, 150)}...`
    : `Découvrez le profil de ${profile.username} sur GlobeHub. ${profile.followersCount || 0} abonnés, ${profile.postsCount || 0} posts.`;

  return {
    ...generateBaseSEO({
      title,
      description,
      image: profile.avatar || SEO_CONFIG.defaultImage,
      url: `${SEO_CONFIG.siteUrl}/u/${profile.handle}`,
      type: "profile",
    }),
    
    // JSON-LD spécifique pour le profil
    other: {
      "script:ld+json": JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Person",
        name: profile.username,
        alternateName: `@${profile.handle}`,
        description: profile.bio,
        image: profile.avatar,
        url: `${SEO_CONFIG.siteUrl}/u/${profile.handle}`,
        interactionStatistic: [
          {
            "@type": "InteractionCounter",
            interactionType: "https://schema.org/FollowAction",
            userInteractionCount: profile.followersCount || 0,
          },
        ],
      }),
    },
  };
}

/**
 * Génère les métadonnées pour un groupe
 */
export function generateGroupSEO(group: GroupSEOProps): Metadata {
  const title = group.name;
  const description = group.description 
    ? `${group.description.substring(0, 150)}...`
    : `Rejoignez le groupe "${group.name}" sur GlobeHub. ${group.memberCount} membres.`;

  // Les groupes privés ne sont pas indexés
  const noIndex = !group.isPublic;

  return {
    ...generateBaseSEO({
      title,
      description,
      image: group.avatar || SEO_CONFIG.defaultImage,
      url: `${SEO_CONFIG.siteUrl}/groups/${encodeURIComponent(group.name.toLowerCase().replace(/\s+/g, "-"))}`,
      noIndex,
    }),
    
    // JSON-LD pour le groupe
    other: {
      "script:ld+json": JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        name: group.name,
        description: group.description,
        image: group.avatar,
        memberOf: {
          "@type": "Organization",
          name: "GlobeHub",
        },
        numberOfEmployees: {
          "@type": "QuantitativeValue",
          value: group.memberCount,
        },
      }),
    },
  };
}

/**
 * Génère les métadonnées pour un post
 */
export function generatePostSEO(post: PostSEOProps): Metadata {
  // Tronquer le texte pour le titre
  const title = post.text.length > 60 
    ? `${post.text.substring(0, 57)}...`
    : post.text;
    
  const description = `Post de ${post.author} sur GlobeHub: "${post.text.substring(0, 150)}..."`;

  return {
    ...generateBaseSEO({
      title,
      description,
      image: post.image || SEO_CONFIG.defaultImage,
      url: `${SEO_CONFIG.siteUrl}/post/${post.id}`,
      type: "article",
      publishedTime: post.createdAt,
      author: post.author,
    }),
    
    // JSON-LD pour l'article
    other: {
      "script:ld+json": JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SocialMediaPosting",
        headline: title,
        text: post.text,
        datePublished: post.createdAt,
        author: {
          "@type": "Person",
          name: post.author,
          alternateName: `@${post.authorHandle}`,
        },
        image: post.image,
        interactionStatistic: [
          {
            "@type": "InteractionCounter",
            interactionType: "https://schema.org/LikeAction",
            userInteractionCount: post.likesCount || 0,
          },
          {
            "@type": "InteractionCounter",
            interactionType: "https://schema.org/CommentAction",
            userInteractionCount: post.commentsCount || 0,
          },
        ],
        ...(post.location && {
          contentLocation: {
            "@type": "Place",
            name: post.location,
          },
        }),
      }),
    },
  };
}

// ============================================
// COMPOSANTS SEO POUR LES PAGES
// ============================================

/**
 * Métadonnées pour la page d'accueil
 */
export const homePageMetadata: Metadata = {
  ...generateBaseSEO(),
  keywords: [
    "réseau social",
    "géolocalisation",
    "globe 3D",
    "carte interactive",
    "posts géolocalisés",
    "GlobeHub",
    "social network",
    "partage",
    "communauté",
  ],
};

/**
 * Métadonnées pour la page des groupes
 */
export const groupsPageMetadata: Metadata = generateBaseSEO({
  title: "Groupes",
  description: "Découvrez et rejoignez des groupes sur GlobeHub. Trouvez des communautés qui partagent vos centres d'intérêt et échangez avec des membres du monde entier.",
  url: `${SEO_CONFIG.siteUrl}/groups`,
});

/**
 * Métadonnées pour la page des messages
 */
export const messagesPageMetadata: Metadata = generateBaseSEO({
  title: "Messages",
  description: "Vos conversations privées sur GlobeHub.",
  url: `${SEO_CONFIG.siteUrl}/messages`,
  noIndex: true, // Page privée
});

/**
 * Métadonnées pour la page des paramètres
 */
export const settingsPageMetadata: Metadata = generateBaseSEO({
  title: "Paramètres",
  description: "Gérez vos paramètres et préférences sur GlobeHub.",
  url: `${SEO_CONFIG.siteUrl}/settings`,
  noIndex: true, // Page privée
});

// ============================================
// UTILITAIRES SEO
// ============================================

/**
 * Génère un slug SEO-friendly à partir d'un texte
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Supprimer les accents
    .replace(/[^a-z0-9]+/g, "-") // Remplacer les caractères spéciaux par des tirets
    .replace(/^-+|-+$/g, "") // Supprimer les tirets au début/fin
    .substring(0, 60); // Limiter la longueur
}

/**
 * Génère une description SEO à partir d'un texte long
 */
export function generateDescription(text: string, maxLength: number = 160): string {
  if (text.length <= maxLength) return text;
  
  // Tronquer au dernier espace avant la limite
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  
  return lastSpace > maxLength / 2 
    ? truncated.substring(0, lastSpace) + "..."
    : truncated + "...";
}

/**
 * Vérifie si une URL est valide pour les métadonnées
 */
export function isValidSEOUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Nettoie un texte pour l'utiliser dans les métadonnées
 */
export function sanitizeForSEO(text: string): string {
  return text
    .replace(/[\n\r\t]+/g, " ") // Remplacer les sauts de ligne par des espaces
    .replace(/\s+/g, " ") // Normaliser les espaces multiples
    .replace(/[<>]/g, "") // Supprimer les chevrons
    .trim();
}

// Export par défaut
export default {
  config: SEO_CONFIG,
  generateBaseSEO,
  generateProfileSEO,
  generateGroupSEO,
  generatePostSEO,
  generateSlug,
  generateDescription,
  sanitizeForSEO,
  homePageMetadata,
  groupsPageMetadata,
  messagesPageMetadata,
  settingsPageMetadata,
};
