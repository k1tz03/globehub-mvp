import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://globehub.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/groups",
          "/u/*",
        ],
        disallow: [
          "/admin",
          "/admin/*",
          "/api/*",
          "/settings",
          "/settings/*",
          "/messages",
          "/messages/*",
          "/_next/",
          "/private/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/admin",
          "/api/*",
          "/settings",
          "/messages",
        ],
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: [
          "/admin",
          "/api/*",
          "/settings",
          "/messages",
        ],
      },
      // Bloquer les bots malveillants connus
      {
        userAgent: "AhrefsBot",
        disallow: "/",
      },
      {
        userAgent: "SemrushBot",
        disallow: "/",
      },
      {
        userAgent: "MJ12bot",
        disallow: "/",
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
