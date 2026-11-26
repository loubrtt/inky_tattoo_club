"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStudio } from "@/lib/auth/dal";
import { logError } from "@/lib/errors";
import { clientSchema, fieldErrors, formToObject, type FormState } from "@/lib/validation";

export async function createClientRecord(_prev: FormState, formData: FormData): Promise<FormState> {
  // studio_id et created_by viennent du serveur : rien de ce que le formulaire envoie ne les remplace.
  const { user, current } = await requireStudio();
  const parsed = clientSchema.safeParse(
    formToObject(formData, ["firstName", "lastName", "email", "project"]),
  );
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.from("clients").insert({
    studio_id: current.studioId,
    first_name: parsed.data.firstName,
    last_name: parsed.data.lastName,
    email: parsed.data.email,
    project_summary: parsed.data.project,
    created_by: user.id,
  });
  if (error) {
    logError("clients:create", error);
    if (error.code === "42501") return { message: "Ton rôle ne permet pas de créer une fiche." };
    if (error.code === "23505") return { message: "Une fiche identique existe déjà." };
    return { message: "Fiche non enregistrée. Réessaie dans un instant." };
  }

  revalidatePath("/clients");
  revalidatePath("/");
  return { ok: true, message: "Fiche enregistrée." };
}
