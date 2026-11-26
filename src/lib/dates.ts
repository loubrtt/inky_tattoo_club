const TZ = "Europe/Paris";

// Toutes les dates sont affichées à l'heure du studio, quel que soit le fuseau du serveur.
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR", { timeZone: TZ });
}

export function formatLongToday(now = new Date()): string {
  return now.toLocaleDateString("fr-FR", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
