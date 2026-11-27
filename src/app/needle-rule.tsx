"use client";

import { useEffect, useRef } from "react";

// Ligne « trait d'aiguille » de la landing (pointillé de stencil).
// header : la partie déjà lue passe en rose et un petit cœur avance avec le défilement.
// footer : le pointillé avance doucement, comme une aiguille qui travaille.
const HEART =
  "M12 21s-7.5-4.6-10-9.3C.3 8.4 2 4.5 5.7 4.1 8.2 3.8 10 5.3 12 7.4c2-2.1 3.8-3.6 6.3-3.3 3.7.4 5.4 4.3 3.7 7.6C19.5 16.4 12 21 12 21z";

export function NeedleRule({ variant }: { variant: "header" | "footer" }) {
  const drawn = useRef<HTMLDivElement>(null);
  const heart = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (variant !== "header") return;
    let frame = 0;
    const sync = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (drawn.current) drawn.current.style.width = `${p * 100}%`;
      if (heart.current) {
        heart.current.style.left = `${p * 100}%`;
        heart.current.style.opacity = p > 0.002 ? "1" : "0";
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
  }, [variant]);

  return (
    <div
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
