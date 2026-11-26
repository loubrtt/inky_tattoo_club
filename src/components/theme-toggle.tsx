"use client";

import { startTransition, useState } from "react";
import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { themeAttr, type Theme } from "@/lib/theme";
import { saveTheme } from "@/lib/theme-actions";

const OPTIONS: { value: Theme; label: string; icon: LucideIcon }[] = [
  { value: "light", label: "Clair", icon: Sun },
  { value: "system", label: "Auto", icon: Monitor },
  { value: "dark", label: "Sombre", icon: Moon },
];

// Choix du thème : appliqué tout de suite dans la page, puis gardé dans un cookie par le
// serveur (lu au prochain affichage, donc pas de flash clair au chargement).
export function ThemeToggle({ initial }: { initial: Theme }) {
  const [theme, setTheme] = useState(initial);

  const choose = (value: Theme) => {
    setTheme(value);
    const attr = themeAttr(value);
    document.querySelectorAll<HTMLElement>(".app-theme").forEach((el) => {
      if (attr) el.dataset.theme = attr;
      else delete el.dataset.theme;
    });
    startTransition(() => saveTheme(value));
  };

  return (
    <div
      role="radiogroup"
      aria-label="Thème de l’affichage"
      className="border-line bg-wash grid grid-cols-3 gap-1 rounded-xl border p-1"
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
            className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
              active ? "bg-paper text-violet-ink shadow-soft" : "text-muted hover:text-ink"
            }`}
          >
            <Icon aria-hidden size={14} />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
