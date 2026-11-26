import type { StudioRole } from "@/lib/supabase/types";

export const ROLE_LABELS: Record<StudioRole, string> = {
  owner: "Propriétaire",
  admin: "Administrateur",
  artist: "Artiste",
  assistant: "Assistant",
};

// Modifier le site public (landing) : owner et admin. Revérifié côté base (RLS).
export const SITE_EDITOR_ROLES: readonly StudioRole[] = ["owner", "admin"];
export function canEditSite(role: StudioRole) {
  return SITE_EDITOR_ROLES.includes(role);
}
