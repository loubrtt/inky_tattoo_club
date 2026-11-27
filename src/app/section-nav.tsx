"use client";

import { useEffect, useRef, useState } from "react";

// Menu de la landing : le lien de la section affichée s'allume en rose et « glitche » au
// moment où on y arrive en défilant (mêmes calques et variantes que le grand titre).
const VARIANTS = ["gothique", "rgb", "dechirure", "flash"] as const;

export function SectionNav({
  sections,
  linkClassName,
}: {
  sections: readonly { id: string; label: string }[];
  linkClassName: string;
}) {
  const [active, setActive] = useState<string | null>(null);
  const glitches = useRef(new Map<string, HTMLSpanElement>());
  const last = useRef<string | null>(null);

  useEffect(() => {
    let frame = 0;
    const compute = () => {
      frame = 0;
      // Section active = la dernière dont le haut a passé le tiers de l'écran.
      const line = window.innerHeight / 3;
      let current: string | null = null;
      for (const s of sections) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= line) current = s.id;
      }
      // Tout en bas de la page, la dernière section l'emporte même si elle est courte.
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

  // Glitch quand une nouvelle section devient active (rien si moins d'animations demandé).
  useEffect(() => {
    if (!active) return;
    const el = glitches.current.get(active);
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const choices = VARIANTS.filter((v) => v !== last.current);
    const next = choices[Math.floor(Math.random() * choices.length)];
    last.current = next;
    delete el.dataset.glitch;
    void el.offsetWidth;
    el.dataset.glitch = next;
  }, [active]);

  return (
    <nav aria-label="Sections de la page" className="hidden md:block">
      <ul className="flex gap-1">
        {sections.map((s) => {
          const on = s.id === active;
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                aria-current={on ? "location" : undefined}
                className={`${linkClassName} ${
                  on
                    ? "text-flash [text-shadow:0_0_12px_color-mix(in_oklab,var(--color-flash)_60%,transparent)]"
                    : "text-bone-dim hover:text-bone"
                }`}
              >
                <span
                  ref={(el) => {
                    if (el) glitches.current.set(s.id, el);
                    else glitches.current.delete(s.id);
                  }}
                  className="glitch relative block"
                >
                  <span className="glitch-base block">{s.label}</span>
                  <span aria-hidden className="glitch-layer glitch-goth">
                    {s.label}
                  </span>
                  <span aria-hidden className="glitch-layer glitch-slice-a text-flash">
                    {s.label}
                  </span>
                  <span aria-hidden className="glitch-layer glitch-slice-b text-white">
                    {s.label}
                  </span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
