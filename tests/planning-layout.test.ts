import { describe, expect, it } from "vitest";
import { layoutDay } from "@/app/dashboard/planning/layout-events";
import type { Appointment } from "@/lib/planning/types";

const a = (id: string, startMin: number, endMin: number): Appointment => ({
  id,
  title: id,
  kind: "session",
  dateKey: "2026-11-26",
  startMin,
  endMin,
  startTime: "",
  endTime: "",
  clientId: null,
  clientName: null,
  artistId: null,
  notes: null,
});

describe("layoutDay", () => {
  it("liste vide", () => expect(layoutDay([])).toEqual([]));
  it("RDV séparés : une colonne chacun", () => {
    const r = layoutDay([a("x", 600, 660), a("y", 660, 720)]);
    expect(r.map((p) => [p.appt.id, p.col, p.cols])).toEqual([
      ["x", 0, 1],
      ["y", 0, 1],
    ]);
  });
  it("chevauchement : côte à côte, colonne réutilisée", () => {
    const r = layoutDay([a("x", 600, 720), a("y", 630, 690), a("z", 690, 750)]);
    const byId = Object.fromEntries(r.map((p) => [p.appt.id, [p.col, p.cols]]));
    expect(byId).toEqual({ x: [0, 2], y: [1, 2], z: [1, 2] });
  });
});
