"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Appointment, ClientOption, Member } from "@/lib/planning/types";
import { VIEWS, type PlanningRange, type PlanningView } from "@/lib/planning/time";
import { TimeGrid } from "./time-grid";
import { MonthGrid } from "./month-grid";
import { SidePanel, type Selection } from "./side-panel";

const VIEW_LABELS: Record<PlanningView, string> = {
  jour: "Jour",
  semaine: "Semaine",
  mois: "Mois",
};

export function planningHref(view: PlanningView, date: string, rdv?: string | null) {
  const p = new URLSearchParams({ vue: view, date });
  if (rdv) p.set("rdv", rdv);
  return `/planning?${p.toString()}`;
}

function addHour(time: string) {
  const [h, m] = time.split(":").map(Number);
  const end = Math.min(h * 60 + m + 60, 23 * 60 + 59);
  return `${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`;
}

export function Planning({
  range,
  today,
  appointments,
  members,
  clients,
  initialSelected,
}: {
  range: PlanningRange;
  today: string;
  appointments: Appointment[];
  members: Member[];
  clients: ClientOption[];
  initialSelected: string | null;
}) {
  const memberMap = useMemo(() => new Map(members.map((m) => [m.userId, m])), [members]);
  const initial: Selection = initialSelected ? { mode: "view", id: initialSelected } : null;
  const [selection, setSelection] = useState<Selection>(initial);
  // Contenu gardé pendant l'animation de fermeture du panneau.
  const [shown, setShown] = useState<Selection>(initial);

  const select = useCallback(
    (next: Selection) => {
      setSelection(next);
      if (next) setShown(next);
      const id = next && next.mode !== "new" ? next.id : null;
      window.history.replaceState(null, "", planningHref(range.view, range.anchor, id));
    },
    [range.view, range.anchor],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") select(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [select]);

  const create = (date: string, start: string) =>
    select({ mode: "new", date, start, end: addHour(start) });
  const selectedId = selection && selection.mode !== "new" ? selection.id : null;
  const open = selection !== null;

  return (
    <div className="flex min-h-[calc(100vh-12rem)] flex-col">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link
          href={planningHref(range.view, today)}
          className="border-line bg-paper hover:bg-wash rounded-xl border px-3.5 py-2 font-semibold"
        >
          Aujourd&apos;hui
        </Link>
        <div className="flex">
          <Link
            href={planningHref(range.view, range.prev)}
            aria-label="Période précédente"
            className="text-muted hover:bg-violet-pale hover:text-violet grid size-9 place-items-center rounded-full text-lg"
          >
            ‹
          </Link>
          <Link
            href={planningHref(range.view, range.next)}
            aria-label="Période suivante"
            className="text-muted hover:bg-violet-pale hover:text-violet grid size-9 place-items-center rounded-full text-lg"
          >
            ›
          </Link>
        </div>
        <h1 className="font-display mr-auto text-xl font-extrabold sm:text-2xl">{range.title}</h1>
        <nav
          aria-label="Vue du planning"
          className="border-line bg-paper flex rounded-xl border p-1"
        >
          {VIEWS.map((v) => (
            <Link
              key={v}
              href={planningHref(v, range.anchor)}
              aria-current={range.view === v ? "page" : undefined}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                range.view === v ? "bg-violet-pale text-violet-dark" : "text-muted hover:text-ink"
              }`}
            >
              {VIEW_LABELS[v]}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => create(range.view === "mois" ? today : range.anchor, "10:00")}
          className="bg-violet shadow-soft hover:bg-violet-dark rounded-xl px-4 py-2 font-semibold text-white"
        >
          ＋ Créer
        </button>
      </div>

      <div className="flex min-h-0 flex-1 gap-0 lg:gap-4">
        <div className="border-line bg-paper shadow-soft min-w-0 flex-1 overflow-hidden rounded-2xl border">
          {range.view === "mois" ? (
            <MonthGrid
              range={range}
              today={today}
              appointments={appointments}
              members={memberMap}
              selectedId={selectedId}
              onSelect={(id) => select({ mode: "view", id })}
              onCreate={(date) => create(date, "10:00")}
            />
          ) : (
            <TimeGrid
              view={range.view}
              days={range.days}
              today={today}
              appointments={appointments}
              members={memberMap}
              selectedId={selectedId}
              onSelect={(id) => select({ mode: "view", id })}
              onCreate={create}
            />
          )}
        </div>

        <aside
          aria-hidden={!open}
          inert={!open}
          className={`bg-paper lg:shadow-soft fixed inset-0 z-40 transition-transform duration-300 ease-out lg:static lg:z-auto lg:shrink-0 lg:overflow-hidden lg:rounded-2xl lg:border lg:transition-[width,opacity,border-color] ${
            open
              ? "lg:border-line translate-x-0 lg:w-[420px] lg:opacity-100"
              : "translate-x-full lg:w-0 lg:translate-x-0 lg:border-transparent lg:opacity-0"
          }`}
        >
          <div className="h-full w-full overflow-y-auto lg:w-[420px]">
            <SidePanel
              key={
                shown
                  ? `${shown.mode}-${shown.mode === "new" ? `${shown.date}-${shown.start}` : shown.id}`
                  : "none"
              }
              selection={shown}
              appointments={appointments}
              members={members}
              memberMap={memberMap}
              clients={clients}
              onClose={() => select(null)}
              onEdit={(id) => select({ mode: "edit", id })}
              onView={(id) => select({ mode: "view", id })}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
