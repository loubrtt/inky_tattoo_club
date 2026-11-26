import { z } from "zod";
import { APPOINTMENT_KINDS } from "@/lib/planning/types";
import { STUDIO_ROLES } from "@/lib/supabase/types";
import { THEMES } from "@/lib/theme";

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
    notes: optionalText(2000),
  })
  .refine((v) => v.end > v.start, { path: ["end"], message: "La fin doit être après le début." });

const role = z.enum(STUDIO_ROLES, "Rôle invalide.");
const memberId = z.string().trim().pipe(z.uuid("Membre invalide."));

export const inviteMemberSchema = z.object({ email, role });

export const memberRoleSchema = z.object({ userId: memberId, role });

export const removeMemberSchema = z.object({ userId: memberId });

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
