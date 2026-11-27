import { z } from "zod";
import { APPOINTMENT_KINDS } from "@/lib/planning/types";
import { INSTAGRAM_HANDLE, PHONE } from "@/lib/landing/content";
import { STUDIO_ROLES } from "@/lib/supabase/types";
import { THEMES } from "@/lib/theme";
import { PROJECT_STATUSES } from "@/lib/projects/types";
import { PAYMENT_METHODS, QUOTE_STATUSES } from "@/lib/quotes/types";
import { parseEuros } from "@/lib/money";
import { TRANSIT_LINE_IDS } from "@/lib/landing/transit";

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

// Champ facultatif : null (valeur déjà enregistrée) est relu comme une chaîne vide.
const emptyIfNull = (v: unknown) => (v === null ? "" : v);

const optionalText = (max: number) =>
  z.preprocess(
    emptyIfNull,
    z
      .string()
      .trim()
      .max(max, `${max} caractères maximum.`)
      .transform((v) => (v === "" ? null : v)),
  );

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

// Redimensionnement d'un rendez-vous depuis la grille : nouvelles heures, même jour.
export const resizeAppointmentSchema = z
  .object({
    id: z.string().trim().pipe(z.uuid("Rendez-vous introuvable.")),
    start: time,
    end: time,
  })
  .refine((v) => v.end > v.start, { path: ["end"], message: "La fin doit être après le début." });

// Déplacement d'un rendez-vous depuis la grille : nouveau jour et nouvelle heure de début,
// la durée est gardée côté serveur.
export const moveAppointmentSchema = z.object({
  id: z.string().trim().pipe(z.uuid("Rendez-vous introuvable.")),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide."),
  start: time,
});

// Site public (landing) : tout est facultatif, vide = « à compléter » sur la page.
const instagramHandle = z.preprocess(
  emptyIfNull,
  z
    .string()
    .trim()
    .transform((v) => v.replace(/^@/, ""))
    .refine(
      (v) => v === "" || INSTAGRAM_HANDLE.test(v),
      "Identifiant Instagram invalide (sans @ ni lien).",
    )
    .transform((v) => (v === "" ? null : v)),
);

const optionalEmail = z.preprocess(
  emptyIfNull,
  z
    .string()
    .trim()
    .toLowerCase()
    .max(254)
    .refine((v) => v === "" || z.email().safeParse(v).success, "Adresse e-mail invalide.")
    .transform((v) => (v === "" ? null : v)),
);

const optionalPhone = z.preprocess(
  emptyIfNull,
  z
    .string()
    .trim()
    .refine((v) => v === "" || PHONE.test(v), "Numéro invalide.")
    .transform((v) => (v === "" ? null : v)),
);

// Horaires : 7 jours (lundi -> dimanche), 1 ou 2 créneaux par jour ouvert.
const slotSchema = z
  .object({ from: time, to: time })
  .refine((v) => v.to > v.from, { path: ["to"], message: "La fin doit être après le début." });

const weekDaySchema = z
  .object({ open: z.boolean(), slots: z.array(slotSchema).max(2, "2 créneaux maximum.") })
  .refine((d) => !d.open || d.slots.length > 0, {
    path: ["slots"],
    message: "Ajoute au moins un créneau.",
  })
  .refine((d) => d.slots.length < 2 || d.slots[1].from >= d.slots[0].to, {
    path: ["slots", 1, "from"],
    message: "Le 2e créneau doit commencer après la fin du 1er.",
  })
  .transform((d) => (d.open ? d : { open: false, slots: [] }));

const realDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide.")
  .refine((v) => {
    // Zod continue après une regex en échec : on revérifie le format avant de calculer.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return true;
    const [y, m, d] = v.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === v;
  }, "Date invalide.");

const closureSchema = z
  .object({ from: realDate, to: realDate, reason: optionalText(80) })
  .refine((c) => c.to >= c.from, { path: ["to"], message: "La fin doit être après le début." });

export const landingSchema = z.object({
  tagline: optionalText(160),
  intro: optionalText(600),
  about: z.object({
    title: optionalText(120),
    text: optionalText(3000),
    styles: z
      .array(z.string().trim().min(1).max(40, "40 caractères maximum par style."))
      .max(20, "20 styles maximum."),
  }),
  artists: z
    .array(
      z.object({
        name: optionalText(80),
        styles: optionalText(120),
        bio: optionalText(600),
        instagram: instagramHandle,
      }),
    )
    .max(20, "20 artistes maximum."),
  practical: z.object({
    address: optionalText(160),
    city: optionalText(120),
    access: optionalText(600),
    hours: z
      .array(
        z.object({
          days: z.string().trim().min(1, "Jours requis.").max(40, "40 caractères maximum."),
          hours: optionalText(40),
        }),
      )
      .max(14, "14 lignes maximum."),
    // null = horaires jamais réglés (anciens contenus : on affiche alors `hours`).
    week: z.array(weekDaySchema).length(7).nullable().default(null),
    closures: z.array(closureSchema).max(30, "30 fermetures maximum.").default([]),
    metro: z
      .array(
        z.object({
          line: z.enum(TRANSIT_LINE_IDS, "Ligne inconnue."),
          station: z.string().trim().min(1, "Station requise.").max(60, "60 caractères maximum."),
        }),
      )
      .max(6, "6 stations maximum.")
      .default([]),
    // Rempli par le serveur (géocodage de l'adresse), jamais par le formulaire.
    geo: z
      .object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) })
      .nullable()
      .default(null),
  }),
  booking: z.object({
    text: optionalText(1000),
    instagram: instagramHandle,
    email: optionalEmail,
    phone: optionalPhone,
  }),
});

export type LandingInput = z.input<typeof landingSchema>;

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

// Mon compte : prénom obligatoire, nom et téléphone facultatifs.
export const profileSchema = z.object({
  firstName: z.string().trim().min(1, "Prénom requis.").max(80, "80 caractères maximum."),
  lastName: optionalText(80),
  phone: optionalPhone,
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

// Erreurs indexées par chemin complet (« artists.0.instagram ») pour les formulaires imbriqués.
export function nestedFieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.join(".") : "form";
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
