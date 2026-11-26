import type { StudioRole } from "@/lib/supabase/types";

export const ROLE_LABELS: Record<StudioRole, string> = {
  owner: "Propriétaire",
  admin: "Administrateur",
  artist: "Artiste",
  assistant: "Assistant",
};

// Gérer l'équipe (inviter, changer un rôle, retirer) : owner et admin.
// Simple aide d'affichage : la base revérifie tout (fonctions inky_*_studio_member).
export function canManageTeam(role: StudioRole) {
  return role === "owner" || role === "admin";
}

// Rôles qu'un membre peut attribuer : seul un owner peut nommer un owner.
export function assignableRoles(role: StudioRole): StudioRole[] {
  if (role === "owner") return ["owner", "admin", "artist", "assistant"];
  if (role === "admin") return ["admin", "artist", "assistant"];
  return [];
}

// Peut-on modifier ou retirer un membre qui a le rôle `target` ? Un admin ne touche pas aux owners.
export function canEditMember(me: StudioRole, target: StudioRole) {
  if (!canManageTeam(me)) return false;
  return me === "owner" || target !== "owner";
}
