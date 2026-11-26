import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarPlus } from "lucide-react";
import { listClients } from "@/lib/clients/data";
import { getProject, listArtists } from "@/lib/projects/data";
import { dayLabel, todayKey } from "@/lib/planning/time";
import { KIND_LABELS, type AppointmentKind } from "@/lib/planning/types";
import { planningHref } from "../../planning/links";
import { ProjectForm } from "../project-form";
import { StatusBadge } from "../status-badge";
import { DeleteProject } from "./delete-project";
import { QuotePanel } from "./quote-panel";
import { getProjectQuote } from "@/lib/quotes/data";

export const metadata: Metadata = { title: "Projet" };

export default async function ProjectPage({ params }: PageProps<"/dashboard/projets/[id]">) {
  const { id } = await params;
  const [detail, { rows }, artists, quote] = await Promise.all([
    getProject(id),
    listClients(),
    listArtists(),
    getProjectQuote(id),
  ]);
  if (detail.status === "not-found") notFound();
  if (detail.status === "missing-migration") {
    return (
      <p className="border-line bg-paper text-muted rounded-2xl border p-5">
        Les projets ne sont pas encore activés : la migration <code>projects</code> doit être
        appliquée dans Supabase.
      </p>
    );
  }
  const { project, sessions } = detail;

  const clients = rows.map((c) => ({
    id: c.id,
    label: `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || "Sans nom",
  }));
  // Le client du projet peut être au-delà des fiches chargées : on le garde dans la liste.
  if (!clients.some((c) => c.id === project.clientId)) {
    clients.push({ id: project.clientId, label: project.clientName });
  }
  clients.sort((a, b) => a.label.localeCompare(b.label, "fr"));
  const artistName = new Map(artists.map((a) => [a.userId, a.email]));
  const today = todayKey();

  return (
    <>
      <Link
        href="/dashboard/projets"
        className="text-muted hover:text-ink mb-4 inline-flex items-center gap-1.5 text-sm font-semibold"
      >
        <ArrowLeft aria-hidden size={16} />
        Projets
      </Link>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="font-display min-w-0 text-2xl font-bold tracking-tight break-words">
          {project.title}
        </h1>
        <StatusBadge status={project.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <section className="border-line bg-paper rounded-2xl border p-5 sm:p-6">
          <h2 className="font-display mb-4 font-semibold">Fiche projet</h2>
          <ProjectForm
            project={project}
            clients={clients}
            artists={artists.map((a) => ({ id: a.userId, label: a.email }))}
          />
        </section>

        <div className="grid gap-6">
          <section className="border-line bg-paper rounded-2xl border" aria-labelledby="sessions">
            <div className="border-line flex items-center justify-between gap-3 border-b px-5 py-4">
              <h2 id="sessions" className="font-display font-semibold">
                Séances
              </h2>
              <Link
                href={planningHref("semaine", today)}
                className="text-violet inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
              >
                <CalendarPlus aria-hidden size={16} />
                Planifier
              </Link>
            </div>
            {sessions.length === 0 ? (
              <p className="text-muted px-5 py-6 text-sm">
                Aucune séance. Dans le planning, crée un rendez-vous et choisis ce projet.
              </p>
            ) : (
              <ul className="divide-line divide-y">
                {sessions.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={planningHref("jour", s.dateKey, s.id)}
                      className="hover:bg-wash block px-5 py-3 transition-colors"
                    >
                      <strong className="block truncate">{s.title}</strong>
                      <small className="text-muted block">
                        {dayLabel(s.dateKey, "EEEE d MMMM yyyy")} · {s.startTime} – {s.endTime}
                      </small>
                      <small className="text-muted block truncate">
                        {[
                          KIND_LABELS[s.kind as AppointmentKind] ?? "Rendez-vous",
                          s.artistId ? (artistName.get(s.artistId) ?? "Artiste") : null,
                          s.dateKey < today ? "Passée" : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </small>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {quote.status !== "forbidden" && (
            <section
              className="border-line bg-paper rounded-2xl border p-5"
              aria-labelledby="quote"
            >
              <h2 id="quote" className="font-display mb-4 font-semibold">
                Devis et paiements
              </h2>
              {quote.status === "missing-migration" ? (
                <p className="text-muted text-sm">
                  Les devis ne sont pas encore activés : la migration <code>quotes</code> doit être
                  appliquée dans Supabase.
                </p>
              ) : (
                <QuotePanel projectId={project.id} quote={quote.quote} today={today} />
              )}
            </section>
          )}

          <section className="border-line bg-paper rounded-2xl border p-5">
            <h2 className="font-display font-semibold">Supprimer le projet</h2>
            <p className="text-muted mt-1 mb-4 text-sm">
              Les rendez-vous restent au planning, détachés du projet.
            </p>
            <DeleteProject id={project.id} title={project.title} />
          </section>
        </div>
      </div>
    </>
  );
}
