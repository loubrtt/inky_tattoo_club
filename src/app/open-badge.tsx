"use client";

import { useEffect, useState } from "react";
import { openStatus, parisNow, type Closure, type Week } from "@/lib/landing/hours";

// Pastille compacte « Ouvert / Fermé » (barre du haut sur téléphone), mise à jour chaque minute.
export function OpenBadge({ week, closures }: { week: Week; closures: Closure[] }) {
  const [open, setOpen] = useState<boolean | null>(null);

  useEffect(() => {
    const tick = () => setOpen(openStatus(week, closures, parisNow()).open);
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 60_000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [week, closures]);

  if (open === null) return null;
  return (
    <a
      href="#infos"
      className="font-label text-bone-dim inline-flex min-h-10 items-center gap-2 text-[10px] tracking-[0.14em] uppercase"
    >
      <span aria-hidden className="relative grid size-2 place-items-center">
        {open && (
          <span className="bg-flash absolute inset-0 rounded-full opacity-70 motion-safe:animate-[sonar_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
        )}
        <span
          className={`relative size-2 rounded-full ${
            open ? "bg-flash shadow-[0_0_10px_var(--color-flash)]" : "bg-bone-dim"
          }`}
        />
      </span>
      {open ? "Ouvert" : "Fermé"}
    </a>
  );
}
