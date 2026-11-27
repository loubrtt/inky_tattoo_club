import { describe, expect, it } from "vitest";
import { parseDateKey, parseView, rangeFor, utcToWall, wallToUtcIso } from "@/lib/planning/time";
import { moveAppointmentSchema, resizeAppointmentSchema } from "@/lib/validation";

const NOW = new Date("2026-11-26T12:00:00Z");

describe("parseView / parseDateKey", () => {
  it("valeurs par défaut", () => {
    expect(parseView("nimporte")).toBe("semaine");
    expect(parseView(undefined)).toBe("semaine");
    expect(parseView("mois")).toBe("mois");
    expect(parseDateKey(undefined, NOW)).toBe("2026-11-26");
  });
  it("refuse les dates impossibles", () => {
    expect(parseDateKey("2026-02-30", NOW)).toBe("2026-11-26");
    expect(parseDateKey("2026-13-01", NOW)).toBe("2026-11-26");
    expect(parseDateKey("1800-01-01", NOW)).toBe("2026-11-26");
    expect(parseDateKey("26/11/2026", NOW)).toBe("2026-11-26");
    expect(parseDateKey("2026-03-29", NOW)).toBe("2026-03-29");
  });
  it("aujourd'hui = date de Paris, pas UTC", () => {
    expect(parseDateKey(undefined, new Date("2026-11-26T23:30:00Z"))).toBe("2026-11-27");
  });
});

describe("conversion heure de Paris <-> UTC", () => {
  it("hiver (UTC+1) et été (UTC+2)", () => {
    expect(wallToUtcIso("2026-11-26", "14:30")).toBe("2026-11-26T13:30:00.000Z");
    expect(wallToUtcIso("2026-07-01", "14:30")).toBe("2026-07-01T12:30:00.000Z");
  });
  it("aller-retour autour des changements d'heure", () => {
    for (const [d, t] of [
      ["2026-03-28", "23:00"],
      ["2026-03-29", "04:00"],
      ["2026-10-25", "01:00"],
      ["2026-10-25", "04:00"],
    ]) {
      const w = utcToWall(wallToUtcIso(d, t));
      expect([w.dateKey, w.time]).toEqual([d, t]);
    }
  });
});

describe("rangeFor", () => {
  it("semaine du lundi au dimanche", () => {
    const r = rangeFor("semaine", "2026-11-26");
    expect(r.days[0]).toBe("2026-11-23");
    expect(r.days[6]).toBe("2026-11-29");
    expect(r.fromIso).toBe("2026-11-22T23:00:00.000Z");
    expect(r.toIso).toBe("2026-11-29T23:00:00.000Z");
    expect(r.prev).toBe("2026-11-19");
    expect(r.next).toBe("2026-12-03");
  });
  it("semaine du passage à l'heure d'été : fin à minuit heure d'été", () => {
    const r = rangeFor("semaine", "2026-03-25");
    expect(r.fromIso).toBe("2026-03-22T23:00:00.000Z");
    expect(r.toIso).toBe("2026-03-29T22:00:00.000Z");
  });
  it("mois = 42 jours à partir du lundi", () => {
    const r = rangeFor("mois", "2026-11-15");
    expect(r.days).toHaveLength(42);
    expect(r.days[0]).toBe("2026-10-26");
    expect(r.title).toBe("Novembre 2026");
    expect(r.next).toBe("2026-12-15");
  });
  it("mois depuis le 31 : le mois suivant reste valide", () => {
    expect(rangeFor("mois", "2026-01-31").next).toBe("2026-02-28");
  });
  it("jour", () => {
    const r = rangeFor("jour", "2026-11-26");
    expect(r.days).toEqual(["2026-11-26"]);
    expect(r.title).toBe("Jeudi 26 novembre 2026");
  });
});

describe("resizeAppointmentSchema", () => {
  const id = "4f1c2b8e-1d2a-4c3b-9e8f-0a1b2c3d4e5f";
  it("accepte des heures dans l'ordre", () => {
    expect(resizeAppointmentSchema.safeParse({ id, start: "10:00", end: "11:15" }).success).toBe(
      true,
    );
    expect(resizeAppointmentSchema.safeParse({ id, start: "00:00", end: "23:59" }).success).toBe(
      true,
    );
  });
  it("refuse fin avant début, 24:00, id invalide", () => {
    expect(resizeAppointmentSchema.safeParse({ id, start: "11:00", end: "11:00" }).success).toBe(
      false,
    );
    expect(resizeAppointmentSchema.safeParse({ id, start: "12:00", end: "11:00" }).success).toBe(
      false,
    );
    expect(resizeAppointmentSchema.safeParse({ id, start: "10:00", end: "24:00" }).success).toBe(
      false,
    );
    expect(
      resizeAppointmentSchema.safeParse({ id: "pas-un-id", start: "10:00", end: "11:00" }).success,
    ).toBe(false);
  });
});

describe("moveAppointmentSchema", () => {
  const id = "4f1c2b8e-1d2a-4c3b-9e8f-0a1b2c3d4e5f";
  it("accepte un jour et une heure valides", () => {
    expect(
      moveAppointmentSchema.safeParse({ id, date: "2026-11-30", start: "14:15" }).success,
    ).toBe(true);
  });
  it("refuse date mal formée, heure invalide, id invalide", () => {
    expect(
      moveAppointmentSchema.safeParse({ id, date: "30/11/2026", start: "14:15" }).success,
    ).toBe(false);
    expect(
      moveAppointmentSchema.safeParse({ id, date: "2026-11-30", start: "24:00" }).success,
    ).toBe(false);
    expect(
      moveAppointmentSchema.safeParse({ id: "x", date: "2026-11-30", start: "10:00" }).success,
    ).toBe(false);
  });
});
