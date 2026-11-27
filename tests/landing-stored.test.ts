import { describe, expect, it } from "vitest";
import { landingSchema } from "@/lib/validation";

describe("landingSchema : contenu déjà enregistré", () => {
  it("relit un contenu stocké avec des null et sans horaires structurés", () => {
    const stored = {
      about: { text: null, title: null, styles: [] },
      intro: null,
      artists: [{ name: "Alex", styles: null, bio: null, instagram: null }],
      booking: { text: null, email: null, phone: null, instagram: null },
      tagline: null,
      practical: {
        city: "75009",
        hours: [{ days: "Du lundi au samedi", hours: null }],
        access: "Metro 2 : Anvers",
        address: "4, Avenue Trudaine",
      },
    };
    const r = landingSchema.parse(stored);
    expect(r.practical.address).toBe("4, Avenue Trudaine");
    expect(r.practical.hours).toEqual([{ days: "Du lundi au samedi", hours: null }]);
    expect(r.practical.week).toBeNull();
    expect(r.practical.closures).toEqual([]);
    expect(r.tagline).toBeNull();
    // Relire ce qu'on vient d'enregistrer doit redonner la même chose.
    expect(landingSchema.parse(r)).toEqual(r);
  });
});
