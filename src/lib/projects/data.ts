import "server-only";
import { createClient } from "@/lib/supabase/server";
import { requireStudio } from "@/lib/auth/dal";
import { utcToWall } from "@/lib/planning/time";
import {
  isProjectStatus,
  type Project,
  type ProjectOption,
  type ProjectSession,
  type ProjectStatus,
} from "./types";

// Codes renvoyés quand la migration projets n'est pas encore appliquée.
export const PROJECTS_MISSING = new Set(["PGRST205", "42P01", "42703", "PGRST200"]);

export const PROJECT_LIST_LIMIT = 300;

const SELECT =
  "id, title, status, client_id, artist_id, body_zone, dimensions, style, refs, artistic_notes, updated_at, client:clients(first_name, last_name)";

type Row = {
  id: string;
  title: string;
  status: string;
  client_id: string;
  artist_id: string | null;
  body_zone: string | null;
  dimensions: string | null;
  style: string | null;
  refs: string | null;
  artistic_notes: string | null;
  updated_at: string | null;
  client:
    | { first_name: string | null; last_name: string | null }
    | { first_name: string | null; last_name: string | null }[]
    | null;
};

function clientName(c: Row["client"]) {
  const one = Array.isArray(c) ? c[0] : c;
  if (!one) return "Fiche indisponible";
  return `${one.first_name ?? ""} ${one.last_name ?? ""}`.trim() || "Sans nom";
}

function toProject(r: Row): Project {
  return {
    id: r.id,
    title: r.title,
    status: isProjectStatus(r.status) ? r.status : "to_draw",
    clientId: r.client_id,
    clientName: clientName(r.client),
    artistId: r.artist_id,
    bodyZone: r.body_zone,
    dimensions: r.dimensions,
    style: r.style,
    refs: r.refs,
    artisticNotes: r.artistic_notes,
    updatedAt: r.updated_at,
  };
}

export type ProjectList =
  { status: "ok"; projects: Project[]; truncated: boolean } | { status: "missing-migration" };

export async function listProjects(filter: ProjectStatus | null): Promise<ProjectList> {
  const { current } = await requireStudio();
  const supabase = await createClient();
  let query = supabase
    .from("projects")
    .select(SELECT)
    .eq("studio_id", current.studioId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(PROJECT_LIST_LIMIT + 1);
  if (filter) query = query.eq("status", filter);
  const { data, error } = await query;
  if (error) {
    if (PROJECTS_MISSING.has(error.code)) return { status: "missing-migration" };
    console.error("[projects] list", error.code, error.message);
    throw new Error("Lecture des projets impossible.");
  }
  const rows = (data ?? []) as unknown as Row[];
  return {
    status: "ok",
    projects: rows.slice(0, PROJECT_LIST_LIMIT).map(toProject),
    truncated: rows.length > PROJECT_LIST_LIMIT,
  };
}

export type ProjectDetail =
  | { status: "ok"; project: Project; sessions: ProjectSession[] }
  | { status: "not-found" }
  | { status: "missing-migration" };

export async function getProject(id: string): Promise<ProjectDetail> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { status: "not-found" };
  const { current } = await requireStudio();
  const supabase = await createClient();

  const [proj, appts] = await Promise.all([
    supabase
      .from("projects")
      .select(SELECT)
      .eq("id", id)
      .eq("studio_id", current.studioId)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("appointments")
      .select("id, title, kind, starts_at, ends_at, artist_id")
      .eq("studio_id", current.studioId)
      .eq("project_id", id)
      .is("deleted_at", null)
      .order("starts_at")
      .limit(200),
  ]);

  for (const res of [proj, appts]) {
    if (res.error) {
      if (PROJECTS_MISSING.has(res.error.code)) return { status: "missing-migration" };
      console.error("[projects] get", res.error.code, res.error.message);
      throw new Error("Lecture du projet impossible.");
    }
  }
  if (!proj.data) return { status: "not-found" };

  const sessions = (
    (appts.data ?? []) as {
      id: string;
      title: string;
      kind: string;
      starts_at: string;
      ends_at: string;
      artist_id: string | null;
    }[]
  ).map((a) => {
    const s = utcToWall(a.starts_at);
    return {
      id: a.id,
      title: a.title,
      kind: a.kind,
      dateKey: s.dateKey,
      startTime: s.time,
      endTime: utcToWall(a.ends_at).time,
      artistId: a.artist_id,
    };
  });

  return { status: "ok", project: toProject(proj.data as unknown as Row), sessions };
}

// Projets proposés dans le formulaire du planning. null = migration pas encore appliquée.
export async function listProjectOptions(): Promise<ProjectOption[] | null> {
  const { current } = await requireStudio();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, title, client:clients(first_name, last_name)")
    .eq("studio_id", current.studioId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(PROJECT_LIST_LIMIT);
  if (error) {
    if (!PROJECTS_MISSING.has(error.code)) {
      console.error("[projects] options", error.code, error.message);
    }
    return null;
  }
  return ((data ?? []) as unknown as Pick<Row, "id" | "title" | "client">[]).map((r) => ({
    id: r.id,
    title: r.title,
    clientName: clientName(r.client),
  }));
}

// Annuaire du studio (e-mail des membres) pour afficher et choisir l'artiste.
export async function listArtists(): Promise<{ userId: string; email: string }[]> {
  const { current } = await requireStudio();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("inky_studio_directory", {
    p_studio: current.studioId,
  });
  if (error) {
    console.error("[projects] directory", error.code, error.message);
    return [];
  }
  return ((data ?? []) as { user_id: string; email: string | null }[]).map((m) => ({
    userId: m.user_id,
    email: m.email ?? "—",
  }));
}
