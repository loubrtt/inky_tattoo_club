import "server-only";
import { createClient } from "@/lib/supabase/server";
import { requireStudio } from "@/lib/auth/dal";
import { APPOINTMENT_KINDS, type Appointment, type AppointmentKind, type Member } from "./types";
import { utcToWall, type PlanningRange } from "./time";

// Codes renvoyés quand la migration n'est pas encore appliquée (table ou fonction absente).
const MISSING = new Set(["PGRST205", "PGRST202", "42P01", "42883"]);

export type PlanningData =
  | { status: "ok"; appointments: Appointment[]; members: Member[] }
  | { status: "missing-migration" };

type Row = {
  id: string;
  title: string;
  kind: string;
  starts_at: string;
  ends_at: string;
  client_id: string | null;
  artist_id: string | null;
  project_id?: string | null;
  notes: string | null;
};

const MAX_ROWS = 2000;
const BASE_COLUMNS = "id, title, kind, starts_at, ends_at, client_id, artist_id, notes";

export async function loadPlanning(
  range: PlanningRange,
  clientNames: Map<string, string>,
): Promise<PlanningData> {
  const { current } = await requireStudio();
  const supabase = await createClient();

  const selectAppointments = (columns: string) =>
    supabase
      .from("appointments")
      .select(columns)
      .eq("studio_id", current.studioId)
      .is("deleted_at", null)
      .lt("starts_at", range.toIso)
      .gt("ends_at", range.fromIso)
      .order("starts_at")
      .limit(MAX_ROWS);

  const [first, dir] = await Promise.all([
    selectAppointments(`${BASE_COLUMNS}, project_id`),
    supabase.rpc("inky_studio_directory", { p_studio: current.studioId }),
  ]);
  // Colonne project_id absente tant que la migration projets n'est pas appliquée.
  const appts = first.error?.code === "42703" ? await selectAppointments(BASE_COLUMNS) : first;

  for (const res of [appts, dir]) {
    if (res.error) {
      if (MISSING.has(res.error.code)) return { status: "missing-migration" };
      console.error("[planning] load", res.error.code, res.error.message);
      throw new Error("Lecture du planning impossible.");
    }
  }

  const members: Member[] = (
    (dir.data ?? []) as { user_id: string; role: string; email: string | null }[]
  ).map((m, i) => ({ userId: m.user_id, email: m.email ?? "—", role: m.role, color: i }));

  const rows = (appts.data ?? []) as unknown as Row[];
  // Noms des clients absents de la liste chargée (au-delà des 500 plus récents).
  const missing = [
    ...new Set(
      rows.map((r) => r.client_id).filter((id): id is string => !!id && !clientNames.has(id)),
    ),
  ];
  const names = new Map(clientNames);
  if (missing.length) {
    const { data, error } = await supabase
      .from("clients")
      .select("id, first_name, last_name")
      .eq("studio_id", current.studioId)
      .in("id", missing.slice(0, 500));
    if (error) console.error("[planning] client names", error.code, error.message);
    for (const c of data ?? []) {
      names.set(c.id as string, `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || "Sans nom");
    }
  }

  const appointments = rows.map((r): Appointment => {
    const s = utcToWall(r.starts_at);
    const e = utcToWall(r.ends_at);
    const kind = (APPOINTMENT_KINDS as readonly string[]).includes(r.kind)
      ? (r.kind as AppointmentKind)
      : "other";
    return {
      id: r.id,
      title: r.title,
      kind,
      dateKey: s.dateKey,
      startMin: s.minutes,
      // Un RDV qui déborde sur le lendemain est coupé à minuit dans la vue jour / semaine.
      endMin: e.dateKey === s.dateKey ? Math.max(e.minutes, s.minutes + 15) : 1440,
      startTime: s.time,
      endTime: e.time,
      clientId: r.client_id,
      clientName: r.client_id ? (names.get(r.client_id) ?? "Fiche indisponible") : null,
      artistId: r.artist_id,
      projectId: r.project_id ?? null,
      notes: r.notes,
    };
  });

  return { status: "ok", appointments, members };
}
