// Contenu de la landing publique d'un studio, modifiable dans le dashboard (« Site public »)
// et stocké dans studio_sites.content. Chaque valeur à null s'affiche « à compléter ».
// Tout ce qui est ici est PUBLIC : jamais de donnée privée.

export type Artist = {
  name: string | null;
  styles: string | null;
  bio: string | null;
  /** Identifiant Instagram sans @ ni lien, ex. "inky.tattoo". */
  instagram: string | null;
};

export type OpeningHours = { days: string; hours: string | null };

export type LandingContent = {
  tagline: string | null;
  intro: string | null;
  about: { title: string | null; text: string | null; styles: string[] };
  artists: Artist[];
  practical: {
    address: string | null;
    city: string | null;
    access: string | null;
    hours: OpeningHours[];
  };
  booking: {
    text: string | null;
    instagram: string | null;
    email: string | null;
    phone: string | null;
  };
};

// Nom affiché si la base ne répond pas.
export const DEFAULT_STUDIO_NAME = "INKY TATTOO";

export const EMPTY_ARTIST: Artist = { name: null, styles: null, bio: null, instagram: null };

export const EMPTY_LANDING: LandingContent = {
  tagline: null,
  intro: null,
  about: { title: null, text: null, styles: [] },
  artists: [],
  practical: { address: null, city: null, access: null, hours: [] },
  booking: { text: null, instagram: null, email: null, phone: null },
};

export const INSTAGRAM_HANDLE = /^[A-Za-z0-9._]{1,30}$/;
export const PHONE = /^\+?[0-9 .()-]{6,20}$/;
const EMAIL = /^[^\s@<>"?]+@[^\s@<>"?]+\.[^\s@<>"?]+$/;

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
