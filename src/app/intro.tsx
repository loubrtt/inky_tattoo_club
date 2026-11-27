"use client";

import { useRef } from "react";

const HEART =
  "M12 21s-7.5-4.6-10-9.3C.3 8.4 2 4.5 5.7 4.1 8.2 3.8 10 5.3 12 7.4c2-2.1 3.8-3.6 6.3-3.3 3.7.4 5.4 4.3 3.7 7.6C19.5 16.4 12 21 12 21z";

// Intro de la landing (animations dans globals.css, rien si moins d'animations demandé).
// Ordinateur : elle se joue toute seule. Écran tactile : le cœur bat jusqu'au toucher.
export function Intro() {
  const ref = useRef<HTMLDivElement>(null);
  const go = () => ref.current?.classList.add("go");
  return (
    <div ref={ref} aria-hidden className="intro" onClick={go}>
      <div className="intro-bloom" />
      <svg viewBox="0 0 24 24" className="intro-heart">
        <path fill="currentColor" d={HEART} />
      </svg>
      <p className="intro-hint">Touche pour entrer</p>
    </div>
  );
}
