import { describe, expect, it } from "vitest";
import { parseTheme, themeAttr } from "@/lib/theme";
import { themeSchema } from "@/lib/validation";

describe("thème", () => {
  it("sombre par défaut, clair seulement s'il a été choisi", () => {
    expect(parseTheme("light")).toBe("light");
    expect(parseTheme("dark")).toBe("dark");
    expect(parseTheme(undefined)).toBe("dark");
    expect(parseTheme(null)).toBe("dark");
    // Ancien cookie « Auto » : on repasse en sombre.
    expect(parseTheme("system")).toBe("dark");
    expect(parseTheme("<script>")).toBe("dark");
  });
  it("pose toujours l'attribut, pour ne jamais suivre l'appareil", () => {
    expect(themeAttr("dark")).toBe("dark");
    expect(themeAttr("light")).toBe("light");
  });
  it("le schéma refuse une valeur inconnue ou l'ancien « system »", () => {
    expect(themeSchema.safeParse("dark").success).toBe(true);
    expect(themeSchema.safeParse("light").success).toBe(true);
    expect(themeSchema.safeParse("system").success).toBe(false);
    expect(themeSchema.safeParse("purple").success).toBe(false);
  });
});
