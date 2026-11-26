import {
  ARTIST_COLORS,
  UNAVAILABLE_COLOR,
  type Appointment,
  type Member,
} from "@/lib/planning/types";

export function colorFor(a: Appointment, members: Map<string, Member>) {
  if (a.kind === "unavailable") return UNAVAILABLE_COLOR;
  const m = a.artistId ? members.get(a.artistId) : undefined;
  return ARTIST_COLORS[(m?.color ?? 0) % ARTIST_COLORS.length];
}
