import { describe, expect, it } from "vitest";
import { appointmentSchema, projectSchema } from "@/lib/validation";
import { isProjectStatus } from "@/lib/projects/types";

const CLIENT = "3f1c2b8e-6a4d-4c2e-9b7a-1d2e3f4a5b6c";
const base = {
  id: "",
  title: " Pivoines ",
  status: "to_draw",
  clientId: CLIENT,
  artistId: "",
  bodyZone: "",
  dimensions: "",
  style: "",
  refs: "",
  artisticNotes: "",
};

describe("projectSchema", () => {
  it("nettoie et rend null les champs facultatifs vides", () => {
    expect(projectSchema.parse(base)).toEqual({
      id: null,
      title: "Pivoines",
      status: "to_draw",
      clientId: CLIENT,
      artistId: null,
      bodyZone: null,
      dimensions: null,
      style: null,
      refs: null,
      artisticNotes: null,
    });
  });
  it("exige un titre et un client valides", () => {
    expect(projectSchema.safeParse({ ...base, title: "  " }).success).toBe(false);
    expect(projectSchema.safeParse({ ...base, clientId: "" }).success).toBe(false);
    expect(projectSchema.safeParse({ ...base, clientId: "pas-un-id" }).success).toBe(false);
  });
  it("refuse un statut inconnu et des textes trop longs", () => {
    expect(projectSchema.safeParse({ ...base, status: "archived" }).success).toBe(false);
    expect(projectSchema.safeParse({ ...base, title: "x".repeat(121) }).success).toBe(false);
    expect(projectSchema.safeParse({ ...base, artisticNotes: "x".repeat(4001) }).success).toBe(
      false,
    );
  });
});

describe("projet d'un rendez-vous", () => {
  const appt = {
    id: "",
    title: "Séance",
    kind: "session",
    date: "2026-12-01",
    start: "10:00",
    end: "12:00",
    clientId: "",
    artistId: "",
    notes: "",
  };
  it("accepte aucun projet ou un identifiant valide", () => {
    expect(appointmentSchema.parse({ ...appt, projectId: "" }).projectId).toBeNull();
    expect(appointmentSchema.parse({ ...appt, projectId: CLIENT }).projectId).toBe(CLIENT);
    expect(appointmentSchema.safeParse({ ...appt, projectId: "x" }).success).toBe(false);
  });
});

describe("isProjectStatus", () => {
  it("reconnaît uniquement les statuts prévus", () => {
    expect(isProjectStatus("in_progress")).toBe(true);
    expect(isProjectStatus("archived")).toBe(false);
    expect(isProjectStatus(undefined)).toBe(false);
  });
});

describe("montants", () => {
  it("lit les montants saisis en euros", async () => {
    const { parseEuros, centsToInput } = await import("@/lib/money");
    expect(parseEuros("450")).toBe(45000);
    expect(parseEuros(" 1 250,5 ")).toBe(125050);
    expect(parseEuros("80.05 €")).toBe(8005);
    expect(parseEuros("")).toBeNull();
    expect(parseEuros("-10")).toBeNull();
    expect(parseEuros("12,345")).toBeNull();
    expect(parseEuros("1000000")).toBeNull();
    expect(centsToInput(125050)).toBe("1250,50");
  });
});
