import { TZDate } from "@date-fns/tz";
import {
  addDays,
  addMonths,
  addWeeks,
  format,
  isValid,
  parse,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { fr } from "date-fns/locale";

// Tout le planning raisonne à l'heure du studio, quel que soit le fuseau du serveur ou du navigateur.
export const STUDIO_TZ = "Europe/Paris";

export const VIEWS = ["jour", "semaine", "mois"] as const;
export type PlanningView = (typeof VIEWS)[number];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function parseView(value: unknown): PlanningView {
  return typeof value === "string" && (VIEWS as readonly string[]).includes(value)
    ? (value as PlanningView)
    : "semaine";
}

export function todayKey(now = new Date()): string {
  return format(new TZDate(now, STUDIO_TZ), "yyyy-MM-dd");
}

// "2026-11-26" -> date valide, sinon aujourd'hui.
export function parseDateKey(value: unknown, now = new Date()): string {
  if (typeof value !== "string" || !DATE_RE.test(value)) return todayKey(now);
  const d = parse(value, "yyyy-MM-dd", new Date(2000, 0, 1));
  if (!isValid(d) || format(d, "yyyy-MM-dd") !== value) return todayKey(now);
  const year = d.getFullYear();
  return year < 2000 || year > 2100 ? todayKey(now) : value;
}

// Date "murale" à Paris (minuit) pour une clé de jour.
function wall(key: string): TZDate {
  const [y, m, d] = key.split("-").map(Number);
  return new TZDate(y, m - 1, d, STUDIO_TZ);
}

function key(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function isValidTime(value: string): boolean {
  return TIME_RE.test(value);
}

// "2026-11-26" + "14:30" (heure de Paris) -> instant UTC ISO.
export function wallToUtcIso(dateKey: string, time: string): string {
  const [h, min] = time.split(":").map(Number);
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(new TZDate(y, m - 1, d, h, min, STUDIO_TZ).getTime()).toISOString();
}

// Instant UTC -> jour et minutes depuis minuit à Paris.
export function utcToWall(iso: string): { dateKey: string; minutes: number; time: string } {
  const z = new TZDate(new Date(iso), STUDIO_TZ);
  return {
    dateKey: format(z, "yyyy-MM-dd"),
    minutes: z.getHours() * 60 + z.getMinutes(),
    time: format(z, "HH:mm"),
  };
}

export type PlanningRange = {
  view: PlanningView;
  anchor: string; // jour affiché / de référence
  days: string[]; // jours de la grille (1, 7 ou 42)
  fromIso: string; // début inclus (UTC)
  toIso: string; // fin exclue (UTC)
  title: string;
  prev: string;
  next: string;
};

export function rangeFor(view: PlanningView, anchor: string): PlanningRange {
  const a = wall(anchor);
  let start: TZDate;
  let count: number;
  let prev: Date;
  let next: Date;
  let title: string;

  if (view === "jour") {
    start = a;
    count = 1;
    prev = addDays(a, -1);
    next = addDays(a, 1);
    title = format(a, "EEEE d MMMM yyyy", { locale: fr });
  } else if (view === "semaine") {
    start = startOfWeek(a, { weekStartsOn: 1 });
    count = 7;
    prev = addWeeks(a, -1);
    next = addWeeks(a, 1);
    const end = addDays(start, 6);
    title =
      start.getMonth() === end.getMonth()
        ? `${format(start, "d", { locale: fr })} – ${format(end, "d MMMM yyyy", { locale: fr })}`
        : `${format(start, "d MMM", { locale: fr })} – ${format(end, "d MMM yyyy", { locale: fr })}`;
  } else {
    start = startOfWeek(startOfMonth(a), { weekStartsOn: 1 });
    count = 42;
    prev = addMonths(a, -1);
    next = addMonths(a, 1);
    title = format(a, "MMMM yyyy", { locale: fr });
  }

  const days = Array.from({ length: count }, (_, i) => key(addDays(start, i)));
  return {
    view,
    anchor,
    days,
    fromIso: wallToUtcIso(days[0], "00:00"),
    toIso: wallToUtcIso(key(addDays(wall(days[days.length - 1]), 1)), "00:00"),
    title: title.charAt(0).toUpperCase() + title.slice(1),
    prev: key(prev),
    next: key(next),
  };
}

export function dayLabel(dateKey: string, pattern: string): string {
  return format(wall(dateKey), pattern, { locale: fr });
}

export function sameMonth(dateKey: string, anchor: string): boolean {
  return dateKey.slice(0, 7) === anchor.slice(0, 7);
}
