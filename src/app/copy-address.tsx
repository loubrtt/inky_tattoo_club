"use client";

import { useState, type ReactNode } from "react";

// L'adresse elle-même se touche pour être copiée ; une petite ligne dit ce qui se passe.
// Si le presse-papier est refusé, on invite à la sélectionner à la main.
export function CopyAddress({ address, children }: { address: string; children: ReactNode }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setState("copied");
    } catch {
      setState("failed");
    }
    setTimeout(() => setState("idle"), 2500);
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="group focus-visible:outline-flash grid cursor-copy gap-1 text-left focus-visible:outline-2 focus-visible:outline-offset-4"
    >
      <span className="group-hover:text-flash grid gap-0.5 transition-colors duration-200">
        {children}
      </span>
      <span
        aria-live="polite"
        className={`font-label mt-1.5 text-[9.5px] tracking-[0.16em] uppercase transition-colors duration-200 ${
          state === "copied" ? "text-flash" : "text-bone-dim"
        }`}
      >
        {state === "copied"
          ? "Adresse copiée ♥"
          : state === "failed"
            ? "Sélectionne l’adresse pour la copier"
            : "Toucher pour copier"}
      </span>
    </button>
  );
}
