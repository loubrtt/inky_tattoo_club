"use client";

import { useEffect } from "react";

// Sur écran tactile (pas de souris à suivre) : un cœur rose apparaît sous le doigt à chaque
// tap, bat une fois et s'efface. Un glisser (défilement) n'en déclenche pas. Rien si
// l'appareil demande moins d'animations.
const HEART =
  "M12 21s-7.5-4.6-10-9.3C.3 8.4 2 4.5 5.7 4.1 8.2 3.8 10 5.3 12 7.4c2-2.1 3.8-3.6 6.3-3.3 3.7.4 5.4 4.3 3.7 7.6C19.5 16.4 12 21 12 21z";
const MAX_MOVE = 10; // px : au-delà, c'est un défilement, pas un tap
const MAX_DURATION = 500; // ms
const MAX_HEARTS = 6;

export function TouchHeart() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const starts = new Map<number, { x: number; y: number; t: number }>();
    const live: HTMLElement[] = [];

    const down = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      starts.set(e.pointerId, { x: e.clientX, y: e.clientY, t: e.timeStamp });
    };
    const cancel = (e: PointerEvent) => starts.delete(e.pointerId);
    const up = (e: PointerEvent) => {
      const s = starts.get(e.pointerId);
      starts.delete(e.pointerId);
      if (!s) return;
      if (Math.hypot(e.clientX - s.x, e.clientY - s.y) > MAX_MOVE) return;
      if (e.timeStamp - s.t > MAX_DURATION) return;

      const el = document.createElement("div");
      el.setAttribute("aria-hidden", "true");
      el.className =
        "pointer-events-none fixed z-30 -mt-18 -ml-18 size-36 mix-blend-screen [will-change:transform,opacity]";
      el.style.left = `${e.clientX}px`;
      el.style.top = `${e.clientY}px`;
      el.innerHTML = `<svg viewBox="0 0 24 24" class="size-full rotate-12 blur-[6px]"><path fill="rgb(255 142 219 / 0.42)" d="${HEART}"/></svg>`;
      document.body.appendChild(el);
      live.push(el);
      if (live.length > MAX_HEARTS) live.shift()?.remove();

      const anim = el.animate(
        [
          { transform: "scale(0.4)", opacity: 0 },
          { transform: "scale(1.35)", opacity: 1, offset: 0.2 },
          { transform: "scale(0.95)", opacity: 0.9, offset: 0.42 },
          { transform: "scale(1.15)", opacity: 0.8, offset: 0.6 },
          { transform: "scale(1.3)", opacity: 0 },
        ],
        { duration: 900, easing: "cubic-bezier(0.2, 0, 0, 1)" },
      );
      const remove = () => {
        el.remove();
        const i = live.indexOf(el);
        if (i >= 0) live.splice(i, 1);
      };
      anim.onfinish = remove;
      anim.oncancel = remove;
    };

    window.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("pointerup", up, { passive: true });
    window.addEventListener("pointercancel", cancel, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      live.forEach((el) => el.remove());
    };
  }, []);

  return null;
}
