"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStudio } from "@/lib/auth/dal";
import { logError } from "@/lib/errors";
import {
  appointmentSchema,
  fieldErrors,
  formToObject,
  moveAppointmentSchema,
  resizeAppointmentSchema,
  type FormState,
} from "@/lib/validation";
import { parseDateKey, utcToWall, wallToUtcIso } from "./time";

const FIELDS = [
  "id",
  "title",
  "kind",
  "date",
  "start",
  "end",
  "clientId",
  "artistId",
  "projectId",
  "notes",
] as const;

function dbError(scope: string, error: { code?: string; message?: string }): FormState {
  logError(scope, error);
  if (error.code === "42501")
    return { message: "Action refusée : vérifie le client et l'artiste choisis." };
  if (error.code === "23514") return { message: "Horaires ou champs invalides." };
  if (error.code === "PGRST205" || error.code === "42P01") {
    return {
      message: "Le planning n'est pas encore activé : la migration Supabase doit être appliquée.",
    };
  }
  return { message: "Enregistrement impossible. Réessaie dans un instant." };
}

export async function saveAppointment(_prev: FormState, formData: FormData): Promise<FormState> {
  // studio_id et created_by viennent du serveur ; les RLS revérifient client et artiste.
  const { user, current } = await requireStudio();
  const parsed = appointmentSchema.safeParse(formToObject(formData, FIELDS));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const v = parsed.data;
  if (parseDateKey(v.date, new Date(0)) !== v.date) return { errors: { date: "Date invalide." } };

  const values = {
    title: v.title,
    kind: v.kind,
    starts_at: wallToUtcIso(v.date, v.start),
    ends_at: wallToUtcIso(v.date, v.end),
    client_id: v.clientId,
    artist_id: v.artistId,
    notes: v.notes,
    // Le champ projet n'est affiché que si les projets sont activés (migration appliquée).
    ...(formData.has("projectId") ? { project_id: v.projectId } : {}),
  };

  const supabase = await createClient();
  let id = v.id;
  if (id) {
    const { data, error } = await supabase
      .from("appointments")
      .update(values)
      .eq("id", id)
      .eq("studio_id", current.studioId)
      .is("deleted_at", null)
      .select("id");
    if (error) return dbError("planning:update", error);
    if (!data?.length) return { message: "Ce rendez-vous n'existe plus ou a été supprimé." };
  } else {
    const { data, error } = await supabase
      .from("appointments")
      .insert({ ...values, studio_id: current.studioId, created_by: user.id })
      .select("id")
      .single();
    if (error) return dbError("planning:create", error);
    id = data.id as string;
  }

  revalidatePath("/dashboard/planning");
  revalidatePath("/dashboard/projets", "layout");
  return { ok: true, id: id ?? undefined, message: "Rendez-vous enregistré." };
}

export async function deleteAppointment(_prev: FormState, formData: FormData): Promise<FormState> {
  const { current } = await requireStudio();
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { message: "Rendez-vous introuvable." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("studio_id", current.studioId)
    .is("deleted_at", null)
    .select("id");
  if (error) return dbError("planning:delete", error);
  if (!data?.length) return { message: "Ce rendez-vous a déjà été supprimé." };

  revalidatePath("/dashboard/planning");
  return { ok: true, message: "Rendez-vous supprimé." };
}

// Nouvelles heures d'un rendez-vous, glissées depuis la grille. Le jour ne change pas :
// il est relu en base (heure de Paris), jamais pris du navigateur.
export async function resizeAppointment(input: {
  id: string;
  start: string;
  end: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const { current } = await requireStudio();
  const parsed = resizeAppointmentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Horaires invalides." };
  const { id, start, end } = parsed.data;

  const supabase = await createClient();
  const { data: row, error: readError } = await supabase
    .from("appointments")
    .select("starts_at")
    .eq("id", id)
    .eq("studio_id", current.studioId)
    .is("deleted_at", null)
    .maybeSingle();
  if (readError)
    return {
      ok: false,
      message: dbError("planning:resize-read", readError).message ?? "Enregistrement impossible.",
    };
  if (!row) return { ok: false, message: "Ce rendez-vous n'existe plus ou a été supprimé." };

  const day = utcToWall(String(row.starts_at)).dateKey;
  const { data, error } = await supabase
    .from("appointments")
    .update({ starts_at: wallToUtcIso(day, start), ends_at: wallToUtcIso(day, end) })
    .eq("id", id)
    .eq("studio_id", current.studioId)
    .is("deleted_at", null)
    .select("id");
  if (error)
    return {
      ok: false,
      message: dbError("planning:resize", error).message ?? "Enregistrement impossible.",
    };
  if (!data?.length)
    return { ok: false, message: "Ce rendez-vous n'existe plus ou a été supprimé." };

  revalidatePath("/dashboard/planning");
  revalidatePath("/dashboard/projets", "layout");
  return { ok: true };
}

// Déplacement glissé depuis la grille : nouveau jour et nouvelle heure de début, même durée
// (relue en base, donc juste aussi pour un rendez-vous qui passe minuit).
export async function moveAppointment(input: {
  id: string;
  date: string;
  start: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const { current } = await requireStudio();
  const parsed = moveAppointmentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Créneau invalide." };
  const { id, date, start } = parsed.data;
  if (parseDateKey(date, new Date(0)) !== date) return { ok: false, message: "Date invalide." };

  const supabase = await createClient();
  const { data: row, error: readError } = await supabase
    .from("appointments")
    .select("starts_at, ends_at")
    .eq("id", id)
    .eq("studio_id", current.studioId)
    .is("deleted_at", null)
    .maybeSingle();
  if (readError)
    return {
      ok: false,
      message: dbError("planning:move-read", readError).message ?? "Enregistrement impossible.",
    };
  if (!row) return { ok: false, message: "Ce rendez-vous n'existe plus ou a été supprimé." };

  const duration = Date.parse(String(row.ends_at)) - Date.parse(String(row.starts_at));
  const startsAt = wallToUtcIso(date, start);
  const endsAt = new Date(Date.parse(startsAt) + duration).toISOString();
  const { data, error } = await supabase
    .from("appointments")
    .update({ starts_at: startsAt, ends_at: endsAt })
    .eq("id", id)
    .eq("studio_id", current.studioId)
    .is("deleted_at", null)
    .select("id");
  if (error)
    return {
      ok: false,
      message: dbError("planning:move", error).message ?? "Enregistrement impossible.",
    };
  if (!data?.length)
    return { ok: false, message: "Ce rendez-vous n'existe plus ou a été supprimé." };

  revalidatePath("/dashboard/planning");
  revalidatePath("/dashboard/projets", "layout");
  return { ok: true };
}
