import { describe, expect, it } from "vitest";
import { landingSchema, nestedFieldErrors } from "@/lib/validation";

const empty = {
  tagline: "",
  intro: "",
  about: { title: "", text: "", styles: [] },
  artists: [],
  practical: { address: "", city: "", access: "", hours: [] },
  booking: { text: "", instagram: "", email: "", phone: "" },
};

describe("landingSchema", () => {
  it("transforme les champs vides en null", () => {
    const r = landingSchema.parse(empty);
    expect(r.tagline).toBeNull();
    expect(r.booking).toEqual({ text: null, instagram: null, email: null, phone: null });
  });
  it("nettoie l'Instagram, l'e-mail et garde le téléphone", () => {
    const r = landingSchema.parse({
      ...empty,
      artists: [{ name: " Alex ", styles: "", bio: "", instagram: "@alex.ink" }],
      booking: {
        text: "",
        instagram: "@inky.tattoo",
        email: "Contact@Studio.FR",
        phone: "01 23 45 67 89",
      },
    });
    expect(r.artists[0]).toEqual({ name: "Alex", styles: null, bio: null, instagram: "alex.ink" });
    expect(r.booking.instagram).toBe("inky.tattoo");
    expect(r.booking.email).toBe("contact@studio.fr");
    expect(r.booking.phone).toBe("01 23 45 67 89");
  });
  it("refuse un lien Instagram, un e-mail ou un téléphone invalides, avec le bon chemin", () => {
    const r = landingSchema.safeParse({
      ...empty,
      artists: [{ name: "", styles: "", bio: "", instagram: "https://instagram.com/x" }],
      booking: { text: "", instagram: "", email: "pas-un-mail", phone: "appelez" },
    });
    expect(r.success).toBe(false);
    if (r.success) return;
    const errors = nestedFieldErrors(r.error);
    expect(errors["artists.0.instagram"]).toBeDefined();
    expect(errors["booking.email"]).toBeDefined();
    expect(errors["booking.phone"]).toBeDefined();
  });
  it("limite les longueurs et le nombre d'éléments", () => {
    expect(landingSchema.safeParse({ ...empty, tagline: "x".repeat(161) }).success).toBe(false);
    const artist = { name: "a", styles: "", bio: "", instagram: "" };
    expect(
      landingSchema.safeParse({ ...empty, artists: Array.from({ length: 21 }, () => artist) })
        .success,
    ).toBe(false);
  });
  it("exige les jours d'une ligne d'horaires, heures vides = fermé", () => {
    const ok = landingSchema.parse({
      ...empty,
      practical: { ...empty.practical, hours: [{ days: "Lundi", hours: "" }] },
    });
    expect(ok.practical.hours[0]).toEqual({ days: "Lundi", hours: null });
    expect(
      landingSchema.safeParse({
        ...empty,
        practical: { ...empty.practical, hours: [{ days: " ", hours: "10h" }] },
      }).success,
    ).toBe(false);
  });
  it("ignore les clés inconnues", () => {
    const r = landingSchema.parse({ ...empty, evil: "<script>" } as unknown);
    expect("evil" in r).toBe(false);
  });
});
