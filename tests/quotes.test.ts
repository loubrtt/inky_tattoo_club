import { describe, expect, it } from "vitest";
import { paymentSchema, quoteSchema } from "@/lib/validation";
import { summarize } from "@/lib/quotes/types";
import { canSeeMoney } from "@/lib/roles";

const ID = "3f1c2b8e-6a4d-4c2e-9b7a-1d2e3f4a5b6c";

describe("quoteSchema", () => {
  it("convertit en centimes, acompte vide = 0", () => {
    expect(quoteSchema.parse({ projectId: ID, total: "450", deposit: "", status: "sent" })).toEqual(
      { projectId: ID, total: 45000, deposit: 0, status: "sent" },
    );
  });
  it("refuse un acompte supérieur au total et un montant invalide", () => {
    expect(
      quoteSchema.safeParse({ projectId: ID, total: "100", deposit: "150", status: "sent" })
        .success,
    ).toBe(false);
    expect(
      quoteSchema.safeParse({ projectId: ID, total: "abc", deposit: "", status: "sent" }).success,
    ).toBe(false);
    expect(
      quoteSchema.safeParse({ projectId: ID, total: "100", deposit: "", status: "paid" }).success,
    ).toBe(false);
  });
});

describe("paymentSchema", () => {
  const ok = { quoteId: ID, paidOn: "2026-11-27", amount: "100", method: "cash" };
  it("accepte un règlement valide", () => {
    expect(paymentSchema.parse(ok).amount).toBe(10000);
  });
  it("refuse 0 €, une date mal formée et un moyen inconnu", () => {
    expect(paymentSchema.safeParse({ ...ok, amount: "0" }).success).toBe(false);
    expect(paymentSchema.safeParse({ ...ok, paidOn: "27/11/2026" }).success).toBe(false);
    expect(paymentSchema.safeParse({ ...ok, method: "card" }).success).toBe(false);
  });
});

describe("reste à percevoir", () => {
  it("additionne les règlements et ne descend pas sous zéro", () => {
    expect(summarize(45000, [{ amountCents: 10000 }, { amountCents: 5000 }])).toEqual({
      paidCents: 15000,
      remainingCents: 30000,
    });
    expect(summarize(10000, [{ amountCents: 12000 }]).remainingCents).toBe(0);
    expect(summarize(10000, []).paidCents).toBe(0);
  });
  it("l'assistant ne voit pas les montants", () => {
    expect(canSeeMoney("artist")).toBe(true);
    expect(canSeeMoney("assistant")).toBe(false);
  });
});
