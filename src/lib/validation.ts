import { z } from "zod";
import { APPOINTMENT_KINDS } from "@/lib/planning/types";
import { STUDIO_ROLES } from "@/lib/supabase/types";
import { THEMES } from "@/lib/theme";
import { PROJECT_STATUSES } from "@/lib/projects/types";
import { PAYMENT_METHODS, QUOTE_STATUSES } from "@/lib/quotes/types";
import { parseEuros } from "@/lib/money";

const email = z.string().trim().toLowerCase().max(254).pipe(z.email("Adresse e-mail invalide."));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Mot de passe requis.").max(200),
});

export const forgotSchema = z.object({ email });

export const newPasswordSchema = z
  .object({
    // 72 : limite de bcrypt côté Supabase Auth.
    password: z.string().min(8, "8 caractères minimum.").max(72, "72 caractères maximum."),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Les deux mots de passe ne correspondent pas.",
  });

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `${max} caractères maximum.`)
    .transform((v) => (v === "" ? null : v));

export const clientSchema = z.object({
  firstName: z.string().trim().min(1, "Prénom requis.").max(80, "80 caractères maximum."),
  lastName: z.string().trim().min(1, "Nom requis.").max(80, "80 caractères maximum."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254)
    .refine((v) => v === "" || z.email().safeParse(v).success, "Adresse e-mail invalide.")
    .transform((v) => (v === "" ? null : v)),
  project: optionalText(1000),
});

const uuidOrEmpty = z
  .string()
  .trim()
  .refine((v) => v === "" || z.uuid().safeParse(v).success, "Valeur invalide.")
  .transform((v) => (v === "" ? null : v));

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Heure invalide.");

export const appointmentSchema = z
  .object({
    id: uuidOrEmpty,
    title: z.string().trim().min(1, "Titre requis.").max(120, "120 caractères maximum."),
    kind: z.enum(APPOINTMENT_KINDS, "Type invalide."),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide."),
    start: time,
    end: time,
    clientId: uuidOrEmpty,
    artistId: uuidOrEmpty,
    projectId: uuidOrEmpty,
    notes: optionalText(2000),
  })
  .refine((v) => v.end > v.start, { path: ["end"], message: "La fin doit être après le début." });

const role = z.enum(STUDIO_ROLES, "Rôle invalide.");
const memberId = z.string().trim().pipe(z.uuid("Membre invalide."));

export const inviteMemberSchema = z.object({ email, role });

export const memberRoleSchema = z.object({ userId: memberId, role });

export const removeMemberSchema = z.object({ userId: memberId });

const requiredUuid = (message: string) => z.string().trim().pipe(z.uuid(message));

export const projectSchema = z.object({
  id: uuidOrEmpty,
  title: z.string().trim().min(1, "Titre requis.").max(120, "120 caractères maximum."),
  status: z.enum(PROJECT_STATUSES, "Statut invalide."),
  clientId: requiredUuid("Choisis un client."),
  artistId: uuidOrEmpty,
  bodyZone: optionalText(120),
  dimensions: optionalText(80),
  style: optionalText(80),
  refs: optionalText(2000),
  artisticNotes: optionalText(4000),
});

export const PROJECT_FIELDS = [
  "id",
  "title",
  "status",
  "clientId",
  "artistId",
  "bodyZone",
  "dimensions",
  "style",
  "refs",
  "artisticNotes",
] as const;

const euros = (label: string) =>
  z.string().transform((v, ctx) => {
    const cents = parseEuros(v);
    if (cents === null) {
      ctx.addIssue({ code: "custom", message: `${label} : montant invalide (ex. 250 ou 250,50).` });
      return z.NEVER;
    }
    return cents;
  });

export const quoteSchema = z
  .object({
    projectId: requiredUuid("Projet introuvable."),
    total: euros("Montant total"),
    deposit: z
      .string()
      .transform((v) => (v.trim() === "" ? "0" : v))
      .pipe(euros("Acompte")),
    status: z.enum(QUOTE_STATUSES, "Statut invalide."),
  })
  .refine((v) => v.deposit <= v.total, {
    path: ["deposit"],
    message: "L'acompte ne peut pas dépasser le montant total.",
  });

export const paymentSchema = z.object({
  quoteId: requiredUuid("Devis introuvable."),
  paidOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide."),
  amount: euros("Montant").refine((c) => c > 0, "Le montant doit être supérieur à 0."),
  method: z.enum(PAYMENT_METHODS, "Moyen de paiement invalide."),
});

export const removePaymentSchema = z.object({ id: requiredUuid("Règlement introuvable.") });

export const themeSchema = z.enum(THEMES);

export type FieldErrors = Partial<Record<string, string>>;

export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

// FormData -> objet de chaînes (les champs absents deviennent "").
export function formToObject(formData: FormData, keys: readonly string[]) {
  return Object.fromEntries(keys.map((k) => [k, String(formData.get(k) ?? "")]));
}

export type FormState = {
  ok?: boolean;
  message?: string;
  errors?: FieldErrors;
  id?: string;
  attempt?: number;
};
