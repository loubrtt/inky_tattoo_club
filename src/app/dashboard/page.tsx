import Link from "next/link";
import { ArrowRight, CalendarDays, Contact, Users, type LucideIcon } from "lucide-react";
import { requireStudio } from "@/lib/auth/dal";
import { getMyProfile, profileOf } from "@/lib/profile/data";
import { countClients } from "@/lib/clients/data";
import { formatLongToday } from "@/lib/dates";
import { loadPlanning, type PlanningData } from "@/lib/planning/data";
import { dayLabel, rangeFor, todayKey, wallToUtcIso } from "@/lib/planning/time";
import { addDaysKey } from "@/lib/landing/hours";
import { KIND_LABELS, type Appointment } from "@/lib/planning/types";
import { PageHeading } from "@/components/page-heading";
import { NewClientDialog } from "./clients/new-client-dialog";
import { planningHref } from "./planning/links";

const UPCOMING_DAYS = 7; // jours affichés dans « À venir », après aujourd'hui
const UPCOMING_MAX = 15;

// Aujourd'hui + les 7 jours suivants, en une seule lecture.
async function loadComing(today: string): Promise<PlanningData | null> {
  const days = Array.from({ length: UPCOMING_DAYS + 1 }, (_, i) => addDaysKey(today, i));
  const range = {
    ...rangeFor("jour", today),
    days,
    toIso: wallToUtcIso(addDaysKey(today, UPCOMING_DAYS + 1), "00:00"),
  };
  try {
    return await loadPlanning(range, new Map());
  } catch {
    // Déjà journalisé dans loadPlanning : la vue d'ensemble reste utilisable.
    return null;
  }
}

function AppointmentRow({ a, artistName }: { a: Appointment; artistName: string | null }) {
  return (
    <Link
      href={planningHref("jour", a.dateKey, a.id)}
      className="hover:bg-wash grid gap-1 px-5 py-3.5 transition-colors sm:grid-cols-[7rem_1fr_auto] sm:items-center sm:gap-4"
    >
      <span className="text-muted text-sm tabular-nums">
        {a.startTime} – {a.endTime}
      </span>
      <span className="min-w-0">
        <strong className="block truncate">{a.title}</strong>
        <small className="text-muted block truncate">
          {[a.clientName, a.artistId ? (artistName ?? "Artiste") : "Sans artiste"]
            .filter(Boolean)
            .join(" · ")}
        </small>
      </span>
      <span className="text-muted text-xs">{KIND_LABELS[a.kind]}</span>
    </Link>
  );
}

function Stat({
  href,
  label,
  value,
  hint,
  icon: Icon,
}: {
  href: string;
  label: string;
  value: number | null;
  hint: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="border-line bg-paper hover:border-violet/50 group rounded-2xl border p-5 transition-colors"
    >
      <span className="text-muted flex items-center justify-between text-sm">
        {label}
        <Icon aria-hidden size={18} strokeWidth={1.75} className="group-hover:text-violet" />
      </span>
      <strong className="font-display mt-2 block text-3xl font-bold tabular-nums">
        {value ?? "—"}
      </strong>
      <small className="text-muted">{value === null ? "Lecture impossible" : hint}</small>
    </Link>
  );
}

export default async function DashboardPage() {
  const { current } = await requireStudio();
  const today = todayKey();
  const [clientCount, planning, profileResult] = await Promise.all([
    countClients(),
    loadComing(today),
    getMyProfile(),
  ]);
  const firstName = profileOf(profileResult)?.firstName;

  const ok = planning?.status === "ok" ? planning : null;
  const appointments = (ok?.appointments ?? [])
    .filter((a) => a.dateKey === today)
    .sort((a, b) => a.startMin - b.startMin);
  const booked = appointments.filter((a) => a.kind !== "unavailable");
  const upcomingAll = (ok?.appointments ?? [])
    .filter((a) => a.dateKey > today)
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey) || a.startMin - b.startMin);
  const upcoming = upcomingAll.slice(0, UPCOMING_MAX);
  const upcomingByDay = new Map<string, typeof upcoming>();
  for (const a of upcoming)
    upcomingByDay.set(a.dateKey, [...(upcomingByDay.get(a.dateKey) ?? []), a]);
  const artists = new Map((ok?.members ?? []).map((m) => [m.userId, m.email]));
  const date = formatLongToday();

  return (
    <>
      <PageHeading
        title={firstName ? `Bonjour ${firstName}` : "Bonjour"}
        description={`${date.charAt(0).toUpperCase()}${date.slice(1)} · ${current.studioName}`}
        action={<NewClientDialog />}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          href={planningHref("jour", today)}
          label="Rendez-vous aujourd’hui"
          value={ok ? booked.length : null}
          hint="Hors indisponibilités"
          icon={CalendarDays}
        />
        <Stat
          href="/dashboard/clients"
          label="Clients"
          value={clientCount}
          hint="Fiches du studio"
          icon={Contact}
        />
        <Stat
          href="/dashboard/equipe"
          label="Équipe"
          value={ok ? ok.members.length : null}
          hint="Membres avec un accès"
          icon={Users}
        />
      </div>

      <section className="border-line bg-paper mt-6 rounded-2xl border" aria-labelledby="today">
        <div className="border-line flex items-center justify-between gap-3 border-b px-5 py-4">
          <h2 id="today" className="font-display font-semibold">
            Aujourd’hui
          </h2>
          <Link
            href={planningHref("jour", today)}
            className="text-violet inline-flex items-center gap-1 text-sm font-semibold hover:underline"
          >
            Ouvrir le planning
            <ArrowRight aria-hidden size={15} />
          </Link>
        </div>
        {!ok ? (
          <p className="text-muted px-5 py-8 text-center">
            {planning?.status === "missing-migration"
              ? "Le planning n’est pas encore activé."
              : "Le planning n’a pas pu être lu. Réessaie dans un instant."}
          </p>
        ) : appointments.length === 0 ? (
          <p className="text-muted px-5 py-8 text-center">Aucun rendez-vous aujourd’hui.</p>
        ) : (
          <ul className="divide-line divide-y">
            {appointments.map((a) => (
              <li key={a.id}>
                <AppointmentRow
                  a={a}
                  artistName={a.artistId ? (artists.get(a.artistId) ?? null) : null}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {ok && (
        <section className="border-line bg-paper mt-6 rounded-2xl border" aria-labelledby="coming">
          <div className="border-line flex items-center justify-between gap-3 border-b px-5 py-4">
            <h2 id="coming" className="font-display font-semibold">
              À venir <span className="text-muted font-normal">· 7 prochains jours</span>
            </h2>
            <Link
              href={planningHref("semaine", addDaysKey(today, 1))}
              className="text-violet inline-flex items-center gap-1 text-sm font-semibold hover:underline"
            >
              Voir la semaine
              <ArrowRight aria-hidden size={15} />
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-muted px-5 py-8 text-center">
              Aucun rendez-vous dans les 7 prochains jours.
            </p>
          ) : (
            <>
              {[...upcomingByDay].map(([day, list]) => (
                <div key={day}>
                  <h3 className="bg-wash text-muted px-5 py-2 text-xs font-semibold first-letter:uppercase">
                    {dayLabel(day, "EEEE d MMMM")}
                  </h3>
                  <ul className="divide-line divide-y">
                    {list.map((a) => (
                      <li key={a.id}>
                        <AppointmentRow
                          a={a}
                          artistName={a.artistId ? (artists.get(a.artistId) ?? null) : null}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {upcomingAll.length > upcoming.length && (
                <p className="text-muted border-line border-t px-5 py-3 text-sm">
                  Et {upcomingAll.length - upcoming.length} autre
                  {upcomingAll.length - upcoming.length > 1 ? "s" : ""} : ouvre le planning pour
                  tout voir.
                </p>
              )}
            </>
          )}
        </section>
      )}
    </>
  );
}
