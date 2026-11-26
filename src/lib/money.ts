// Montants saisis en euros (« 1 250,50 », « 80 », « 80.5 ») -> centimes entiers.
// null si la saisie n'est pas un montant valide (max 999 999,99 €, 2 décimales).
export const MAX_CENTS = 99_999_999;

export function parseEuros(input: string): number | null {
  const cleaned = input.replace(/[\s  €]/g, "").replace(",", ".");
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(cleaned)) return null;
  const [units, decimals = ""] = cleaned.split(".");
  const cents = Number(units) * 100 + Number(decimals.padEnd(2, "0"));
  return cents <= MAX_CENTS ? cents : null;
}

const euros = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

export function formatEuros(cents: number): string {
  return euros.format(cents / 100);
}

// Valeur à remettre dans un champ de saisie (« 1250,5 » -> « 1250,50 »).
export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}
