"use client";

import { startTransition, useState } from "react";
import { Moon, Sun, type LucideIcon } from "lucide-react";
import { themeAttr, type Theme } from "@/lib/theme";
import { saveTheme } from "@/lib/theme-actions";

const OPTIONS: { value: Theme; label: string; icon: LucideIcon }[] = [
  { value: "dark", label: "Sombre", icon: Moon },
  { value: "light", label: "Clair", icon: Sun },
];

// Choix du thème : appliqué tout de suite dans la page, puis gardé dans un cookie par le
// serveur (lu au prochain affichage, donc pas de flash clair au chargement).
export function ThemeToggle({ initial }: { initial: Theme }) {
  const [theme, setTheme] = useState(initial);

  const choose = (value: Theme) => {
    setTheme(value);
    const attr = themeAttr(value);
    document.querySelectorAll<HTMLElement>(".app-theme").forEach((el) => {
      el.dataset.theme = attr;
    });
    startTransition(() => saveTheme(value));
  };

  return (
    <div
      role="radiogroup"
      aria-label="Thème de l’affichage"
      className="border-line bg-wash grid min-w-0 grid-cols-2 gap-1 rounded-xl border p-1"
    >
      {OPTIONS.map((o) => {
        const active = theme === o.value;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => choose(o.value)}
            className={`flex min-w-0 items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-[11px] font-semibold transition ${
              active ? "bg-paper text-violet-ink shadow-soft" : "text-muted hover:text-ink"
            }`}
          >
            <Icon aria-hidden size={14} className="shrink-0" />
            <span className="truncate">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
