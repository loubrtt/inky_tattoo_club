"use client";

import { useEffect, useRef } from "react";

// Ligne « trait d'aiguille » de la landing (pointillé de stencil).
// header : la partie déjà lue passe en rose et un petit cœur avance avec le défilement.
// footer : le pointillé avance doucement, comme une aiguille qui travaille.
const HEART =
  "M12 21s-7.5-4.6-10-9.3C.3 8.4 2 4.5 5.7 4.1 8.2 3.8 10 5.3 12 7.4c2-2.1 3.8-3.6 6.3-3.3 3.7.4 5.4 4.3 3.7 7.6C19.5 16.4 12 21 12 21z";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function NeedleRule({
  variant,
  sections = [],
}: {
  variant: "header" | "footer";
  /** Sections du menu : le cœur passe sous chaque lien quand sa section commence. */
  sections?: readonly { id: string }[];
}) {
  const box = useRef<HTMLDivElement>(null);
  const drawn = useRef<HTMLDivElement>(null);
  const heart = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (variant !== "header") return;
    let frame = 0;

    // Position du cœur, en px depuis la gauche de la ligne.
    const position = (width: number): number => {
      const doc = document.documentElement;
      const maxScroll = doc.scrollHeight - window.innerHeight;
      const pagePct = maxScroll > 0 ? clamp01(window.scrollY / maxScroll) : 0;
      const left = box.current?.getBoundingClientRect().left ?? 0;

      // Centre de chaque lien du menu (si le menu est visible, donc sur ordinateur).
      const stops = sections
        .map((s) => {
          const link = document.querySelector<HTMLElement>(`header nav a[href="#${s.id}"]`);
          const el = document.getElementById(s.id);
          if (!link || !el || link.offsetParent === null) return null;
          const r = link.getBoundingClientRect();
          return {
            x: r.left + r.width / 2 - left,
            top: el.getBoundingClientRect().top + window.scrollY,
          };
        })
        .filter((v): v is { x: number; top: number } => v !== null);
      if (stops.length !== sections.length || !stops.length) return pagePct * width;

      // Même règle que le menu : une section est active quand son haut passe le tiers de l'écran.
      const line = window.scrollY + window.innerHeight / 3;
      const last = stops[stops.length - 1];
      // Tout en haut : le cœur est au début de la ligne, il rejoint le 1er lien quand la
      // 1re section devient active.
      const firstAt = stops[0].top - window.innerHeight / 3;
      if (line < stops[0].top)
        return firstAt > 0 ? clamp01(window.scrollY / firstAt) * stops[0].x : stops[0].x;
      for (let i = 0; i < stops.length - 1; i++) {
        const a = stops[i];
        const b = stops[i + 1];
        if (line < b.top) return a.x + clamp01((line - a.top) / (b.top - a.top)) * (b.x - a.x);
      }
      // Après le début de la dernière section : le cœur file jusqu'au bout de la ligne,
      // qu'il atteint quand on arrive au footer (bas de page).
      const from = last.top - window.innerHeight / 3;
      const pct = maxScroll > from ? clamp01((window.scrollY - from) / (maxScroll - from)) : 1;
      return last.x + pct * (width - last.x);
    };

    const sync = () => {
      frame = 0;
      const width = box.current?.clientWidth ?? 0;
      const x = Math.max(0, Math.min(width, position(width)));
      if (drawn.current) drawn.current.style.width = `${x}px`;
      if (heart.current) {
        // Cœur toujours visible, sans être coupé par les bords de l'écran.
        heart.current.style.left = `${Math.max(8, Math.min(width - 8, x))}px`;
        heart.current.style.opacity = "1";
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(sync);
    };
    sync();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [variant, sections]);

  return (
    <div
      ref={box}
      aria-hidden
      className={`needle-rule pointer-events-none absolute inset-x-0 h-2.5 ${
        variant === "header" ? "-bottom-[5px]" : "-top-[5px]"
      }`}
      data-variant={variant}
    >
      <div className="needle-dots absolute inset-x-0 top-1/2" />
      {variant === "header" && (
        <>
          <div ref={drawn} className="needle-dots needle-drawn absolute top-1/2 left-0 w-0" />
          <svg
            ref={heart}
            viewBox="0 0 24 24"
            className="text-flash absolute top-1/2 left-0 size-3.5 -translate-x-1/2 -translate-y-1/2 opacity-0 drop-shadow-[0_0_6px_var(--color-flash)] transition-opacity duration-300"
          >
            <path fill="currentColor" d={HEART} />
          </svg>
        </>
      )}
    </div>
  );
}
