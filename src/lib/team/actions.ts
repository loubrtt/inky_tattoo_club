"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStudio } from "@/lib/auth/dal";
import { publicEnv } from "@/lib/env";
import { logError } from "@/lib/errors";
import { MISSING_FUNCTION } from "@/lib/team/data";
import {
  fieldErrors,
  formToObject,
  inviteMemberSchema,
  memberRoleSchema,
  removeMemberSchema,
  type FormState,
} from "@/lib/validation";

// Réponses des fonctions SQL inky_*_studio_member -> message neutre en français.
const MESSAGES: Record<string, string> = {
  forbidden: "Ton rôle ne permet pas cette action.",
  last_owner: "Le studio doit garder au moins un propriétaire.",
  not_member: "Cette personne ne fait plus partie de l'équipe.",
  already_member: "Cette personne fait déjà partie de l'équipe.",
  invalid_role: "Rôle invalide.",
};
const FALLBACK = "Modification non enregistrée. Réessaie dans un instant.";
const MISSING = "La gestion de l'équipe n'est pas encore activée (migration à appliquer).";

function done() {
  revalidatePath("/dashboard", "layout");
}

async function callTeamRpc(fn: string, args: Record<string, unknown>) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(fn, args);
  if (error) {
    logError(`team:${fn}`, error);
    return { status: MISSING_FUNCTION.has(error.code) ? "missing" : "error" };
  }
  return { status: typeof data === "string" ? data : "error" };
}

export async function inviteMember(_prev: FormState, formData: FormData): Promise<FormState> {
  // Le studio vient du serveur ; la base revérifie le rôle de l'appelant.
  const { current } = await requireStudio();
  const parsed = inviteMemberSchema.safeParse(formToObject(formData, ["email", "role"]));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const { email, role } = parsed.data;
  const args = { p_studio: current.studioId, p_email: email, p_role: role };

  let res = await callTeamRpc("inky_add_studio_member", args);
  if (res.status === "added") {
    done();
    return { ok: true, message: `${email} a maintenant accès au studio.` };
  }
  if (res.status !== "not_found") {
    if (res.status === "missing") return { message: MISSING };
    return { message: MESSAGES[res.status] ?? FALLBACK };
  }

  // Aucun compte avec cette adresse : on l'invite par e-mail, puis on l'ajoute au studio.
  const admin = createAdminClient();
  if (!admin) {
    console.error("[team:invite] SUPABASE_SECRET_KEY absente ou invalide");
    return { message: "L'envoi d'invitations n'est pas encore configuré sur le serveur." };
  }
  const redirectTo = new URL(
    "/auth/confirm?next=/nouveau-mot-de-passe",
    publicEnv.NEXT_PUBLIC_SITE_URL,
  ).toString();
  const { error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo });
  if (error && error.code !== "email_exists") {
    logError("team:invite", error);
    if (error.status === 429) return { message: "Trop d'e-mails envoyés. Réessaie plus tard." };
    return { message: "L'invitation n'a pas pu être envoyée. Réessaie dans un instant." };
  }

  res = await callTeamRpc("inky_add_studio_member", args);
  if (res.status === "added") {
    done();
    return { ok: true, message: `Invitation envoyée à ${email}.` };
  }
  return { message: MESSAGES[res.status] ?? FALLBACK };
}

export async function changeMemberRole(_prev: FormState, formData: FormData): Promise<FormState> {
  const { current } = await requireStudio();
  const parsed = memberRoleSchema.safeParse(formToObject(formData, ["userId", "role"]));
  if (!parsed.success) return { message: "Choix invalide." };

  const res = await callTeamRpc("inky_set_studio_member_role", {
    p_studio: current.studioId,
    p_user: parsed.data.userId,
    p_role: parsed.data.role,
  });
  if (res.status === "ok" || res.status === "unchanged") {
    done();
    return { ok: true, message: "Rôle mis à jour." };
  }
  // attempt : remet la liste déroulante sur le rôle réel, même après deux refus identiques.
  if (res.status === "missing") return { message: MISSING, attempt: Date.now() };
  return { message: MESSAGES[res.status] ?? FALLBACK, attempt: Date.now() };
}

export async function removeMember(_prev: FormState, formData: FormData): Promise<FormState> {
  const { current } = await requireStudio();
  const parsed = removeMemberSchema.safeParse(formToObject(formData, ["userId"]));
  if (!parsed.success) return { message: "Choix invalide." };

  const res = await callTeamRpc("inky_remove_studio_member", {
    p_studio: current.studioId,
    p_user: parsed.data.userId,
  });
  if (res.status === "ok") {
    done();
    return { ok: true, message: "Accès retiré." };
  }
  if (res.status === "missing") return { message: MISSING };
  return { message: MESSAGES[res.status] ?? FALLBACK };
}
