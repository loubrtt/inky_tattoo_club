import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";

// Client « administrateur » Supabase, réservé au serveur. Sert UNIQUEMENT à envoyer les
// invitations par e-mail (Auth Admin API). Les droits sur les données restent vérifiés par
// les fonctions SQL appelées avec la session de l'utilisateur, jamais avec ce client.
// La clé vient de SUPABASE_SECRET_KEY dans .env.local : jamais en NEXT_PUBLIC_, jamais commitée.
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key || !key.startsWith("sb_secret_")) return null;
  return createClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
