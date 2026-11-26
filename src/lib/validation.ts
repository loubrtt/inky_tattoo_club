import { z } from "zod";

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

export type FormState = { ok?: boolean; message?: string; errors?: FieldErrors };
