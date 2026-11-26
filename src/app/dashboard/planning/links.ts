import type { PlanningView } from "@/lib/planning/time";

// Lien vers le planning (utilisable côté serveur comme côté navigateur).
export function planningHref(view: PlanningView, date: string, rdv?: string | null) {
  const p = new URLSearchParams({ vue: view, date });
  if (rdv) p.set("rdv", rdv);
  return `/dashboard/planning?${p.toString()}`;
}
