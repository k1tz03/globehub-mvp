import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ============================================
// CONFIGURATION DE SÉCURITÉ
// ============================================

const SECURITY_CONFIG = {
  // Rate limiting par IP
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requêtes par minute
    maxAuthAttempts: 5, // 5 tentatives de connexion
    blockDurationMs: 15 * 60 * 1000, // 15 min de blocage
  },
  
  // Routes protégées (nécessitent authentification)
  protectedRoutes: [
    "/settings",
    "/messages",
    "/admin",
  ],
  
  // Routes admin uniquement
  adminRoutes: [
    "/admin",
  ],
  
  // Routes publiques (toujours accessibles)
  publicRoutes: [
    "/",
    "/groups",
    "/u",
  ],
  
  // User agents bloqués (bots malveillants)
  blockedUserAgents: [
    "AhrefsBot",
    "SemrushBot",
    "MJ12bot",
    "DotBot",
    "BLEXBot",
    "SearchmetricsBot",
    "serpstatbot",
    "Sogou",
    "YandexBot",
    "DataForSeoBot",
  ],
  
  // IPs bloquées (à alimenter dynamiquement)
  blockedIPs: new Set<string>([
    // Ajouter les IPs malveillantes ici
  ]),
  
  // Chemins sensibles à protéger
  sensitivePaths: [
    "/.env",
    "/.git",
    "/wp-admin",
    "/wp-login",
    "/phpmyadmin",
    "/admin.php",
    "/.htaccess",
    "/config",
    "/backup",
  ],
};

// ============================================
// STOCKAGE EN MÉMOIRE POUR RATE LIMITING
// ============================================

interface RateLimitEntry {
  count: number;
  firstRequest: number;
  blocked: boolean;
  blockedUntil?: number;
}

// Map en mémoire pour le rate limiting (en production, utiliser Redis)
const rateLimitMap = new Map<string, RateLimitEntry>();

// Nettoyer les entrées expirées toutes les 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitMap.entries()) {
      if (now - entry.firstRequest > SECURITY_CONFIG.rateLimit.windowMs * 2) {
        rateLimitMap.delete(ip);
      }
    }
  }, 5 * 60 * 1000);
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

function getClientIP(request: NextRequest): string {
  // Essayer différents headers pour obtenir l'IP réelle
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  
  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }
  
  // Fallback
  return "unknown";
}

function isBlockedUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return SECURITY_CONFIG.blockedUserAgents.some(bot => 
    userAgent.toLowerCase().includes(bot.toLowerCase())
  );
}

function isSensitivePath(pathname: string): boolean {
  return SECURITY_CONFIG.sensitivePaths.some(path => 
    pathname.toLowerCase().startsWith(path.toLowerCase())
  );
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  let entry = rateLimitMap.get(ip);
  
  // Vérifier si l'IP est bloquée
  if (entry?.blocked && entry.blockedUntil && now < entry.blockedUntil) {
    return { allowed: false, remaining: 0 };
  }
  
  // Réinitialiser si la fenêtre est expirée
  if (!entry || now - entry.firstRequest > SECURITY_CONFIG.rateLimit.windowMs) {
    entry = { count: 1, firstRequest: now, blocked: false };
    rateLimitMap.set(ip, entry);
    return { allowed: true, remaining: SECURITY_CONFIG.rateLimit.maxRequests - 1 };
  }
  
  // Incrémenter le compteur
  entry.count++;
  
  // Vérifier si la limite est atteinte
  if (entry.count > SECURITY_CONFIG.rateLimit.maxRequests) {
    entry.blocked = true;
    entry.blockedUntil = now + SECURITY_CONFIG.rateLimit.blockDurationMs;
    return { allowed: false, remaining: 0 };
  }
  
  return { 
    allowed: true, 
    remaining: SECURITY_CONFIG.rateLimit.maxRequests - entry.count 
  };
}

function generateSecurityHeaders(): Record<string, string> {
  return {
    // Protection contre le clickjacking
    "X-Frame-Options": "DENY",
    
    // Protection XSS (navigateurs modernes)
    "X-XSS-Protection": "1; mode=block",
    
    // Empêcher le sniffing MIME
    "X-Content-Type-Options": "nosniff",
    
    // Politique de référent
    "Referrer-Policy": "strict-origin-when-cross-origin",
    
    // Permissions Policy
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(self), payment=()",
    
    // HSTS (uniquement en production avec HTTPS)
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    
    // Cross-Origin policies
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Cross-Origin-Embedder-Policy": "require-corp",
    
    // Cache control pour les données sensibles
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
  };
}

// ============================================
// MIDDLEWARE PRINCIPAL
// ============================================

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIP(request);
  const userAgent = request.headers.get("user-agent");
  
  // 1. Bloquer les IPs connues
  if (SECURITY_CONFIG.blockedIPs.has(ip)) {
    return new NextResponse("Access Denied", { status: 403 });
  }
  
  // 2. Bloquer les user agents malveillants
  if (isBlockedUserAgent(userAgent)) {
    return new NextResponse("Access Denied", { status: 403 });
  }
  
  // 3. Bloquer les chemins sensibles
  if (isSensitivePath(pathname)) {
    // Logger la tentative (en production, envoyer à un système de monitoring)
    console.warn(`[SECURITY] Blocked access to sensitive path: ${pathname} from IP: ${ip}`);
    return new NextResponse("Not Found", { status: 404 });
  }
  
  // 4. Rate limiting
  const rateLimitResult = checkRateLimit(ip);
  if (!rateLimitResult.allowed) {
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil(SECURITY_CONFIG.rateLimit.blockDurationMs / 1000)),
        "X-RateLimit-Limit": String(SECURITY_CONFIG.rateLimit.maxRequests),
        "X-RateLimit-Remaining": "0",
      },
    });
  }
  
  // 5. Vérification de méthodes HTTP autorisées
  const allowedMethods = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"];
  if (!allowedMethods.includes(request.method)) {
    return new NextResponse("Method Not Allowed", { status: 405 });
  }
  
  // 6. Ajouter les headers de sécurité à la réponse
  const response = NextResponse.next();
  const securityHeaders = generateSecurityHeaders();
  
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }
  
  // 7. Ajouter les headers de rate limiting
  response.headers.set("X-RateLimit-Limit", String(SECURITY_CONFIG.rateLimit.maxRequests));
  response.headers.set("X-RateLimit-Remaining", String(rateLimitResult.remaining));
  
  // 8. Ajouter un identifiant de requête pour le tracking
  const requestId = crypto.randomUUID();
  response.headers.set("X-Request-ID", requestId);
  
  return response;
}

// ============================================
// CONFIGURATION DU MATCHER
// ============================================

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
