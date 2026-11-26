"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStudio } from "@/lib/auth/dal";
import { logError } from "@/lib/errors";
import { PROJECTS_MISSING } from "@/lib/projects/data";
import {
  fieldErrors,
  formToObject,
  PROJECT_FIELDS,
  projectSchema,
  type FormState,
} from "@/lib/validation";

function dbError(scope: string, error: { code?: string; message?: string }): FormState {
  logError(scope, error);
  if (PROJECTS_MISSING.has(error.code ?? "")) {
    return {
      message: "Les projets ne sont pas encore activés : la migration doit être appliquée.",
    };
  }
  if (error.code === "42501")
    return { message: "Action refusée : vérifie le client et l'artiste choisis." };
  if (error.code === "23514") return { message: "Un des champs est invalide." };
  return { message: "Enregistrement impossible. Réessaie dans un instant." };
}

function done(id?: string | null) {
  revalidatePath("/dashboard/projets");
  if (id) revalidatePath(`/dashboard/projets/${id}`);
}

export async function saveProject(_prev: FormState, formData: FormData): Promise<FormState> {
  // studio_id et created_by viennent du serveur ; les RLS revérifient client et artiste.
  const { user, current } = await requireStudio();
  const parsed = projectSchema.safeParse(formToObject(formData, PROJECT_FIELDS));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const v = parsed.data;
  const values = {
    title: v.title,
    status: v.status,
    client_id: v.clientId,
    artist_id: v.artistId,
    body_zone: v.bodyZone,
    dimensions: v.dimensions,
    style: v.style,
    refs: v.refs,
    artistic_notes: v.artisticNotes,
  };

  const supabase = await createClient();
  let id = v.id;
  if (id) {
    const { data, error } = await supabase
      .from("projects")
      .update(values)
      .eq("id", id)
      .eq("studio_id", current.studioId)
      .is("deleted_at", null)
      .select("id");
    if (error) return dbError("projects:update", error);
    if (!data?.length) return { message: "Ce projet n'existe plus ou a été supprimé." };
  } else {
    const { data, error } = await supabase
      .from("projects")
      .insert({ ...values, studio_id: current.studioId, created_by: user.id })
      .select("id")
      .single();
    if (error) return dbError("projects:create", error);
    id = data.id as string;
  }

  done(id);
  return { ok: true, id: id ?? undefined, message: "Projet enregistré." };
}

export async function deleteProject(_prev: FormState, formData: FormData): Promise<FormState> {
  const { current } = await requireStudio();
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { message: "Projet introuvable." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("studio_id", current.studioId)
    .is("deleted_at", null)
    .select("id");
  if (error) return dbError("projects:delete", error);
  if (!data?.length) return { message: "Ce projet a déjà été supprimé." };

  // Les rendez-vous restent au planning, simplement détachés du projet supprimé.
  const { error: detachError } = await supabase
    .from("appointments")
    .update({ project_id: null })
    .eq("studio_id", current.studioId)
    .eq("project_id", id);
  logError("projects:detach", detachError);

  done(id);
  revalidatePath("/dashboard/planning");
  return { ok: true, message: "Projet supprimé." };
}
