import { describe, expect, it } from "vitest";
import { directionsLinks, lineLabel, lineStyle, osmEmbedUrl } from "@/lib/landing/transit";
import { landingSchema } from "@/lib/validation";

const base = {
  tagline: "",
  intro: "",
  about: { title: "", text: "", styles: [] },
  artists: [],
  practical: { address: "", city: "", access: "", hours: [] },
  booking: { text: "", instagram: "", email: "", phone: "" },
};

describe("lignes de transport", () => {
  it("couleurs officielles et libellés", () => {
    expect(lineStyle("2").bg).toBe("#003CA6");
    expect(lineStyle("7").bg).toBe("#FA9ABA");
    expect(lineLabel("7")).toBe("Métro 7");
    expect(lineLabel("B")).toBe("RER B");
    // Ligne inconnue : couleur neutre plutôt qu'une erreur.
    expect(lineStyle("99").bg).toBe("#a9a39b");
  });
});

describe("itinéraires", () => {
  it("utilise les coordonnées quand elles sont connues", () => {
    const l = directionsLinks("4, Avenue Trudaine, 75009, France", { lat: 48.88, lng: 2.34 });
    expect(l.google).toContain("query=48.88,2.34");
    expect(l.waze).toContain("ll=48.88,2.34");
    expect(l.citymapper).toContain("endcoord=48.88,2.34");
  });
  it("sinon l'adresse, encodée", () => {
    const l = directionsLinks("4, Avenue Trudaine & co", null);
    expect(l.google).toContain("query=4%2C%20Avenue%20Trudaine%20%26%20co");
    expect(l.waze).toContain("q=4%2C");
    expect(l.citymapper).not.toContain("endcoord");
  });
  it("carte OSM centrée sur le studio, sans le marqueur bleu", () => {
    const url = osmEmbedUrl({ lat: 48.88, lng: 2.34 });
    const bbox = new URL(url).searchParams.get("bbox")?.split(",").map(Number) ?? [];
    expect((bbox[0] + bbox[2]) / 2).toBeCloseTo(2.34, 6);
    expect((bbox[1] + bbox[3]) / 2).toBeCloseTo(48.88, 6);
    expect(url).not.toContain("marker=");
  });
});

describe("landingSchema : métro et position", () => {
  const withPractical = (p: object) => ({ ...base, practical: { ...base.practical, ...p } });
  it("métro et position absents -> valeurs par défaut", () => {
    const r = landingSchema.parse(base);
    expect(r.practical.metro).toEqual([]);
    expect(r.practical.geo).toBeNull();
  });
  it("garde une station valide, refuse ligne inconnue, station vide, plus de 6", () => {
    const ok = (metro: object[]) => landingSchema.safeParse(withPractical({ metro })).success;
    expect(ok([{ line: "2", station: " Anvers " }])).toBe(true);
    expect(ok([{ line: "99", station: "X" }])).toBe(false);
    expect(ok([{ line: "2", station: "  " }])).toBe(false);
    expect(ok(Array.from({ length: 7 }, () => ({ line: "2", station: "Anvers" })))).toBe(false);
  });
  it("refuse une position hors limites", () => {
    expect(landingSchema.safeParse(withPractical({ geo: { lat: 200, lng: 2 } })).success).toBe(
      false,
    );
  });
});

describe("lien de message Instagram", () => {
  it("ouvre la conversation, refuse un identifiant douteux", async () => {
    const { instagramDmUrl } = await import("@/lib/landing/content");
    expect(instagramDmUrl("inkyyyytattoo")).toBe("https://ig.me/m/inkyyyytattoo");
    expect(instagramDmUrl("@inkyyyytattoo ")).toBe("https://ig.me/m/inkyyyytattoo");
    expect(instagramDmUrl("https://instagram.com/x")).toBeNull();
    expect(instagramDmUrl(null)).toBeNull();
  });
});
