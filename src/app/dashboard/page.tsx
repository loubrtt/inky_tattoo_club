import Link from "next/link";
import { requireStudio } from "@/lib/auth/dal";
import { countClients } from "@/lib/clients/data";
import { formatLongToday } from "@/lib/dates";
import { PageHeading } from "@/components/page-heading";
import { NewClientDialog } from "./clients/new-client-dialog";

const MODULES = [
  { href: "/dashboard/projets", label: "Projets en cours", icon: "✳" },
  { href: "/dashboard/devis", label: "Devis à suivre", icon: "€" },
  { href: "/dashboard/apres-soin", label: "Suivis après-soin", icon: "♡" },
];

export default async function DashboardPage() {
  const { current } = await requireStudio();
  const clientCount = await countClients();

  return (
    <>
      <PageHeading
        eyebrow={formatLongToday()}
        title="Bonjour,"
        accent={`${current.studioName}.`}
        subtitle="Voici ce qui se passe au studio."
        action={<NewClientDialog />}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link
          href="/dashboard/clients"
          className="border-line bg-paper shadow-soft hover:border-violet rounded-2xl border p-5"
        >
          <span className="text-muted flex justify-between">
            Clients enregistrés{" "}
            <span aria-hidden className="text-violet">
              ♙
            </span>
          </span>
          <strong className="font-display mt-3 block text-3xl font-extrabold">
            {clientCount ?? "—"}
          </strong>
          <small className="text-muted">
            {clientCount === null ? "Lecture impossible" : "Fiches du studio"}
          </small>
        </Link>
        {MODULES.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="border-line bg-paper shadow-soft hover:border-violet rounded-2xl border p-5"
          >
            <span className="text-muted flex justify-between">
              {m.label}{" "}
              <span aria-hidden className="text-rose">
                {m.icon}
              </span>
            </span>
            <strong className="font-display text-muted/40 mt-3 block text-3xl font-extrabold">
              —
            </strong>
            <small className="text-muted">Module pas encore connecté</small>
          </Link>
        ))}
      </div>
    </>
  );
}
