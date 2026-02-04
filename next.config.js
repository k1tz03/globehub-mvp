/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Optimisation des images
  images: { 
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Compression
  compress: true,

  // Génération de sourcemaps en production (désactivé pour la sécurité)
  productionBrowserSourceMaps: false,

  // Headers de sécurité
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Protection contre le clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Protection XSS
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Empêcher le sniffing MIME
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Politique de référent stricte
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Permissions Policy (désactiver les fonctionnalités non utilisées)
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "media-src 'self' https:",
              "connect-src 'self' https://api.mapbox.com https://*.tiles.mapbox.com https://basemaps.cartocdn.com https://*.basemaps.cartocdn.com https://*.carto.com",
              "worker-src 'self' blob:",
              "child-src 'self' blob:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          // Strict Transport Security (HTTPS only)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          // Cross-Origin policies
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },

  // Redirections pour SEO (www vers non-www, etc.)
  async redirects() {
    return [
      // Exemple: redirection de /home vers /
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },

  // Optimisation du bundle
  experimental: {
    optimizePackageImports: ['clsx', 'date-fns'],
  },
};

module.exports = nextConfig;
