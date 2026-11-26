import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { STUDIO_ROLES, type StudioMembership, type StudioRole } from "@/lib/supabase/types";

export const ACTIVE_STUDIO_COOKIE = "inky_studio";

export type CurrentUser = { id: string; email: string | null };

export type StudioContext = {
  user: CurrentUser;
  studios: StudioMembership[];
  current: StudioMembership;
};

// getUser() revalide le jeton auprès de Supabase : c'est la source de vérité côté serveur.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? null };
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  return user;
}

function isRole(value: unknown): value is StudioRole {
  return typeof value === "string" && (STUDIO_ROLES as readonly string[]).includes(value);
}

export const getMemberships = cache(async (userId: string): Promise<StudioMembership[]> => {
  const supabase = await createClient();
  const { data: members, error } = await supabase
    .from("studio_members")
    .select("studio_id, role")
    .eq("user_id", userId);
  if (error) {
    console.error("[dal] studio_members", error.code, error.message);
    throw new Error("Impossible de charger les accès studio.");
  }
  if (!members?.length) return [];

  const ids = [...new Set(members.map((m) => m.studio_id as string))];
  const { data: studios, error: studiosError } = await supabase
    .from("studios")
    .select("id, name")
    .in("id", ids);
  if (studiosError) {
    console.error("[dal] studios", studiosError.code, studiosError.message);
    throw new Error("Impossible de charger les studios.");
  }

  const names = new Map((studios ?? []).map((s) => [s.id as string, String(s.name ?? "")]));
  return members
    .filter((m) => isRole(m.role) && names.has(m.studio_id as string))
    .map((m) => ({
      studioId: m.studio_id as string,
      studioName: names.get(m.studio_id as string) ?? "",
      role: m.role as StudioRole,
    }))
    .sort((a, b) => a.studioName.localeCompare(b.studioName, "fr"));
});

// Utilisateur connecté + studio actif. Le studio vient d'un cookie, mais il est toujours
// recoupé avec les adhésions lues en base : un cookie modifié ne donne accès à rien.
export const requireStudio = cache(async (): Promise<StudioContext> => {
  const user = await requireUser();
  const studios = await getMemberships(user.id);
  if (!studios.length) redirect("/sans-studio");

  const wanted = (await cookies()).get(ACTIVE_STUDIO_COOKIE)?.value;
  const current = studios.find((s) => s.studioId === wanted) ?? studios[0];
  return { user, studios, current };
});
