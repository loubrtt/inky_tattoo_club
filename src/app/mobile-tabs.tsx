"use client";

import { useEffect, useState } from "react";

const ICONS: Record<string, string> = {
  studio:
    "M12 20s-6-3.7-8-7.5C2.7 9.8 4 6.7 7 6.3c2-.3 3.4.9 5 2.6 1.6-1.7 3-2.9 5-2.6 3 .4 4.3 3.5 3 6.2-2 3.8-8 7.5-8 7.5z",
  artistes: "M4 20l6.5-6.5M14 4l6 6-7.5 7.5-6-6zM10.5 13.5l-2-2",
  infos:
    "M12 21s-6.5-6.1-6.5-11a6.5 6.5 0 0113 0c0 4.9-6.5 11-6.5 11zM12 12.3a2.3 2.3 0 100-4.6 2.3 2.3 0 000 4.6z",
  "rendez-vous": "M4 5h16v11H9l-5 4z",
};
const SHORT: Record<string, string> = {
  studio: "Studio",
  artistes: "Artistes",
  infos: "Infos",
  "rendez-vous": "RDV",
};

// Téléphone : barre d'onglets en bas, à portée de pouce. L'onglet de la section affichée
// s'allume en rose (le haut de page compte comme « Studio »).
export function MobileTabs({ sections }: { sections: readonly { id: string; label: string }[] }) {
  const [active, setActive] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    let frame = 0;
    const compute = () => {
      frame = 0;
      const line = window.innerHeight * 0.45;
      let current = sections[0]?.id ?? "";
      for (const s of sections) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= line) current = s.id;
      }
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom && sections.length) current = sections[sections.length - 1].id;
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [sections]);

  return (
    <nav
      aria-label="Sections de la page"
      className="mobile-tabs bg-night-raised/80 border-bone/12 fixed inset-x-3 z-40 grid grid-cols-4 gap-1 rounded-[22px] border p-1.5 backdrop-blur-xl md:hidden"
      style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
    >
      {sections.map((s) => {
        const on = s.id === active;
        return (
          <a
            key={s.id}
            href={`#${s.id}`}
            aria-current={on ? "location" : undefined}
            aria-label={s.label}
            className={`font-label grid min-h-12 min-w-0 justify-items-center gap-1 rounded-2xl px-1 py-2 text-[9px] tracking-[0.1em] uppercase transition-colors duration-200 ${
              on
                ? "text-flash bg-flash/10 [text-shadow:0_0_10px_color-mix(in_oklab,var(--color-flash)_60%,transparent)]"
                : "text-bone-dim"
            }`}
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinejoin="round"
              className={`size-5 ${on ? "drop-shadow-[0_0_6px_var(--color-flash)]" : ""}`}
            >
              <path d={ICONS[s.id] ?? ICONS.studio} />
            </svg>
            <span className="max-w-full truncate">{SHORT[s.id] ?? s.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
