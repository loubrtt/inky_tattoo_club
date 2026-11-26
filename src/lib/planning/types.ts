export const APPOINTMENT_KINDS = [
  "session",
  "consultation",
  "touch_up",
  "unavailable",
  "other",
] as const;
export type AppointmentKind = (typeof APPOINTMENT_KINDS)[number];

export const KIND_LABELS: Record<AppointmentKind, string> = {
  session: "Séance",
  consultation: "Consultation",
  touch_up: "Retouche",
  unavailable: "Indisponible",
  other: "Autre",
};

export type Appointment = {
  id: string;
  title: string;
  kind: AppointmentKind;
  dateKey: string; // jour (Paris) du début
  startMin: number; // minutes depuis minuit, heure de Paris
  endMin: number; // borné à 1440 si le RDV déborde sur le lendemain
  startTime: string; // "HH:mm"
  endTime: string;
  clientId: string | null;
  clientName: string | null;
  artistId: string | null;
  projectId: string | null;
  notes: string | null;
};

export type Member = { userId: string; email: string; role: string; color: number };

export type ClientOption = { id: string; name: string };

// Couleurs des artistes (index = position dans l'annuaire du studio).
export const ARTIST_COLORS = [
  { bg: "#efe4f6", border: "#8d52a8", text: "#4f2c61" },
  { bg: "#fbe3ef", border: "#bd6c98", text: "#6e2c50" },
  { bg: "#e1f1ea", border: "#4b987b", text: "#1f5340" },
  { bg: "#e3ecfa", border: "#4f78c4", text: "#22406f" },
  { bg: "#fdeedb", border: "#d38a2e", text: "#6b4410" },
  { bg: "#e6f4f6", border: "#3a98a6", text: "#164e57" },
  { bg: "#f6e6e3", border: "#c0645a", text: "#682a23" },
  { bg: "#eceaf9", border: "#6b5fc7", text: "#332a73" },
] as const;

export const UNAVAILABLE_COLOR = { bg: "#f0eef2", border: "#a49ba9", text: "#5d5663" };
