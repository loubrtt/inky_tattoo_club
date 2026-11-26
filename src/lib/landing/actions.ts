"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStudio } from "@/lib/auth/dal";
import { logError } from "@/lib/errors";
import { canEditSite } from "@/lib/roles";
import { landingSchema, nestedFieldErrors, type FormState } from "@/lib/validation";

const MAX_PAYLOAD = 60_000;

export async function saveLanding(_prev: FormState, formData: FormData): Promise<FormState> {
  // Le studio vient du serveur ; le rôle est revérifié ici ET par les règles RLS.
  const { current } = await requireStudio();
  const attempt = (_prev.attempt ?? 0) + 1;
  if (!canEditSite(current.role)) {
    return {
      attempt,
      message: "Seuls les propriétaires et administrateurs peuvent modifier le site.",
    };
  }

  const raw = formData.get("content");
  if (typeof raw !== "string" || raw.length === 0 || raw.length > MAX_PAYLOAD) {
    return { attempt, message: "Contenu trop long ou vide. Raccourcis les textes et réessaie." };
  }
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { attempt, message: "Le formulaire n'a pas pu être lu. Recharge la page et réessaie." };
  }

  const parsed = landingSchema.safeParse(json);
  if (!parsed.success) {
    return {
      attempt,
      errors: nestedFieldErrors(parsed.error),
      message: "Certains champs sont à corriger.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("studio_sites")
    .upsert({ studio_id: current.studioId, content: parsed.data }, { onConflict: "studio_id" });
  if (error) {
    logError("landing:save", error);
    if (error.code === "42501")
      return { attempt, message: "Ton rôle ne permet pas de modifier le site." };
    if (error.code === "42P01" || error.code === "PGRST205")
      return { attempt, message: "Le site public n'est pas encore activé sur la base." };
    return { attempt, message: "Modifications non enregistrées. Réessaie dans un instant." };
  }

  revalidatePath("/");
  revalidatePath("/dashboard/site");
  return { attempt, ok: true, message: "Site public mis à jour." };
}
