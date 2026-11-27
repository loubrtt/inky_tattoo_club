"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/dal";
import { logError } from "@/lib/errors";
import { MISSING_TABLE } from "@/lib/profile/data";
import { fieldErrors, formToObject, profileSchema, type FormState } from "@/lib/validation";

export async function saveProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  // user_id vient de la session côté serveur, jamais du formulaire.
  const user = await requireUser();
  const parsed = profileSchema.safeParse(
    formToObject(formData, ["firstName", "lastName", "phone"]),
  );
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      phone: parsed.data.phone,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) {
    logError("profile:save", error);
    if (MISSING_TABLE.has(error.code))
      return { message: "Les profils ne sont pas encore activés (migration à appliquer)." };
    return { message: "Profil non enregistré. Réessaie dans un instant." };
  }

  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "Profil enregistré." };
}
