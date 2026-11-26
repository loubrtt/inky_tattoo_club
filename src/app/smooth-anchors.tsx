"use client";

import { useEffect } from "react";

// Clic sur un lien interne de la landing (#infos, #artistes…) : défilement doux jusqu'à la
// section, adresse mise à jour, et focus déplacé sur la section pour le clavier et les
// lecteurs d'écran. Si l'appareil demande moins d'animations, le saut est immédiat.
export function SmoothAnchors() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;
      const link = (e.target as Element | null)?.closest?.("a[href^='#']");
      if (!(link instanceof HTMLAnchorElement)) return;
      let id = "";
      try {
        id = decodeURIComponent(link.hash.slice(1));
      } catch {
        return; // ancre mal encodée : on laisse le navigateur faire
      }
      const target = id ? document.getElementById(id) : null;
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({
        behavior: reduceMotion.matches ? "auto" : "smooth",
        block: "start",
      });
      if (window.location.hash !== `#${id}`) window.history.pushState(null, "", `#${id}`);
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
