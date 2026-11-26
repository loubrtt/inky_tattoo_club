import "server-only";
import { createClient } from "@/lib/supabase/server";
import { requireStudio } from "@/lib/auth/dal";
import { STUDIO_ROLES, type StudioRole } from "@/lib/supabase/types";

// Codes renvoyés quand la migration n'est pas encore appliquée (fonction absente).
export const MISSING_FUNCTION = new Set(["PGRST202", "42883"]);

export type TeamMember = {
  userId: string;
  email: string;
  role: StudioRole;
  joinedAt: string | null;
  pending: boolean;
};

export type TeamData = { status: "ok"; members: TeamMember[] } | { status: "missing-migration" };

type Row = {
  user_id: string;
  role: string;
  email: string | null;
  joined_at: string | null;
  pending: boolean | null;
};

export async function loadTeam(): Promise<TeamData> {
  const { current } = await requireStudio();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("inky_studio_team", { p_studio: current.studioId });
  if (error) {
    if (MISSING_FUNCTION.has(error.code)) return { status: "missing-migration" };
    console.error("[team] load", error.code, error.message);
    throw new Error("Lecture de l'équipe impossible.");
  }
  const members = ((data ?? []) as Row[])
    .filter((r) => (STUDIO_ROLES as readonly string[]).includes(r.role))
    .map((r) => ({
      userId: r.user_id,
      email: r.email ?? "—",
      role: r.role as StudioRole,
      joinedAt: r.joined_at,
      pending: r.pending === true,
    }));
  return { status: "ok", members };
}
