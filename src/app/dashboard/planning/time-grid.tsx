"use client";

import Link from "next/link";
import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { moveAppointment, resizeAppointment } from "@/lib/planning/actions";
import type { Appointment, Member } from "@/lib/planning/types";
import { dayLabel, STUDIO_TZ } from "@/lib/planning/time";
import { layoutDay } from "./layout-events";
import { colorFor } from "./colors";
import { planningHref } from "./links";

const HOUR = 48; // hauteur d'une heure en px
const HOURS = Array.from({ length: 24 }, (_, h) => h);
const SNAP = 15; // pas du glisser, en minutes
const DRAG_THRESHOLD = 4; // px avant qu'un clic devienne un déplacement
const DAY_END = 24 * 60;

// Minutes -> "HH:mm" (minuit de fin de journée -> "23:59", la base ne connaît pas 24:00).
function toTime(min: number) {
  const m = Math.min(min, DAY_END - 1);
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

// Plages fermées d'une journée = complément des créneaux ouverts sur [0, 24h].
function closedRanges(open: { from: number; to: number }[]): [number, number][] {
  const out: [number, number][] = [];
  let cursor = 0;
  for (const s of [...open].sort((a, b) => a.from - b.from)) {
    if (s.from > cursor) out.push([cursor, s.from]);
    cursor = Math.max(cursor, s.to);
  }
  if (cursor < DAY_END) out.push([cursor, DAY_END]);
  return out;
}

type Mode = "start" | "end" | "move";
type Slot = { d: string; s: number; e: number }; // jour, début et fin en minutes
type Drag = Slot & {
  id: string;
  mode: Mode;
  x0: number;
  y0: number;
  from: Slot;
  moved: boolean;
};
// Créneau modifié en attente du retour serveur ; ignoré dès que les données changent.
type Pending = Slot & { from: Slot };

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
  openHours,
}: {
  view: "jour" | "semaine";
  days: string[];
  today: string;
  appointments: Appointment[];
  members: Map<string, Member>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: (date: string, start: string) => void;
  openHours: Record<string, { from: number; to: number }[]> | null;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState<{ dateKey: string; min: number } | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [pending, setPending] = useState<Map<string, Pending>>(new Map());
  const [resizeError, setResizeError] = useState<string | null>(null);
  const suppressClick = useRef(false);

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

  // Créneau affiché : celui du glisser en cours, puis celui en attente d'enregistrement.
  const effective = (a: Appointment): Appointment => {
    let slot: Slot | null = null;
    if (drag?.id === a.id) slot = drag;
    else {
      const p = pending.get(a.id);
      if (p && p.from.d === a.dateKey && p.from.s === a.startMin && p.from.e === a.endMin) slot = p;
    }
    if (!slot || (slot.d === a.dateKey && slot.s === a.startMin && slot.e === a.endMin)) return a;
    return {
      ...a,
      dateKey: slot.d,
      startMin: slot.s,
      endMin: slot.e,
      startTime: toTime(slot.s),
      endTime: toTime(slot.e),
    };
  };

  const byDay = new Map(days.map((d) => [d, [] as Appointment[]]));
  for (const a of appointments) {
    const shown = effective(a);
    byDay.get(shown.dateKey)?.push(shown);
  }

  const columns = useRef(new Map<string, HTMLDivElement>());
  const dayAt = (x: number) => {
    for (const [d, el] of columns.current) {
      const r = el.getBoundingClientRect();
      if (x >= r.left && x < r.right) return d;
    }
    return null;
  };

  const startDrag = (appt: Appointment, mode: Mode) => (e: PointerEvent<HTMLElement>) => {
    // Souris ou stylet seulement : au doigt, glisser sert à faire défiler la grille.
    if (e.button !== 0 || (mode === "move" && e.pointerType === "touch")) return;
    e.stopPropagation();
    if (mode !== "move") e.preventDefault();
    setResizeError(null);
    const from = { d: appt.dateKey, s: appt.startMin, e: appt.endMin };
    setDrag({ id: appt.id, mode, x0: e.clientX, y0: e.clientY, from, ...from, moved: false });
  };

  const onDragMove = useEffectEvent((e: globalThis.PointerEvent) => {
    if (!drag) return;
    const dx = e.clientX - drag.x0;
    const dy = e.clientY - drag.y0;
    if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    const delta = Math.round((dy / HOUR) * (60 / SNAP)) * SNAP;
    const { from } = drag;
    let next: Slot;
    if (drag.mode === "end") {
      next = { ...from, e: Math.max(from.s + SNAP, Math.min(from.e + delta, DAY_END)) };
    } else if (drag.mode === "start") {
      next = { ...from, s: Math.min(from.e - SNAP, Math.max(from.s + delta, 0)) };
    } else {
      const start = Math.max(0, Math.min(from.s + delta, DAY_END - SNAP));
      next = {
        d: view === "semaine" ? (dayAt(e.clientX) ?? drag.d) : from.d,
        s: start,
        e: Math.min(start + (from.e - from.s), DAY_END),
      };
    }
    if (drag.moved && next.d === drag.d && next.s === drag.s && next.e === drag.e) return;
    setDrag({ ...drag, ...next, moved: true });
  });

  const onDragEnd = useEffectEvent(() => {
    if (!drag) return;
    const d = drag;
    setDrag(null);
    if (!d.moved) return; // simple clic : la fiche s'ouvre normalement
    // Le clic qui suit le relâchement ne doit pas ouvrir la fiche ni créer de rendez-vous.
    suppressClick.current = true;
    setTimeout(() => (suppressClick.current = false), 0);
    const { from } = d;
    if (d.d === from.d && d.s === from.s && d.e === from.e) return;

    setPending((m) => new Map(m).set(d.id, { d: d.d, s: d.s, e: d.e, from }));
    const forget = () =>
      setPending((m) => {
        const next = new Map(m);
        next.delete(d.id);
        return next;
      });
    const save =
      d.mode === "move"
        ? moveAppointment({ id: d.id, date: d.d, start: toTime(d.s) })
        : resizeAppointment({ id: d.id, start: toTime(d.s), end: toTime(d.e) });
    save
      .then((r) => {
        if (!r.ok) setResizeError(r.message);
        forget();
      })
      .catch(() => {
        setResizeError("Modification non enregistrée. Réessaie dans un instant.");
        forget();
      });
  });

  // Suivi au niveau de la fenêtre : le rendez-vous peut changer de colonne pendant le glisser.
  const dragging = drag !== null;
  useEffect(() => {
    if (!dragging) return;
    const move = (e: globalThis.PointerEvent) => onDragMove(e);
    const end = () => onDragEnd();
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, [dragging]);

  const clickSlot = (date: string) => (e: MouseEvent<HTMLDivElement>) => {
    if (suppressClick.current) return;
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
    <div
      className={`relative flex h-[calc(100vh-14rem)] min-h-[480px] flex-col overflow-x-auto ${
        drag?.moved
          ? drag.mode === "move"
            ? "cursor-grabbing select-none"
            : "cursor-ns-resize select-none"
          : ""
      }`}
    >
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
              ref={(el) => {
                if (el) columns.current.set(d, el);
                else columns.current.delete(d);
              }}
              onClick={clickSlot(d)}
              title={openHours && !openHours[d]?.length ? "Studio fermé ce jour-là" : undefined}
              className="border-line relative cursor-pointer border-l"
              style={{
                backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${HOUR - 1}px, var(--color-line) ${HOUR - 1}px, var(--color-line) ${HOUR}px)`,
              }}
            >
              {openHours &&
                closedRanges(openHours[d] ?? []).map(([from, to]) => (
                  <div
                    key={from}
                    aria-hidden
                    className="bg-ink/[0.045] pointer-events-none absolute inset-x-0"
                    style={{ top: (from / 60) * HOUR, height: ((to - from) / 60) * HOUR }}
                  />
                ))}
              {layoutDay(byDay.get(d) ?? []).map(({ appt, col, cols: n }) => {
                const c = colorFor(appt, members);
                const height = Math.max(((appt.endMin - appt.startMin) / 60) * HOUR, 20);
                const selected = appt.id === selectedId;
                const active = drag?.id === appt.id && drag.moved;
                // RDV qui passe minuit : pas de poignées (on raccourcirait la partie du lendemain).
                const resizable = appt.endMin < DAY_END || active;
                return (
                  <button
                    key={appt.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (suppressClick.current) return;
                      onSelect(appt.id);
                    }}
                    onPointerDown={startDrag(appt, "move")}
                    className={`ev absolute overflow-hidden rounded-lg border-l-4 px-2 py-1 text-left text-[11px] leading-tight transition hover:z-20 hover:shadow-md focus-visible:z-20 ${
                      selected || active
                        ? "ring-offset-paper z-20 shadow-lg ring-2 ring-offset-1"
                        : ""
                    } group/ev ${appt.kind === "unavailable" ? "bg-[repeating-linear-gradient(135deg,transparent_0,transparent_6px,rgba(0,0,0,0.04)_6px,rgba(0,0,0,0.04)_12px)]" : ""}`}
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
                    {resizable &&
                      (["start", "end"] as const).map((edge) => (
                        <span
                          key={edge}
                          aria-hidden
                          title={
                            edge === "start"
                              ? "Glisser pour changer le début"
                              : "Glisser pour changer la fin"
                          }
                          onPointerDown={startDrag(appt, edge)}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!suppressClick.current) onSelect(appt.id);
                          }}
                          className={`absolute inset-x-0 z-10 h-2 cursor-ns-resize touch-none ${
                            edge === "start" ? "top-0" : "bottom-0"
                          }`}
                        >
                          <span
                            className={`absolute left-1/2 h-1 w-6 -translate-x-1/2 rounded-full opacity-0 transition group-hover/ev:opacity-60 ${
                              edge === "start" ? "top-0.5" : "bottom-0.5"
                            } ${active && drag?.mode === edge ? "opacity-80" : ""}`}
                            style={{ backgroundColor: c.border }}
                          />
                        </span>
                      ))}
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

      {resizeError && (
        <div
          role="alert"
          className="bg-paper border-danger/40 text-danger shadow-soft absolute right-3 bottom-3 left-3 z-40 flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-sm sm:left-auto"
        >
          {resizeError}
          <button
            type="button"
            onClick={() => setResizeError(null)}
            className="text-muted hover:text-ink font-semibold"
          >
            OK
          </button>
        </div>
      )}
    </div>
  );
}
