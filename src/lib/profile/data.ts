import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/dal";
import { logError } from "@/lib/errors";

import type { Profile } from "@/lib/profile/display";

export type { Profile };

// Table absente (migration pas encore appliquée).
export const MISSING_TABLE = new Set(["PGRST205", "42P01"]);

export type ProfileResult =
  { status: "ok"; profile: Profile | null } | { status: "missing-migration" } | { status: "error" };

// Profil de l'utilisateur connecté. Jamais bloquant : en cas d'erreur, l'appli continue
// avec l'e-mail à la place du nom.
export const getMyProfile = cache(async (): Promise<ProfileResult> => {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("first_name, last_name, phone")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) {
    if (MISSING_TABLE.has(error.code)) return { status: "missing-migration" };
    logError("profile:load", error);
    return { status: "error" };
  }
  if (!data) return { status: "ok", profile: null };
  return {
    status: "ok",
    profile: {
      firstName: String(data.first_name ?? ""),
      lastName: (data.last_name as string | null) ?? null,
      phone: (data.phone as string | null) ?? null,
    },
  };
});

export function profileOf(result: ProfileResult): Profile | null {
  return result.status === "ok" ? result.profile : null;
}
