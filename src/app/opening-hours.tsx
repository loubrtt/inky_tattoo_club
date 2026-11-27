"use client";

import { useEffect, useState } from "react";
import {
  closureLabel,
  groupWeek,
  openStatus,
  parisNow,
  upcomingClosures,
  weekdayOf,
  DAY_SHORT,
  type Closure,
  type OpenStatus,
  type Week,
} from "@/lib/landing/hours";

// Horaires de la landing : l'état « ouvert / fermé » et le jour en cours sont calculés dans
// le navigateur (heure de Paris) et mis à jour chaque minute, sans attendre un rechargement.
export function OpeningHours({
  week,
  closures,
  today: serverToday,
}: {
  week: Week;
  closures: Closure[];
  today: string;
}) {
  const [now, setNow] = useState<{ dateKey: string; minutes: number } | null>(null);

  useEffect(() => {
    const tick = () => setNow(parisNow());
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 60_000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, []);

  const rows = groupWeek(week);
  const today = now?.dateKey ?? serverToday;
  const todayShort = DAY_SHORT[weekdayOf(today)];
  const status: OpenStatus | null = now ? openStatus(week, closures, now) : null;
  const upcoming = upcomingClosures(closures, today).slice(0, 5);

  const isToday = (days: string) => {
    const [a, b] = days.split(" – ");
    const i = DAY_SHORT.indexOf(a);
    const j = b ? DAY_SHORT.indexOf(b) : i;
    const t = DAY_SHORT.indexOf(todayShort);
    return now !== null && t >= i && t <= j;
  };

  return (
    <>
      <p
        aria-live="polite"
        className={`border-bone/12 mt-4 inline-flex min-h-9 items-center gap-2.5 rounded-full border px-3.5 text-sm ${
          status ? "" : "invisible"
        }`}
      >
        {/* Ouvert : point rose avec onde « sonar » ; fermé : point éteint, sans animation. */}
        <span aria-hidden className="relative grid size-2.5 place-items-center">
          {status?.open && (
            <>
              <span className="bg-flash absolute inset-0 rounded-full opacity-70 motion-safe:animate-[sonar_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
              <span className="bg-flash absolute inset-0 rounded-full opacity-70 motion-safe:animate-[sonar_2s_cubic-bezier(0,0,0.2,1)_1s_infinite]" />
            </>
          )}
          <span
            className={`relative size-2.5 rounded-full ${
              status?.open ? "bg-flash shadow-[0_0_10px_var(--color-flash)]" : "bg-bone-dim"
            }`}
          />
        </span>
        {status?.label ?? "…"}
      </p>
      <table className="mt-5 text-left text-base">
        <tbody>
          {rows.map((h) => {
            const current = isToday(h.days);
            return (
              <tr key={h.days} className={current ? "text-bone" : undefined}>
                <th
                  scope="row"
                  className={`py-1 pr-10 font-normal ${current ? "text-flash" : "text-bone-dim"}`}
                >
                  {h.days}
                  {current && <span className="sr-only"> (aujourd’hui)</span>}
                </th>
                <td className="py-1 tabular-nums">{h.hours ?? "Fermé"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {upcoming.length > 0 && (
        <div className="mt-7">
          <h4 className="font-label text-bone-dim text-[11px] tracking-[0.18em] uppercase">
            Fermetures exceptionnelles
          </h4>
          <ul className="mt-2.5 grid gap-1 text-base">
            {upcoming.map((c) => (
              <li key={`${c.from}-${c.to}`}>{closureLabel(c)}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
