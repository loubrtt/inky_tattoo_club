import { z } from "zod";

// Variables publiques uniquement : elles finissent dans le bundle navigateur.
// Ne JAMAIS ajouter ici une clé sb_secret_ ou service_role.
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .startsWith("sb_publishable_", "La clé navigateur doit être une clé sb_publishable_"),
  // URL publique de l'app, utilisée pour les liens envoyés par e-mail (jamais déduite des en-têtes).
  NEXT_PUBLIC_SITE_URL: z.url(),
});

export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});
