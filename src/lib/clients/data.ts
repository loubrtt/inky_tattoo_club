import "server-only";
import { createClient } from "@/lib/supabase/server";
import { requireStudio } from "@/lib/auth/dal";
import type { ClientRow } from "@/lib/supabase/types";

export const CLIENT_LIST_LIMIT = 500;

// Le studio vient toujours du contexte serveur, jamais d'un paramètre fourni par l'appelant.
export async function listClients(): Promise<{ rows: ClientRow[]; truncated: boolean }> {
  const { current } = await requireStudio();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, first_name, last_name, email, project_summary, created_at")
    .eq("studio_id", current.studioId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(CLIENT_LIST_LIMIT + 1);
  if (error) {
    console.error("[clients] list", error.code, error.message);
    throw new Error("Lecture des fiches impossible.");
  }
  const rows = (data ?? []) as ClientRow[];
  return { rows: rows.slice(0, CLIENT_LIST_LIMIT), truncated: rows.length > CLIENT_LIST_LIMIT };
}

export async function countClients(): Promise<number | null> {
  const { current } = await requireStudio();
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("studio_id", current.studioId)
    .is("deleted_at", null);
  if (error) {
    console.error("[clients] count", error.code, error.message);
    return null;
  }
  return count ?? 0;
}
