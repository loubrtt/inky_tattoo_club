// Contenu de la landing publique du studio.
// Chaque valeur à `null` s'affiche sur la page comme un emplacement « À compléter ».
// Rien ici ne doit contenir de donnée privée : cette page est visible par tout le monde.

export type Artist = {
  name: string | null;
  styles: string | null;
  bio: string | null;
  /** Identifiant Instagram sans @ ni lien, ex. "inky.tattoo". */
  instagram: string | null;
};

export type OpeningHours = { days: string; hours: string | null };

export const LANDING = {
  studioName: "INKY TATTOO",
  tagline: null as string | null,
  intro: null as string | null,
  about: {
    title: null as string | null,
    text: null as string | null,
    styles: [] as string[],
  },
  artists: [
    { name: null, styles: null, bio: null, instagram: null },
    { name: null, styles: null, bio: null, instagram: null },
    { name: null, styles: null, bio: null, instagram: null },
  ] as Artist[],
  practical: {
    address: null as string | null,
    city: null as string | null,
    access: null as string | null,
    hours: [] as OpeningHours[],
  },
  booking: {
    text: null as string | null,
    instagram: null as string | null,
    email: null as string | null,
    phone: null as string | null,
  },
};

const INSTAGRAM_HANDLE = /^[A-Za-z0-9._]{1,30}$/;
const EMAIL = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;
const PHONE = /^\+?[0-9 .()-]{6,20}$/;

/** Lien Instagram seulement si l'identifiant est propre, sinon null. */
export function instagramUrl(handle: string | null | undefined): string | null {
  const h = handle?.trim().replace(/^@/, "");
  return h && INSTAGRAM_HANDLE.test(h) ? `https://www.instagram.com/${h}/` : null;
}

export function mailtoUrl(email: string | null | undefined): string | null {
  const e = email?.trim();
  return e && EMAIL.test(e) ? `mailto:${e}` : null;
}

export function telUrl(phone: string | null | undefined): string | null {
  const p = phone?.trim();
  if (!p || !PHONE.test(p)) return null;
  return `tel:${p.replace(/[^0-9+]/g, "")}`;
}
