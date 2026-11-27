import { describe, expect, it } from "vitest";
import {
  closureLabel,
  groupWeek,
  openSlotsOn,
  openStatus,
  parisNow,
  upcomingClosures,
  weekdayOf,
  type Closure,
  type Week,
} from "@/lib/landing/hours";
import { landingSchema } from "@/lib/validation";

const closed = { open: false, slots: [] };
const day = (from: string, to: string) => ({ open: true, slots: [{ from, to }] });
// Mar -> Sam 10:00-19:00, samedi avec pause, dimanche et lundi fermés.
const WEEK: Week = [
  closed,
  day("10:00", "19:00"),
  day("10:00", "19:00"),
  day("10:00", "19:00"),
  day("10:00", "19:00"),
  {
    open: true,
    slots: [
      { from: "10:00", to: "13:00" },
      { from: "14:00", to: "18:00" },
    ],
  },
  closed,
];

describe("weekdayOf / parisNow", () => {
  it("lundi = 0, dimanche = 6", () => {
    expect(weekdayOf("2026-11-30")).toBe(0);
    expect(weekdayOf("2026-11-29")).toBe(6);
  });
  it("donne l'heure de Paris (UTC+1 en hiver, UTC+2 en été)", () => {
    expect(parisNow(new Date("2026-11-27T23:30:00Z"))).toEqual({
      dateKey: "2026-11-28",
      minutes: 30,
    });
    expect(parisNow(new Date("2026-07-01T08:00:00Z")).minutes).toBe(10 * 60);
  });
});

describe("groupWeek", () => {
  it("regroupe les jours consécutifs aux mêmes horaires", () => {
    expect(groupWeek(WEEK)).toEqual([
      { days: "Lun", hours: null },
      { days: "Mar – Ven", hours: "10:00 – 19:00" },
      { days: "Sam", hours: "10:00 – 13:00 · 14:00 – 18:00" },
      { days: "Dim", hours: null },
    ]);
  });
});

describe("openStatus", () => {
  // 2026-12-01 est un mardi.
  it("ouvert pendant un créneau", () => {
    expect(openStatus(WEEK, [], { dateKey: "2026-12-01", minutes: 11 * 60 })).toEqual({
      open: true,
      label: "Ouvert · ferme à 19:00",
    });
  });
  it("avant l'ouverture, pendant la pause, après la fermeture", () => {
    expect(openStatus(WEEK, [], { dateKey: "2026-12-01", minutes: 9 * 60 }).label).toBe(
      "Fermé · ouvre aujourd’hui à 10:00",
    );
    expect(openStatus(WEEK, [], { dateKey: "2026-12-05", minutes: 13 * 60 + 30 }).label).toBe(
      "Fermé · ouvre aujourd’hui à 14:00",
    );
    expect(openStatus(WEEK, [], { dateKey: "2026-12-01", minutes: 19 * 60 }).label).toBe(
      "Fermé · ouvre demain à 10:00",
    );
    // Samedi soir -> mardi.
    expect(openStatus(WEEK, [], { dateKey: "2026-12-05", minutes: 20 * 60 }).label).toBe(
      "Fermé · ouvre mardi à 10:00",
    );
  });
  it("fermeture exceptionnelle", () => {
    const closures: Closure[] = [{ from: "2026-12-22", to: "2027-01-04", reason: "Fêtes" }];
    const s = openStatus(WEEK, closures, { dateKey: "2026-12-23", minutes: 11 * 60 });
    expect(s).toEqual({
      open: false,
      exceptional: true,
      label: "Fermé exceptionnellement · ouvre le 5 janv. à 10:00",
    });
    expect(openSlotsOn(WEEK, closures, "2026-12-23")).toEqual([]);
  });
  it("jamais ouvert", () => {
    expect(openStatus(Array(7).fill(closed), [], { dateKey: "2026-12-01", minutes: 0 }).label).toBe(
      "Fermé",
    );
  });
});

describe("fermetures", () => {
  const list: Closure[] = [
    { from: "2026-12-24", to: "2026-12-26", reason: null },
    { from: "2026-11-01", to: "2026-11-02", reason: "Passée" },
    { from: "2026-11-27", to: "2026-11-27", reason: "Salon" },
  ];
  it("garde celles en cours ou à venir, triées", () => {
    expect(upcomingClosures(list, "2026-11-27").map((c) => c.from)).toEqual([
      "2026-11-27",
      "2026-12-24",
    ]);
  });
  it("libellé", () => {
    expect(closureLabel(list[0])).toBe("Du 24 déc. au 26 déc.");
    expect(closureLabel(list[2])).toBe("Le 27 nov. · Salon");
  });
});

describe("landingSchema : horaires", () => {
  const base = {
    tagline: "",
    intro: "",
    about: { title: "", text: "", styles: [] },
    artists: [],
    practical: { address: "", city: "", access: "", hours: [], week: null, closures: [] },
    booking: { text: "", instagram: "", email: "", phone: "" },
  };
  const withPractical = (practical: object) => ({
    ...base,
    practical: { ...base.practical, ...practical },
  });
  it("ancien contenu sans horaires structurés -> week null, closures []", () => {
    const { week, closures, ...old } = base.practical;
    void week;
    void closures;
    const r = landingSchema.parse({ ...base, practical: old });
    expect(r.practical.week).toBeNull();
    expect(r.practical.closures).toEqual([]);
  });
  it("jour fermé : créneaux vidés", () => {
    const week = [...WEEK];
    week[0] = { open: false, slots: [{ from: "10:00", to: "12:00" }] };
    expect(landingSchema.parse(withPractical({ week })).practical.week?.[0]).toEqual(closed);
  });
  it("refuse jour ouvert sans créneau, fin avant début, créneaux qui se chevauchent", () => {
    const bad = (d: object) => {
      const week = [...WEEK];
      week[1] = d as Week[number];
      return landingSchema.safeParse(withPractical({ week })).success;
    };
    expect(bad({ open: true, slots: [] })).toBe(false);
    expect(bad(day("19:00", "10:00"))).toBe(false);
    expect(
      bad({
        open: true,
        slots: [
          { from: "10:00", to: "14:00" },
          { from: "13:00", to: "18:00" },
        ],
      }),
    ).toBe(false);
    expect(landingSchema.safeParse(withPractical({ week: WEEK.slice(0, 6) })).success).toBe(false);
  });
  it("refuse fermeture à l'envers ou date impossible", () => {
    const ok = (c: object) => landingSchema.safeParse(withPractical({ closures: [c] })).success;
    expect(ok({ from: "2026-12-24", to: "2026-12-26", reason: "" })).toBe(true);
    expect(ok({ from: "2026-12-26", to: "2026-12-24", reason: "" })).toBe(false);
    expect(ok({ from: "2026-02-30", to: "2026-03-01", reason: "" })).toBe(false);
    expect(ok({ from: "", to: "", reason: "" })).toBe(false);
  });
});
