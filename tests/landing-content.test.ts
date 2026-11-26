import { describe, expect, it } from "vitest";
import { instagramUrl, mailtoUrl, telUrl } from "@/lib/landing/content";

describe("liens de contact de la landing", () => {
  it("construit un lien Instagram propre", () => {
    expect(instagramUrl("inky.tattoo")).toBe("https://www.instagram.com/inky.tattoo/");
    expect(instagramUrl(" @inky_tattoo ")).toBe("https://www.instagram.com/inky_tattoo/");
  });
  it.each([null, undefined, "", "   ", "inky/../x", "javascript:alert(1)", "a".repeat(31)])(
    "refuse l'identifiant Instagram %j",
    (value) => {
      expect(instagramUrl(value)).toBeNull();
    },
  );
  it("construit un mailto seulement pour une adresse valide", () => {
    expect(mailtoUrl("contact@studio.fr")).toBe("mailto:contact@studio.fr");
    expect(mailtoUrl("pas-une-adresse")).toBeNull();
    expect(mailtoUrl("a@b.fr?bcc=x@y.fr")).toBeNull();
    expect(mailtoUrl(null)).toBeNull();
  });
  it("nettoie le numéro de téléphone", () => {
    expect(telUrl("01 23 45 67 89")).toBe("tel:0123456789");
    expect(telUrl("+33 (0)1.23.45.67.89")).toBe("tel:+330123456789");
    expect(telUrl("appelez-nous")).toBeNull();
    expect(telUrl("")).toBeNull();
  });
});
