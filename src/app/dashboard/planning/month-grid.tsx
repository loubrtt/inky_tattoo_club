"use client";

import Link from "next/link";
import type { Appointment, Member } from "@/lib/planning/types";
import { dayLabel, sameMonth, type PlanningRange } from "@/lib/planning/time";
import { colorFor } from "./colors";
import { planningHref } from "./links";

const MAX_CHIPS = 3;

export function MonthGrid({
  range,
  today,
  appointments,
  members,
  selectedId,
  onSelect,
  onCreate,
}: {
  range: PlanningRange;
  today: string;
  appointments: Appointment[];
  members: Map<string, Member>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: (date: string) => void;
}) {
  const byDay = new Map(range.days.map((d) => [d, [] as Appointment[]]));
  for (const a of appointments) byDay.get(a.dateKey)?.push(a);

  return (
    <div className="flex h-[calc(100vh-14rem)] min-h-[480px] flex-col overflow-x-auto">
      <div className="border-line grid min-w-[640px] grid-cols-7 border-b">
        {range.days.slice(0, 7).map((d) => (
          <div key={d} className="text-muted py-2 text-center text-[11px] uppercase">
            {dayLabel(d, "EEE")}
          </div>
        ))}
      </div>
      <div className="grid min-w-[640px] flex-1 grid-cols-7 grid-rows-6">
        {range.days.map((d) => {
          const items = (byDay.get(d) ?? []).sort((a, b) => a.startMin - b.startMin);
          const extra = items.length - MAX_CHIPS;
          return (
            <div
              key={d}
              onClick={() => onCreate(d)}
              className={`border-line hover:bg-wash/60 min-h-0 cursor-pointer overflow-hidden border-r border-b p-1 ${
                sameMonth(d, range.anchor) ? "" : "bg-wash/70"
              }`}
            >
              <div className="mb-1 flex justify-center">
                <Link
                  href={planningHref("jour", d)}
                  onClick={(e) => e.stopPropagation()}
                  className={`grid size-6 place-items-center rounded-full text-xs font-semibold ${
                    d === today
                      ? "bg-violet text-white"
                      : sameMonth(d, range.anchor)
                        ? "text-ink hover:bg-violet-pale"
                        : "text-muted hover:bg-violet-pale"
                  }`}
                >
                  {dayLabel(d, "d")}
                </Link>
              </div>
              <div className="grid gap-0.5">
                {items.slice(0, MAX_CHIPS).map((a) => {
                  const c = colorFor(a, members);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(a.id);
                      }}
                      className={`ev flex items-center gap-1 truncate rounded px-1.5 py-0.5 text-left text-[11px] ${
                        a.id === selectedId ? "ring-2" : ""
                      }`}
                      style={{
                        backgroundColor: c.bg,
                        color: c.text,
                        ["--ev" as string]: c.border,
                        ["--tw-ring-color" as string]: c.border,
                      }}
                    >
                      <span
                        className="size-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: c.border }}
                      />
                      <span className="opacity-80">{a.startTime}</span>
                      <span className="truncate font-semibold">{a.title}</span>
                    </button>
                  );
                })}
                {extra > 0 && (
                  <Link
                    href={planningHref("jour", d)}
                    onClick={(e) => e.stopPropagation()}
                    className="text-muted hover:text-violet px-1.5 text-[11px] font-semibold"
                  >
                    + {extra} autre{extra > 1 ? "s" : ""}
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
