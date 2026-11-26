"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import type { Appointment, Member } from "@/lib/planning/types";
import { dayLabel, STUDIO_TZ } from "@/lib/planning/time";
import { layoutDay } from "./layout-events";
import { colorFor } from "./colors";
import { planningHref } from "./links";

const HOUR = 48; // hauteur d'une heure en px
const HOURS = Array.from({ length: 24 }, (_, h) => h);

function parisNow() {
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
      .formatToParts(new Date())
      .map((p) => [p.type, p.value]),
  );
  return {
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
    min: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

export function TimeGrid({
  view,
  days,
  today,
  appointments,
  members,
  selectedId,
  onSelect,
  onCreate,
}: {
  view: "jour" | "semaine";
  days: string[];
  today: string;
  appointments: Appointment[];
  members: Map<string, Member>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: (date: string, start: string) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState<{ dateKey: string; min: number } | null>(null);

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = 8 * HOUR - 8;
  }, []);

  // Ligne « maintenant » calculée côté navigateur seulement (évite un écart d'hydratation).
  useEffect(() => {
    const tick = () => setNow(parisNow());
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 60_000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, []);

  const byDay = new Map(days.map((d) => [d, [] as Appointment[]]));
  for (const a of appointments) byDay.get(a.dateKey)?.push(a);

  const clickSlot = (date: string) => (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const minutes = Math.floor(((e.clientY - rect.top) / HOUR) * 2) * 30;
    const m = Math.max(0, Math.min(minutes, 23 * 60 + 30));
    onCreate(
      date,
      `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`,
    );
  };

  const cols =
    view === "semaine"
      ? "grid-cols-[3.5rem_repeat(7,minmax(5.5rem,1fr))]"
      : "grid-cols-[3.5rem_1fr]";

  return (
    <div className="flex h-[calc(100vh-14rem)] min-h-[480px] flex-col overflow-x-auto">
      <div className={`grid ${cols} border-line bg-paper sticky top-0 z-10 border-b`}>
        <div />
        {days.map((d) => (
          <Link
            key={d}
            href={planningHref("jour", d)}
            className="hover:bg-wash flex flex-col items-center gap-0.5 py-2"
          >
            <span className={`text-[11px] uppercase ${d === today ? "text-violet" : "text-muted"}`}>
              {dayLabel(d, "EEE")}
            </span>
            <span
              className={`font-display grid size-8 place-items-center rounded-full text-lg font-bold ${
                d === today ? "bg-violet text-white" : "text-ink"
              }`}
            >
              {dayLabel(d, "d")}
            </span>
          </Link>
        ))}
      </div>

      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto">
        <div className={`grid ${cols}`} style={{ height: 24 * HOUR }}>
          <div className="relative">
            {HOURS.slice(1).map((h) => (
              <span
                key={h}
                className="text-muted absolute right-2 -translate-y-1/2 text-[10px]"
                style={{ top: h * HOUR }}
              >
                {String(h).padStart(2, "0")}:00
              </span>
            ))}
          </div>

          {days.map((d) => (
            <div
              key={d}
              onClick={clickSlot(d)}
              className="border-line relative cursor-pointer border-l"
              style={{
                backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${HOUR - 1}px, var(--color-line) ${HOUR - 1}px, var(--color-line) ${HOUR}px)`,
              }}
            >
              {layoutDay(byDay.get(d) ?? []).map(({ appt, col, cols: n }) => {
                const c = colorFor(appt, members);
                const height = Math.max(((appt.endMin - appt.startMin) / 60) * HOUR, 20);
                const selected = appt.id === selectedId;
                return (
                  <button
                    key={appt.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(appt.id);
                    }}
                    className={`ev absolute overflow-hidden rounded-lg border-l-4 px-2 py-1 text-left text-[11px] leading-tight transition hover:z-20 hover:shadow-md focus-visible:z-20 ${
                      selected ? "ring-offset-paper z-20 shadow-lg ring-2 ring-offset-1" : ""
                    } ${appt.kind === "unavailable" ? "bg-[repeating-linear-gradient(135deg,transparent_0,transparent_6px,rgba(0,0,0,0.04)_6px,rgba(0,0,0,0.04)_12px)]" : ""}`}
                    style={{
                      top: (appt.startMin / 60) * HOUR + 1,
                      height: height - 2,
                      left: `calc(${(col / n) * 100}% + 2px)`,
                      width: `calc(${100 / n}% - 4px)`,
                      backgroundColor: c.bg,
                      borderColor: c.border,
                      color: c.text,
                      ["--ev" as string]: c.border,
                      ["--tw-ring-color" as string]: c.border,
                    }}
                  >
                    <strong className="block truncate">{appt.title}</strong>
                    {height >= 34 && (
                      <span className="block truncate opacity-80">
                        {appt.startTime} – {appt.endTime}
                      </span>
                    )}
                    {height >= 52 && appt.clientName && (
                      <span className="block truncate opacity-80">{appt.clientName}</span>
                    )}
                  </button>
                );
              })}

              {now?.dateKey === d && (
                <div
                  className="pointer-events-none absolute inset-x-0 z-30"
                  style={{ top: (now.min / 60) * HOUR }}
                >
                  <div className="absolute -top-1.5 -left-1.5 size-3 rounded-full bg-[#e5484d]" />
                  <div className="h-0.5 bg-[#e5484d]" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
