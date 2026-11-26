import { describe, expect, it } from "vitest";
import { clientSchema, loginSchema, newPasswordSchema } from "@/lib/validation";

describe("clientSchema", () => {
  it("nettoie et rend null les champs facultatifs vides", () => {
    const r = clientSchema.parse({
      firstName: "  Alex ",
      lastName: "Martin",
      email: "  ",
      project: "",
    });
    expect(r).toEqual({ firstName: "Alex", lastName: "Martin", email: null, project: null });
  });
  it("met l'e-mail en minuscules", () => {
    expect(
      clientSchema.parse({ firstName: "a", lastName: "b", email: "A@B.FR", project: "" }).email,
    ).toBe("a@b.fr");
  });
  it("refuse prénom vide, e-mail invalide, textes trop longs", () => {
    expect(
      clientSchema.safeParse({ firstName: "  ", lastName: "b", email: "", project: "" }).success,
    ).toBe(false);
    expect(
      clientSchema.safeParse({ firstName: "a", lastName: "b", email: "pas-un-mail", project: "" })
        .success,
    ).toBe(false);
    expect(
      clientSchema.safeParse({ firstName: "a".repeat(81), lastName: "b", email: "", project: "" })
        .success,
    ).toBe(false);
    expect(
      clientSchema.safeParse({
        firstName: "a",
        lastName: "b",
        email: "",
        project: "x".repeat(1001),
      }).success,
    ).toBe(false);
  });
});

describe("loginSchema", () => {
  it("refuse un e-mail invalide ou un mot de passe vide", () => {
    expect(loginSchema.safeParse({ email: "x", password: "y" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "a@b.fr", password: "" }).success).toBe(false);
  });
});

describe("newPasswordSchema", () => {
  it("exige 8 à 72 caractères et une confirmation identique", () => {
    expect(newPasswordSchema.safeParse({ password: "court", confirm: "court" }).success).toBe(
      false,
    );
    expect(
      newPasswordSchema.safeParse({ password: "x".repeat(73), confirm: "x".repeat(73) }).success,
    ).toBe(false);
    expect(
      newPasswordSchema.safeParse({ password: "motdepasse", confirm: "autre-chose" }).success,
    ).toBe(false);
    expect(
      newPasswordSchema.safeParse({ password: "motdepasse", confirm: "motdepasse" }).success,
    ).toBe(true);
  });
});
