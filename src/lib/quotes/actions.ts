"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStudio } from "@/lib/auth/dal";
import { logError } from "@/lib/errors";
import { canSeeMoney } from "@/lib/roles";
import { parseDateKey } from "@/lib/planning/time";
import { QUOTES_MISSING } from "@/lib/quotes/data";
import {
  fieldErrors,
  formToObject,
  paymentSchema,
  quoteSchema,
  removePaymentSchema,
  type FormState,
} from "@/lib/validation";

const FORBIDDEN: FormState = { message: "Ton rôle ne permet pas de voir ni saisir les montants." };

function dbError(scope: string, error: { code?: string; message?: string }): FormState {
  logError(scope, error);
  if (QUOTES_MISSING.has(error.code ?? "")) {
    return { message: "Les devis ne sont pas encore activés : la migration doit être appliquée." };
  }
  if (error.code === "42501") return FORBIDDEN;
  if (error.code === "23514") return { message: "Un des montants est invalide." };
  if (error.code === "23505") return { message: "Ce projet a déjà un devis. Recharge la page." };
  return { message: "Enregistrement impossible. Réessaie dans un instant." };
}

async function done(supabase: Awaited<ReturnType<typeof createClient>>, quoteId: string) {
  const { data } = await supabase.from("quotes").select("project_id").eq("id", quoteId).single();
  revalidatePath("/dashboard/devis");
  if (data?.project_id) revalidatePath(`/dashboard/projets/${data.project_id}`);
}

export async function saveQuote(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user, current } = await requireStudio();
  if (!canSeeMoney(current.role)) return FORBIDDEN;
  const parsed = quoteSchema.safeParse(
    formToObject(formData, ["projectId", "total", "deposit", "status"]),
  );
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const v = parsed.data;

  // Un devis par projet : création ou mise à jour selon qu'il existe déjà.
  const supabase = await createClient();
  const values = { total_cents: v.total, deposit_cents: v.deposit, status: v.status };
  const { data: existing, error: readError } = await supabase
    .from("quotes")
    .select("id")
    .eq("studio_id", current.studioId)
    .eq("project_id", v.projectId)
    .maybeSingle();
  if (readError) return dbError("quotes:read", readError);

  let id = existing?.id as string | undefined;
  if (id) {
    const { error } = await supabase
      .from("quotes")
      .update(values)
      .eq("id", id)
      .eq("studio_id", current.studioId);
    if (error) return dbError("quotes:update", error);
  } else {
    const { data, error } = await supabase
      .from("quotes")
      .insert({
        ...values,
        project_id: v.projectId,
        studio_id: current.studioId,
        created_by: user.id,
      })
      .select("id")
      .single();
    if (error) return dbError("quotes:create", error);
    id = data.id as string;
  }

  await done(supabase, id);
  return { ok: true, message: "Devis enregistré." };
}

export async function addPayment(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user, current } = await requireStudio();
  if (!canSeeMoney(current.role)) return FORBIDDEN;
  const parsed = paymentSchema.safeParse(
    formToObject(formData, ["quoteId", "paidOn", "amount", "method"]),
  );
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const v = parsed.data;
  if (parseDateKey(v.paidOn, new Date(0)) !== v.paidOn) {
    return { errors: { paidOn: "Date invalide." } };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("payments").insert({
    quote_id: v.quoteId,
    paid_on: v.paidOn,
    amount_cents: v.amount,
    method: v.method,
    studio_id: current.studioId,
    created_by: user.id,
  });
  if (error) return dbError("payments:create", error);

  await done(supabase, v.quoteId);
  return { ok: true, message: "Règlement ajouté.", attempt: Date.now() };
}

export async function removePayment(_prev: FormState, formData: FormData): Promise<FormState> {
  const { current } = await requireStudio();
  if (!canSeeMoney(current.role)) return FORBIDDEN;
  const parsed = removePaymentSchema.safeParse(formToObject(formData, ["id"]));
  if (!parsed.success) return { message: "Règlement introuvable." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data.id)
    .eq("studio_id", current.studioId)
    .is("deleted_at", null)
    .select("quote_id");
  if (error) return dbError("payments:remove", error);
  if (!data?.length) return { message: "Ce règlement a déjà été retiré." };

  await done(supabase, data[0].quote_id as string);
  return { ok: true, message: "Règlement retiré." };
}
