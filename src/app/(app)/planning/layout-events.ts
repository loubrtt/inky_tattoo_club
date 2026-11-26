import type { Appointment } from "@/lib/planning/types";

export type Placed = { appt: Appointment; col: number; cols: number };

// Place les RDV qui se chevauchent côte à côte (comme Google Agenda).
export function layoutDay(appts: Appointment[]): Placed[] {
  const sorted = [...appts].sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin);
  const out: Placed[] = [];
  let cluster: Placed[] = [];
  let clusterEnd = -1;
  let colEnds: number[] = [];

  const flush = () => {
    const cols = colEnds.length || 1;
    cluster.forEach((p) => (p.cols = cols));
    out.push(...cluster);
    cluster = [];
    colEnds = [];
  };

  for (const appt of sorted) {
    if (appt.startMin >= clusterEnd && cluster.length) flush();
    let col = colEnds.findIndex((end) => end <= appt.startMin);
    if (col === -1) {
      col = colEnds.length;
      colEnds.push(appt.endMin);
    } else {
      colEnds[col] = appt.endMin;
    }
    cluster.push({ appt, col, cols: 1 });
    clusterEnd = Math.max(clusterEnd, appt.endMin);
  }
  if (cluster.length) flush();
  return out;
}
