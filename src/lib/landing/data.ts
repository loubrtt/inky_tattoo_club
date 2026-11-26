import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { requireStudio } from "@/lib/auth/dal";
import { DEFAULT_STUDIO_NAME, EMPTY_LANDING, type LandingContent } from "@/lib/landing/content";
import { landingSchema } from "@/lib/validation";

// Studio affiché sur la page publique « / ».
const LANDING_STUDIO_SLUG = process.env.LANDING_STUDIO_SLUG?.trim() || "inky-tattoo";

// Contenu stocké -> contenu sûr. Un contenu illisible (ancien format, édition manuelle)
// retombe sur le contenu vide plutôt que de casser la page.
export function toLandingContent(raw: unknown): LandingContent {
  if (!raw || typeof raw !== "object" || Object.keys(raw).length === 0) return EMPTY_LANDING;
  const parsed = landingSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("[landing] contenu stocké invalide", parsed.error.issues.length, "problème(s)");
    return EMPTY_LANDING;
  }
  return parsed.data;
}

export type PublicLanding = { studioName: string; content: LandingContent };

// Lecture publique (visiteur non connecté) via la fonction inky_public_site.
export const getPublicLanding = cache(async (): Promise<PublicLanding> => {
  const fallback = { studioName: DEFAULT_STUDIO_NAME, content: EMPTY_LANDING };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("inky_public_site", { p_slug: LANDING_STUDIO_SLUG });
  if (error) {
    console.error("[landing] inky_public_site", error.code, error.message);
    return fallback;
  }
  if (!data || typeof data !== "object") {
    console.error("[landing] aucun studio pour le slug", LANDING_STUDIO_SLUG);
    return fallback;
  }
  const row = data as { studio_name?: unknown; content?: unknown };
  const studioName =
    typeof row.studio_name === "string" && row.studio_name.trim()
      ? row.studio_name.trim()
      : DEFAULT_STUDIO_NAME;
  return { studioName, content: toLandingContent(row.content) };
});

export type StudioSite = { content: LandingContent; updatedAt: string | null } | null;

// Contenu du studio actif pour le dashboard. null = lecture impossible.
export async function getStudioSite(): Promise<StudioSite> {
  const { current } = await requireStudio();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("studio_sites")
    .select("content, updated_at")
    .eq("studio_id", current.studioId)
    .maybeSingle();
  if (error) {
    console.error("[landing] studio_sites", error.code, error.message);
    return null;
  }
  return {
    content: toLandingContent(data?.content),
    updatedAt: (data?.updated_at as string | undefined) ?? null,
  };
}
