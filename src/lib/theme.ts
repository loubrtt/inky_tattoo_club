// Thème de l'appli : sombre par défaut pour tout le monde. Le clair n'apparaît que si
// l'utilisateur le choisit ; ce choix est gardé dans un cookie.
export const THEME_COOKIE = "inky_theme";
export const THEMES = ["dark", "light"] as const;
export type Theme = (typeof THEMES)[number];

// Tout ce qui n'est pas « light » (absent, ancien « system », valeur inconnue) = sombre.
export function parseTheme(value: string | undefined | null): Theme {
  return value === "light" ? "light" : "dark";
}

// Valeur de l'attribut data-theme : toujours posée, pour ne jamais suivre l'appareil.
export function themeAttr(theme: Theme): Theme {
  return theme;
}
