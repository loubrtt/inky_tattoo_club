import { describe, expect, it } from "vitest";
import { profileSchema } from "@/lib/validation";
import { displayName } from "@/lib/profile/display";

describe("profileSchema", () => {
  it("nettoie et rend null les champs facultatifs vides", () => {
    expect(profileSchema.parse({ firstName: "  Lou ", lastName: " ", phone: "" })).toEqual({
      firstName: "Lou",
      lastName: null,
      phone: null,
    });
  });
  it("accepte un numéro français ou international", () => {
    expect(
      profileSchema.parse({ firstName: "a", lastName: "", phone: "06 12 34 56 78" }).phone,
    ).toBe("06 12 34 56 78");
    expect(
      profileSchema.safeParse({ firstName: "a", lastName: "", phone: "+33 6 12 34 56 78" }).success,
    ).toBe(true);
  });
  it("refuse prénom vide, textes trop longs, numéro invalide", () => {
    expect(profileSchema.safeParse({ firstName: "   ", lastName: "", phone: "" }).success).toBe(
      false,
    );
    expect(
      profileSchema.safeParse({ firstName: "a".repeat(81), lastName: "", phone: "" }).success,
    ).toBe(false);
    expect(
      profileSchema.safeParse({ firstName: "a", lastName: "b".repeat(81), phone: "" }).success,
    ).toBe(false);
    expect(
      profileSchema.safeParse({ firstName: "a", lastName: "", phone: "appelle-moi" }).success,
    ).toBe(false);
    expect(profileSchema.safeParse({ firstName: "a", lastName: "", phone: "123" }).success).toBe(
      false,
    );
  });
});

describe("displayName", () => {
  it("prénom et nom, sinon prénom, sinon e-mail", () => {
    expect(displayName({ firstName: "Lou", lastName: "B", phone: null }, "x@y.fr")).toBe("Lou B");
    expect(displayName({ firstName: "Lou", lastName: null, phone: null }, "x@y.fr")).toBe("Lou");
    expect(displayName(null, "x@y.fr")).toBe("x@y.fr");
    expect(displayName(null, null)).toBe("Mon compte");
  });
});
