export const PROJECT_STATUSES = ["to_draw", "in_progress", "done"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  to_draw: "À dessiner",
  in_progress: "En cours",
  done: "Terminé",
};

export type Project = {
  id: string;
  title: string;
  status: ProjectStatus;
  clientId: string;
  clientName: string;
  artistId: string | null;
  bodyZone: string | null;
  dimensions: string | null;
  style: string | null;
  refs: string | null;
  artisticNotes: string | null;
  updatedAt: string | null;
};

export type ProjectSession = {
  id: string;
  title: string;
  kind: string;
  dateKey: string;
  startTime: string;
  endTime: string;
  artistId: string | null;
};

// Option de projet dans le formulaire de rendez-vous du planning.
export type ProjectOption = { id: string; title: string; clientName: string };

export function isProjectStatus(value: unknown): value is ProjectStatus {
  return typeof value === "string" && (PROJECT_STATUSES as readonly string[]).includes(value);
}
