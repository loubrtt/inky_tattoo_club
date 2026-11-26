import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

// Pas de cacheComponents : les pages du dashboard sont privées et propres à chaque utilisateur,
// on ne veut aucune donnée client mise en cache côté serveur.

// Anciennes adresses de l'appli (avant /dashboard) : on garde les favoris fonctionnels.
const LEGACY_APP_PATHS = ["planning", "clients", "projets", "devis", "apres-soin", "reglages"];
const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    return LEGACY_APP_PATHS.flatMap((p) => [
      { source: `/${p}`, destination: `/dashboard/${p}`, permanent: false },
      { source: `/${p}/:path*`, destination: `/dashboard/${p}/:path*`, permanent: false },
    ]);
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
