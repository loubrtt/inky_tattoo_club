export type Profile = { firstName: string; lastName: string | null; phone: string | null };

// Nom affiché : « Prénom Nom », sinon l'e-mail.
export function displayName(profile: Profile | null, email: string | null): string {
  const name = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim();
  return name || email || "Mon compte";
}
