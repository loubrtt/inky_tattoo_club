import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { requireStudio } from "@/lib/auth/dal";
import { ROLE_LABELS } from "@/lib/roles";

export const metadata: Metadata = { title: "Réglages" };

export default async function SettingsPage() {
  const { user, current, studios } = await requireStudio();
  const rows = [
    { label: "Nom du studio", hint: "Nom affiché dans l’application", value: current.studioName },
    { label: "Ton rôle", hint: "Dans ce studio", value: ROLE_LABELS[current.role] },
    { label: "Ton compte", hint: "Adresse de connexion", value: user.email ?? "—" },
    { label: "Studios accessibles", hint: "Avec ce compte", value: String(studios.length) },
    { label: "Réservations en ligne", hint: "Choix de conception", value: "Non prévu" },
  ];

  return (
    <>
      <PageHeading title="Réglages" description="Ton compte et les informations du studio." />
      <div className="divide-line border-line bg-paper shadow-soft divide-y rounded-2xl border">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex flex-wrap items-center justify-between gap-2 px-5 py-4"
          >
            <span>
              <strong className="block">{r.label}</strong>
              <small className="text-muted">{r.hint}</small>
            </span>
            <b className="text-violet-ink">{r.value}</b>
          </div>
        ))}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
          <span>
            <strong className="block">Mot de passe</strong>
            <small className="text-muted">Reçois un lien pour le changer</small>
          </span>
          <Link href="/mot-de-passe-oublie" className="text-violet font-semibold hover:underline">
            Changer
          </Link>
        </div>
      </div>
    </>
  );
}
