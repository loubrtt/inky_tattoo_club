import { describe, expect, it } from "vitest";
import { parseTheme, themeAttr } from "@/lib/theme";
import { themeSchema } from "@/lib/validation";

describe("thème", () => {
  it("garde uniquement light / dark, tout le reste suit le système", () => {
    expect(parseTheme("dark")).toBe("dark");
    expect(parseTheme("light")).toBe("light");
    expect(parseTheme("system")).toBe("system");
    expect(parseTheme(undefined)).toBe("system");
    expect(parseTheme("<script>")).toBe("system");
  });
  it("n'écrit pas d'attribut quand on suit le système", () => {
    expect(themeAttr("system")).toBeUndefined();
    expect(themeAttr("dark")).toBe("dark");
  });
  it("le schéma refuse une valeur inconnue", () => {
    expect(themeSchema.safeParse("dark").success).toBe(true);
    expect(themeSchema.safeParse("purple").success).toBe(false);
  });
});
