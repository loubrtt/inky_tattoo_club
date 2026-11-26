import type { StudioRole } from "@/lib/supabase/types";

export const ROLE_LABELS: Record<StudioRole, string> = {
  owner: "Propriétaire",
  admin: "Administrateur",
  artist: "Artiste",
  assistant: "Assistant",
};
