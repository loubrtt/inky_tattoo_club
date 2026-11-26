import "server-only";
import { createClient } from "@/lib/supabase/server";
import { requireStudio } from "@/lib/auth/dal";
import { canSeeMoney } from "@/lib/roles";
import {
  PAYMENT_METHODS,
  QUOTE_STATUSES,
  summarize,
  type Payment,
  type PaymentMethod,
  type Quote,
  type QuoteStatus,
} from "./types";

export const QUOTES_MISSING = new Set(["PGRST205", "42P01", "PGRST200"]);
export const QUOTE_LIST_LIMIT = 300;

type PaymentRow = {
  id: string;
  paid_on: string;
  amount_cents: number;
  method: string;
  deleted_at: string | null;
};
type QuoteRow = {
  id: string;
  project_id: string;
  total_cents: number;
  deposit_cents: number;
  status: string;
  payments: PaymentRow[] | null;
};

const QUOTE_SELECT =
  "id, project_id, total_cents, deposit_cents, status, payments(id, paid_on, amount_cents, method, deleted_at)";

function toQuote(r: QuoteRow): Quote {
  const payments: Payment[] = (r.payments ?? [])
    .filter((p) => !p.deleted_at)
    .map((p) => ({
      id: p.id,
      paidOn: p.paid_on,
      amountCents: p.amount_cents,
      method: (PAYMENT_METHODS as readonly string[]).includes(p.method)
        ? (p.method as PaymentMethod)
        : "other",
    }))
    .sort((a, b) => a.paidOn.localeCompare(b.paidOn));
  return {
    id: r.id,
    projectId: r.project_id,
    totalCents: r.total_cents,
    depositCents: r.deposit_cents,
    status: (QUOTE_STATUSES as readonly string[]).includes(r.status)
      ? (r.status as QuoteStatus)
      : "sent",
    payments,
    ...summarize(r.total_cents, payments),
  };
}

export type ProjectQuote =
  { status: "ok"; quote: Quote | null } | { status: "forbidden" } | { status: "missing-migration" };

export async function getProjectQuote(projectId: string): Promise<ProjectQuote> {
  const { current } = await requireStudio();
  if (!canSeeMoney(current.role)) return { status: "forbidden" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotes")
    .select(QUOTE_SELECT)
    .eq("studio_id", current.studioId)
    .eq("project_id", projectId)
    .maybeSingle();
  if (error) {
    if (QUOTES_MISSING.has(error.code)) return { status: "missing-migration" };
    console.error("[quotes] get", error.code, error.message);
    throw new Error("Lecture du devis impossible.");
  }
  return { status: "ok", quote: data ? toQuote(data as unknown as QuoteRow) : null };
}

export type QuoteListItem = Quote & { projectTitle: string; clientName: string };

export type QuoteList =
  | { status: "ok"; quotes: QuoteListItem[]; truncated: boolean }
  | { status: "forbidden" }
  | { status: "missing-migration" };

export async function listQuotes(): Promise<QuoteList> {
  const { current } = await requireStudio();
  if (!canSeeMoney(current.role)) return { status: "forbidden" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotes")
    .select(
      `${QUOTE_SELECT}, project:projects!inner(title, deleted_at, client:clients(first_name, last_name))`,
    )
    .eq("studio_id", current.studioId)
    .is("project.deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(QUOTE_LIST_LIMIT + 1);
  if (error) {
    if (QUOTES_MISSING.has(error.code)) return { status: "missing-migration" };
    console.error("[quotes] list", error.code, error.message);
    throw new Error("Lecture des devis impossible.");
  }
  type Joined = QuoteRow & {
    project: {
      title: string;
      client: { first_name: string | null; last_name: string | null } | null;
    } | null;
  };
  const rows = (data ?? []) as unknown as Joined[];
  return {
    status: "ok",
    truncated: rows.length > QUOTE_LIST_LIMIT,
    quotes: rows.slice(0, QUOTE_LIST_LIMIT).map((r) => {
      const c = r.project?.client;
      return {
        ...toQuote(r),
        projectTitle: r.project?.title ?? "Projet",
        clientName: c ? `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || "Sans nom" : "—",
      };
    }),
  };
}
