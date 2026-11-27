// Horaires d'ouverture et fermetures exceptionnelles du studio (heure de Paris).
// Module sans dépendance serveur : utilisé par la landing (navigateur), le dashboard et le planning.

export type Slot = { from: string; to: string }; // "HH:mm"
export type WeekDay = { open: boolean; slots: Slot[] };
/** 7 jours, du lundi (0) au dimanche (6). */
export type Week = WeekDay[];
export type Closure = { from: string; to: string; reason: string | null }; // "yyyy-MM-dd", inclus

export const DAY_NAMES = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
export const DAY_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];

export const STUDIO_TZ = "Europe/Paris";

export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Jour de la semaine d'une date "yyyy-MM-dd" : 0 = lundi … 6 = dimanche. */
export function weekdayOf(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

export function addDaysKey(dateKey: string, n: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** Date courte en français, ex. « 24 déc. ». */
export function shortDate(dateKey: string): string {
  const [, m, d] = dateKey.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

/** Jour et minute actuels à Paris, quel que soit le fuseau de la machine. */
export function parisNow(now = new Date()): { dateKey: string; minutes: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: STUDIO_TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  return {
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

export function closureOn(closures: Closure[], dateKey: string): Closure | null {
  return closures.find((c) => c.from <= dateKey && dateKey <= c.to) ?? null;
}

/** Créneaux ouverts d'un jour donné (vide = fermé ce jour-là, fermeture comprise). */
export function openSlotsOn(week: Week, closures: Closure[], dateKey: string): Slot[] {
  if (closureOn(closures, dateKey)) return [];
  const day = week[weekdayOf(dateKey)];
  return day?.open ? day.slots : [];
}

/** Fermetures en cours ou à venir, triées. */
export function upcomingClosures(closures: Closure[], today: string): Closure[] {
  return closures
    .filter((c) => c.to >= today)
    .sort((a, b) => (a.from < b.from ? -1 : a.from > b.from ? 1 : 0));
}

export function closureLabel(c: Closure): string {
  const dates =
    c.from === c.to ? `Le ${shortDate(c.from)}` : `Du ${shortDate(c.from)} au ${shortDate(c.to)}`;
  return c.reason ? `${dates} · ${c.reason}` : dates;
}

const slotText = (slots: Slot[]) => slots.map((s) => `${s.from} – ${s.to}`).join(" · ");

/** Jours consécutifs aux mêmes horaires regroupés : « Mar – Sam » / « 10:00 – 19:00 ». */
export function groupWeek(week: Week): { days: string; hours: string | null }[] {
  const rows: { start: number; end: number; hours: string | null }[] = [];
  week.forEach((day, i) => {
    const hours = day.open && day.slots.length ? slotText(day.slots) : null;
    const last = rows[rows.length - 1];
    if (last && last.hours === hours && last.end === i - 1) last.end = i;
    else rows.push({ start: i, end: i, hours });
  });
  return rows.map((r) => ({
    days: r.start === r.end ? DAY_SHORT[r.start] : `${DAY_SHORT[r.start]} – ${DAY_SHORT[r.end]}`,
    hours: r.hours,
  }));
}

/** label : phrase complète ; detail : la suite seule, affichée sous l'enseigne néon. */
export type OpenStatus =
  | { open: true; label: string; detail: string }
  | { open: false; label: string; detail: string | null; exceptional: boolean };

/** « Ouvert · ferme à 19:00 » ou « Fermé · ouvre demain à 10:00 », recherche sur 60 jours. */
export function openStatus(
  week: Week,
  closures: Closure[],
  now: { dateKey: string; minutes: number },
): OpenStatus {
  const todaySlots = openSlotsOn(week, closures, now.dateKey);
  const current = todaySlots.find(
    (s) => toMinutes(s.from) <= now.minutes && now.minutes < toMinutes(s.to),
  );
  if (current)
    return { open: true, label: `Ouvert · ferme à ${current.to}`, detail: `Jusqu’à ${current.to}` };

  const exceptional = closureOn(closures, now.dateKey) !== null;
  for (let i = 0; i < 60; i++) {
    const key = addDaysKey(now.dateKey, i);
    const next = openSlotsOn(week, closures, key).find(
      (s) => i > 0 || toMinutes(s.from) > now.minutes,
    );
    if (!next) continue;
    const when =
      i === 0
        ? `aujourd’hui à ${next.from}`
        : i === 1
          ? `demain à ${next.from}`
          : i < 7
            ? `${DAY_NAMES[weekdayOf(key)]} à ${next.from}`
            : `le ${shortDate(key)} à ${next.from}`;
    return {
      open: false,
      exceptional,
      label: `${exceptional ? "Fermé exceptionnellement" : "Fermé"} · ouvre ${when}`,
      detail: `${exceptional ? "Fermeture exceptionnelle · on" : "On"} rallume ${when}`,
    };
  }
  return {
    open: false,
    exceptional,
    label: exceptional ? "Fermé exceptionnellement" : "Fermé",
    detail: exceptional ? "Fermeture exceptionnelle" : null,
  };
}
