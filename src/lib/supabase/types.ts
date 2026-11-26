// Types écrits à la main d'après les colonnes utilisées par le prototype.
// À remplacer par `make db-types` une fois le schéma versionné (voir supabase/README.md).
export const STUDIO_ROLES = ["owner", "admin", "artist", "assistant"] as const;
export type StudioRole = (typeof STUDIO_ROLES)[number];

export type StudioMembership = {
  studioId: string;
  studioName: string;
  role: StudioRole;
};

export type ClientRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  project_summary: string | null;
  created_at: string | null;
};
