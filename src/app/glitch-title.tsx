"use client";

import { useCallback, useEffect, useRef } from "react";

// Grand titre de la landing : un glitch tiré au hasard parmi plusieurs variantes,
// toutes les 4 à 7 s et à chaque clic. Les variantes sont décrites dans globals.css
// (data-glitch). Rien ne bouge si l'appareil demande moins d'animations.
const VARIANTS = ["gothique", "rgb", "dechirure", "flash"] as const;
const FIRST_DELAY = 3600; // après l'intro et la diffusion d'encre
const MIN_GAP = 4000;
const MAX_GAP = 7000;

export function GlitchTitle({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const last = useRef<string | null>(null);

  const glitch = useCallback(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const choices = VARIANTS.filter((v) => v !== last.current);
    const next = choices[Math.floor(Math.random() * choices.length)];
    last.current = next;
    // Retirer puis remettre l'attribut relance l'animation même si c'est la même variante.
    delete el.dataset.glitch;
    void el.offsetWidth;
    el.dataset.glitch = next;
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = (delay: number) => {
      timer = setTimeout(() => {
        // Pas de glitch quand l'onglet est caché : on réessaie plus tard.
        if (!document.hidden) glitch();
        schedule(MIN_GAP + Math.random() * (MAX_GAP - MIN_GAP));
      }, delay);
    };
    schedule(FIRST_DELAY);
    return () => clearTimeout(timer);
  }, [glitch]);

  return (
    <span
      ref={ref}
      className="ink-in glitch relative block cursor-pointer select-none"
      onClick={glitch}
    >
      <span className="glitch-base block">{text}</span>
      <span aria-hidden className="glitch-layer glitch-goth">
        {text}
      </span>
      <span aria-hidden className="glitch-layer glitch-slice-a text-flash">
        {text}
      </span>
      <span aria-hidden className="glitch-layer glitch-slice-b text-white">
        {text}
      </span>
    </span>
  );
}
