"use client";

import { useEffect, useRef } from "react";

// Halo lumineux en forme de cœur qui suit la souris sur la landing, avec un léger retard,
// et qui bat une fois à chaque clic. Souris uniquement (pas de tactile), désactivé si
// l'appareil demande moins d'animations. Déplacé en translate, une fois par image.
const FOLLOW = 0.14; // part de la distance rattrapée par image à 60 i/s (plus petit = plus de retard)

export function CursorLight() {
  const ref = useRef<HTMLDivElement>(null);
  const heartRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = ref.current;
    const heart = heartRef.current;
    if (!el || !heart) return;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!finePointer.matches || reduceMotion.matches) return;

    let frame = 0;
    let last = 0;
    let started = false;
    const target = { x: 0, y: 0 };
    const pos = { x: 0, y: 0 };

    const tick = (now: number) => {
      // Rattrapage indépendant de la fréquence d'affichage (60 ou 120 Hz).
      const dt = last ? Math.min(now - last, 64) : 16.7;
      last = now;
      const k = 1 - Math.pow(1 - FOLLOW, dt / 16.7);
      pos.x += (target.x - pos.x) * k;
      pos.y += (target.y - pos.y) * k;
      el.style.translate = `${pos.x}px ${pos.y}px`;
      if (Math.abs(target.x - pos.x) > 0.1 || Math.abs(target.y - pos.y) > 0.1) {
        frame = requestAnimationFrame(tick);
      } else {
        frame = 0;
        last = 0;
      }
    };
    const run = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      target.x = e.clientX;
      target.y = e.clientY;
      if (!started) {
        // Première apparition : pas de glissement depuis le coin de l'écran.
        started = true;
        pos.x = target.x;
        pos.y = target.y;
        el.style.translate = `${pos.x}px ${pos.y}px`;
      }
      el.dataset.on = "true";
      run();
    };
    const beat = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      // Un battement : grossit, se resserre, rebondit un peu, revient. Interrompt le précédent.
      heart.getAnimations().forEach((a) => a.cancel());
      heart.animate(
        [
          { scale: 1, opacity: 1 },
          { scale: 1.45, opacity: 1, offset: 0.18 },
          { scale: 0.92, opacity: 0.85, offset: 0.42 },
          { scale: 1.2, opacity: 1, offset: 0.62 },
          { scale: 1, opacity: 1 },
        ],
        { duration: 650, easing: "cubic-bezier(0.2, 0, 0, 1)" },
      );
    };
    const hide = () => {
      el.dataset.on = "false";
      started = false;
    };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", beat, { passive: true });
    document.documentElement.addEventListener("pointerleave", hide);
    window.addEventListener("blur", hide);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", beat);
      document.documentElement.removeEventListener("pointerleave", hide);
      window.removeEventListener("blur", hide);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      data-on="false"
      className="pointer-events-none fixed top-0 left-0 z-30 -mt-29 -ml-28 size-56 opacity-0 mix-blend-screen transition-opacity duration-300 ease-out [will-change:translate] data-[on=true]:opacity-100"
    >
      {/* Cœur flou, repris du petit ♥ du logo. */}
      <svg ref={heartRef} viewBox="0 0 24 24" className="size-full rotate-12 blur-md">
        <defs>
          <radialGradient id="cursor-heart" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="rgb(255 142 219)" stopOpacity="0.32" />
            <stop offset="75%" stopColor="rgb(255 142 219)" stopOpacity="0.16" />
            <stop offset="100%" stopColor="rgb(255 142 219)" stopOpacity="0.1" />
          </radialGradient>
        </defs>
        <path
          fill="url(#cursor-heart)"
          d="M12 21s-7.5-4.6-10-9.3C.3 8.4 2 4.5 5.7 4.1 8.2 3.8 10 5.3 12 7.4c2-2.1 3.8-3.6 6.3-3.3 3.7.4 5.4 4.3 3.7 7.6C19.5 16.4 12 21 12 21z"
        />
      </svg>
    </div>
  );
}
