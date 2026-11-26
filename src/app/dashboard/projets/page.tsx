import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { listClients } from "@/lib/clients/data";
import { formatDate } from "@/lib/dates";
import { listArtists, listProjects, PROJECT_LIST_LIMIT } from "@/lib/projects/data";
import { isProjectStatus, PROJECT_STATUSES, PROJECT_STATUS_LABELS } from "@/lib/projects/types";
import { NewProjectDialog } from "./new-project-dialog";
import { StatusBadge } from "./status-badge";

export const metadata: Metadata = { title: "Projets et séances" };

export default async function ProjectsPage({ searchParams }: PageProps<"/dashboard/projets">) {
  const params = await searchParams;
  const filter = isProjectStatus(params.statut) ? params.statut : null;
  const [list, { rows }, artists] = await Promise.all([
    listProjects(filter),
    listClients(),
    listArtists(),
  ]);

  const clients = rows
    .map((c) => ({
      id: c.id,
      label: `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || "Sans nom",
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "fr"));
  const artistOptions = artists.map((a) => ({ id: a.userId, label: a.email }));
  const artistName = new Map(artists.map((a) => [a.userId, a.email]));

  if (list.status === "missing-migration") {
    return (
      <>
        <PageHeading title="Projets et séances" />
        <p className="border-line bg-paper text-muted rounded-2xl border p-5">
          Les projets ne sont pas encore activés : la migration <code>projects</code> doit être
          appliquée dans Supabase.
        </p>
      </>
    );
  }

  const tabs = [
    { key: null, label: "Tous" },
    ...PROJECT_STATUSES.map((s) => ({ key: s, label: PROJECT_STATUS_LABELS[s] })),
  ];

  return (
    <>
      <PageHeading
        title="Projets et séances"
        description="Chaque projet regroupe la fiche du tatouage et ses séances au planning."
        action={<NewProjectDialog clients={clients} artists={artistOptions} />}
      />

      <nav aria-label="Filtrer par statut" className="mb-4 flex flex-wrap gap-1">
        {tabs.map((t) => {
          const active = t.key === filter;
          return (
            <Link
              key={t.label}
              href={t.key ? `/dashboard/projets?statut=${t.key}` : "/dashboard/projets"}
              aria-current={active ? "page" : undefined}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                active
                  ? "bg-violet-pale text-violet-ink"
                  : "text-muted hover:bg-wash hover:text-ink"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-line bg-paper overflow-hidden rounded-2xl border">
        {list.projects.length === 0 ? (
          <p className="text-muted p-8 text-center">
            {filter
              ? "Aucun projet avec ce statut."
              : "Aucun projet pour le moment. Crée le premier avec « Nouveau projet »."}
          </p>
        ) : (
          <ul className="divide-line divide-y">
            {list.projects.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/dashboard/projets/${p.id}`}
                  className="hover:bg-wash grid gap-2 px-5 py-4 transition-colors sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-6"
                >
                  <span className="min-w-0">
                    <strong className="block truncate">{p.title}</strong>
                    <small className="text-muted block truncate">
                      {[
                        p.clientName,
                        p.artistId ? (artistName.get(p.artistId) ?? "Artiste") : null,
                        [p.bodyZone, p.style].filter(Boolean).join(", ") || null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </small>
                  </span>
                  <span className="flex items-center gap-3">
                    <StatusBadge status={p.status} />
                    <span className="text-muted text-xs tabular-nums">
                      Modifié le {formatDate(p.updatedAt)}
                    </span>
                  </span>
                  <ChevronRight aria-hidden size={18} className="text-muted hidden sm:block" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      {list.truncated && (
        <p className="text-muted mt-3 text-xs">
          Seuls les {PROJECT_LIST_LIMIT} projets modifiés le plus récemment sont affichés.
        </p>
      )}
    </>
  );
}
