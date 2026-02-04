/**
 * GlobeHub Security Utilities
 * Utilitaires de sécurité pour protéger l'application
 */

// ============================================
// 1. VALIDATION DES ENTRÉES
// ============================================

export const validators = {
  // Email
  email: (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email) && email.length <= 254;
  },

  // Nom d'utilisateur (handle)
  handle: (handle: string): boolean => {
    const handleRegex = /^[a-zA-Z0-9_]{3,30}$/;
    return handleRegex.test(handle);
  },

  // Mot de passe fort
  password: (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (password.length < 8) errors.push("Minimum 8 caractères");
    if (password.length > 128) errors.push("Maximum 128 caractères");
    if (!/[a-z]/.test(password)) errors.push("Au moins une minuscule");
    if (!/[A-Z]/.test(password)) errors.push("Au moins une majuscule");
    if (!/[0-9]/.test(password)) errors.push("Au moins un chiffre");
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push("Au moins un caractère spécial");
    
    // Vérifier les séquences communes
    const commonPatterns = ["123456", "password", "qwerty", "abc123", "azerty"];
    if (commonPatterns.some(p => password.toLowerCase().includes(p))) {
      errors.push("Mot de passe trop commun");
    }
    
    return { valid: errors.length === 0, errors };
  },

  // Texte de post (longueur et contenu)
  postText: (text: string): { valid: boolean; error?: string } => {
    if (!text || text.trim().length === 0) {
      return { valid: false, error: "Le texte ne peut pas être vide" };
    }
    if (text.length > 2000) {
      return { valid: false, error: "Maximum 2000 caractères" };
    }
    return { valid: true };
  },

  // URL
  url: (url: string): boolean => {
    try {
      const parsed = new URL(url);
      return ["http:", "https:"].includes(parsed.protocol);
    } catch {
      return false;
    }
  },

  // UUID
  uuid: (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  },

  // Numéro de téléphone (format international)
  phone: (phone: string): boolean => {
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/\s/g, ""));
  },
};

// ============================================
// 2. SANITIZATION DES DONNÉES
// ============================================

export const sanitizers = {
  // Échapper le HTML pour éviter XSS
  escapeHtml: (text: string): string => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
      "/": "&#x2F;",
      "`": "&#x60;",
      "=": "&#x3D;",
    };
    return text.replace(/[&<>"'`=/]/g, (char) => map[char]);
  },

  // Nettoyer le texte (supprimer les caractères dangereux)
  cleanText: (text: string): string => {
    return text
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Caractères de contrôle
      .replace(/\u200B/g, "") // Zero-width space
      .replace(/\uFEFF/g, "") // BOM
      .trim();
  },

  // Nettoyer un handle
  cleanHandle: (handle: string): string => {
    return handle
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 30);
  },

  // Nettoyer une URL
  cleanUrl: (url: string): string | null => {
    try {
      const parsed = new URL(url);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return null;
      }
      // Supprimer les paramètres potentiellement dangereux
      parsed.searchParams.delete("javascript");
      return parsed.toString();
    } catch {
      return null;
    }
  },

  // Supprimer les balises HTML
  stripHtml: (html: string): string => {
    return html.replace(/<[^>]*>/g, "");
  },

  // Normaliser les espaces
  normalizeSpaces: (text: string): string => {
    return text.replace(/\s+/g, " ").trim();
  },

  // Tronquer le texte de manière sécurisée
  truncate: (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + "...";
  },
};

// ============================================
// 3. HASHAGE DES MOTS DE PASSE
// ============================================

// Note: En production, utilisez bcrypt ou argon2
// Ceci est une implémentation simplifiée pour la démo

const SALT_LENGTH = 16;
const HASH_ITERATIONS = 100000;

// Générer un sel aléatoire
function generateSalt(): string {
  const array = new Uint8Array(SALT_LENGTH);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback pour les environnements sans crypto
    for (let i = 0; i < SALT_LENGTH; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Hash simple avec PBKDF2-like (pour démo)
async function hashWithSalt(password: string, salt: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: encoder.encode(salt),
        iterations: HASH_ITERATIONS,
        hash: "SHA-256",
      },
      keyMaterial,
      256
    );
    return Array.from(new Uint8Array(derivedBits), (b) =>
      b.toString(16).padStart(2, "0")
    ).join("");
  }
  
  // Fallback simple (NE PAS UTILISER EN PRODUCTION)
  let hash = password + salt;
  for (let i = 0; i < 1000; i++) {
    hash = btoa(hash + salt);
  }
  return hash.slice(0, 64);
}

export const passwordUtils = {
  // Hasher un mot de passe
  hash: async (password: string): Promise<string> => {
    const salt = generateSalt();
    const hash = await hashWithSalt(password, salt);
    return `${salt}:${hash}`;
  },

  // Vérifier un mot de passe
  verify: async (password: string, storedHash: string): Promise<boolean> => {
    const [salt, hash] = storedHash.split(":");
    if (!salt || !hash) return false;
    const computedHash = await hashWithSalt(password, salt);
    return computedHash === hash;
  },
};

// ============================================
// 4. PROTECTION CSRF
// ============================================

export const csrfUtils = {
  // Générer un token CSRF
  generateToken: (): string => {
    const array = new Uint8Array(32);
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      crypto.getRandomValues(array);
    } else {
      for (let i = 0; i < 32; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
  },

  // Stocker le token dans sessionStorage
  storeToken: (token: string): void => {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem("csrf_token", token);
    }
  },

  // Récupérer le token
  getToken: (): string | null => {
    if (typeof sessionStorage !== "undefined") {
      return sessionStorage.getItem("csrf_token");
    }
    return null;
  },

  // Vérifier le token
  verifyToken: (token: string): boolean => {
    const storedToken = csrfUtils.getToken();
    return storedToken !== null && storedToken === token;
  },
};

// ============================================
// 5. RATE LIMITING (côté client)
// ============================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export const rateLimit = {
  // Vérifier si l'action est autorisée
  check: (
    key: string,
    limit: number,
    windowMs: number
  ): { allowed: boolean; remaining: number; resetIn: number } => {
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return { allowed: true, remaining: limit - 1, resetIn: windowMs };
    }

    if (entry.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetIn: entry.resetTime - now,
      };
    }

    entry.count++;
    return {
      allowed: true,
      remaining: limit - entry.count,
      resetIn: entry.resetTime - now,
    };
  },

  // Limites prédéfinies
  limits: {
    login: { limit: 5, windowMs: 15 * 60 * 1000 }, // 5 tentatives / 15 min
    post: { limit: 10, windowMs: 60 * 1000 }, // 10 posts / min
    message: { limit: 30, windowMs: 60 * 1000 }, // 30 messages / min
    search: { limit: 20, windowMs: 60 * 1000 }, // 20 recherches / min
    report: { limit: 5, windowMs: 60 * 60 * 1000 }, // 5 signalements / heure
  },
};

// ============================================
// 6. DÉTECTION DE CONTENU MALVEILLANT
// ============================================

export const contentSecurity = {
  // Détecter les liens malveillants
  detectMaliciousUrls: (text: string): string[] => {
    const urlRegex = /https?:\/\/[^\s]+/gi;
    const urls = text.match(urlRegex) || [];
    const suspicious: string[] = [];

    // Patterns suspects
    const maliciousPatterns = [
      /bit\.ly|tinyurl|t\.co|goo\.gl/i, // Raccourcisseurs
      /\.(exe|bat|cmd|msi|dll|scr)$/i, // Fichiers exécutables
      /phishing|scam|hack|crack/i, // Mots-clés
      /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/i, // IP directe
    ];

    for (const url of urls) {
      for (const pattern of maliciousPatterns) {
        if (pattern.test(url)) {
          suspicious.push(url);
          break;
        }
      }
    }

    return suspicious;
  },

  // Détecter le spam
  detectSpam: (text: string): { isSpam: boolean; reasons: string[] } => {
    const reasons: string[] = [];

    // Trop de majuscules
    const upperRatio = (text.match(/[A-Z]/g) || []).length / text.length;
    if (upperRatio > 0.5 && text.length > 20) {
      reasons.push("Trop de majuscules");
    }

    // Trop de caractères répétés
    if (/(.)\1{5,}/.test(text)) {
      reasons.push("Caractères répétés");
    }

    // Trop de liens
    const linkCount = (text.match(/https?:\/\//gi) || []).length;
    if (linkCount > 3) {
      reasons.push("Trop de liens");
    }

    // Mots-clés de spam
    const spamKeywords = [
      "gagnez",
      "gratuit",
      "cliquez ici",
      "offre limitée",
      "urgent",
      "félicitations",
      "vous avez gagné",
    ];
    for (const keyword of spamKeywords) {
      if (text.toLowerCase().includes(keyword)) {
        reasons.push(`Mot-clé suspect: "${keyword}"`);
      }
    }

    return { isSpam: reasons.length > 0, reasons };
  },

  // Détecter le contenu sensible
  detectSensitiveContent: (text: string): { hasSensitive: boolean; categories: string[] } => {
    const categories: string[] = [];
    const textLower = text.toLowerCase();

    const sensitiveWords: Record<string, string[]> = {
      violence: ["tuer", "mort", "violence", "arme", "bombe"],
      hate: ["haine", "nazi", "raciste", "discrimin"],
      adult: ["xxx", "porn", "nude", "sexe"],
      drugs: ["drogue", "cocaine", "héroïne", "dealer"],
      selfharm: ["suicide", "se tuer", "mourir"],
    };

    for (const [category, words] of Object.entries(sensitiveWords)) {
      for (const word of words) {
        if (textLower.includes(word)) {
          categories.push(category);
          break;
        }
      }
    }

    return { hasSensitive: categories.length > 0, categories };
  },
};

// ============================================
// 7. GESTION DES SESSIONS SÉCURISÉES
// ============================================

export const sessionSecurity = {
  // Générer un ID de session sécurisé
  generateSessionId: (): string => {
    const array = new Uint8Array(32);
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      crypto.getRandomValues(array);
    } else {
      for (let i = 0; i < 32; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
  },

  // Vérifier la fraîcheur de la session (max 24h)
  isSessionFresh: (createdAt: number, maxAgeMs: number = 24 * 60 * 60 * 1000): boolean => {
    return Date.now() - createdAt < maxAgeMs;
  },

  // Détecter les sessions suspectes (changement d'IP, user-agent, etc.)
  detectSuspiciousActivity: (
    currentFingerprint: string,
    storedFingerprint: string
  ): boolean => {
    return currentFingerprint !== storedFingerprint;
  },
};

// ============================================
// 8. EXPORT PAR DÉFAUT
// ============================================

const security = {
  validators,
  sanitizers,
  passwordUtils,
  csrfUtils,
  rateLimit,
  contentSecurity,
  sessionSecurity,
};

export default security;
