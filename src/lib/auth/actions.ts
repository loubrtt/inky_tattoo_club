"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";
import { safeNextPath } from "@/lib/safe-redirect";
import { logError } from "@/lib/errors";
import { ACTIVE_STUDIO_COOKIE, getMemberships, requireUser } from "@/lib/auth/dal";
import {
  fieldErrors,
  forgotSchema,
  formToObject,
  loginSchema,
  newPasswordSchema,
  type FormState,
} from "@/lib/validation";

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(formToObject(formData, ["email", "password"]));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    logError("signIn", error);
    if (error.status === 429)
      return { message: "Trop de tentatives. Réessaie dans quelques minutes." };
    // Même message que le compte existe ou non.
    return { message: "Connexion refusée. Vérifie ton e-mail et ton mot de passe." };
  }

  redirect(safeNextPath(formData.get("next")));
}

export async function signInWithGoogle(formData: FormData) {
  const next = safeNextPath(formData.get("next"));
  const callback = new URL("/auth/confirm", publicEnv.NEXT_PUBLIC_SITE_URL);
  callback.searchParams.set("next", next);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callback.toString() },
  });
  if (error || !data.url) {
    logError("signInWithGoogle", error);
    redirect("/connexion?erreur=google");
  }
  redirect(data.url);
}

export async function requestPasswordReset(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = forgotSchema.safeParse(formToObject(formData, ["email"]));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const redirectTo = new URL(
    "/auth/confirm?next=/nouveau-mot-de-passe",
    publicEnv.NEXT_PUBLIC_SITE_URL,
  );
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: redirectTo.toString(),
  });
  if (error) {
    logError("resetPassword", error);
    if (error.status === 429) {
      return { message: "Trop de demandes d'e-mail. Attends avant de réessayer." };
    }
  }
  // Réponse identique que le compte existe ou non.
  return {
    ok: true,
    message:
      "Si cette adresse correspond à un compte, un e-mail vient d'être envoyé. Ouvre le lien dans ce même navigateur.",
  };
}

export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const parsed = newPasswordSchema.safeParse(formToObject(formData, ["password", "confirm"]));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    logError("updatePassword", error);
    if (error.code === "same_password") {
      return { errors: { password: "Choisis un mot de passe différent de l'ancien." } };
    }
    if (error.code === "weak_password") {
      return { errors: { password: "Mot de passe trop faible, choisis-en un plus long." } };
    }
    return { message: "Le mot de passe n'a pas pu être modifié. Réessaie." };
  }
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  logError("signOut", error);
  (await cookies()).delete(ACTIVE_STUDIO_COOKIE);
  redirect("/connexion");
}

export async function switchStudio(formData: FormData) {
  const user = await requireUser();
  const studioId = String(formData.get("studioId") ?? "");
  const studios = await getMemberships(user.id);
  if (!studios.some((s) => s.studioId === studioId)) return;

  (await cookies()).set(ACTIVE_STUDIO_COOKIE, studioId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
}
