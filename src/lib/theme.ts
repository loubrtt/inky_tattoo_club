// Thème de l'appli : "light" / "dark" choisis à la main, "system" = suit l'appareil.
export const THEME_COOKIE = "inky_theme";
export const THEMES = ["light", "system", "dark"] as const;
export type Theme = (typeof THEMES)[number];

export function parseTheme(value: string | undefined | null): Theme {
  return value === "light" || value === "dark" ? value : "system";
}

// Valeur de l'attribut data-theme : absent quand on suit le système.
export function themeAttr(theme: Theme): "light" | "dark" | undefined {
  return theme === "system" ? undefined : theme;
}
