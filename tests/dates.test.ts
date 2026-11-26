import { describe, expect, it } from "vitest";
import { formatDate } from "@/lib/dates";

describe("formatDate", () => {
  it("affiche la date à l'heure de Paris", () => {
    // 23h30 UTC le 31/12 = 00h30 le 01/01 à Paris.
    expect(formatDate("2026-12-31T23:30:00Z")).toBe("01/01/2027");
  });
  it("gère les valeurs vides ou invalides", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate("")).toBe("—");
    expect(formatDate("pas une date")).toBe("—");
  });
});
