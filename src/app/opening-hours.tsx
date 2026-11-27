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
      {/* Enseigne néon (version D choisie par Lou) : « Ouvert » allumé, « Fermé » tube éteint. */}
      <div aria-live="polite" className={`mt-3 ${status ? "" : "invisible"}`}>
        <p className={`neon text-5xl leading-none ${status?.open ? "neon-on" : "neon-off"}`}>
          {status ? (status.open ? "Ouvert" : "Fermé") : "Fermé"}
        </p>
        {status?.detail && (
          <p className="neon text-bone-dim mt-2 text-2xl leading-tight">{status.detail}</p>
        )}
      </div>
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
