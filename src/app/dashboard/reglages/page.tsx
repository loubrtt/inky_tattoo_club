import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { requireStudio } from "@/lib/auth/dal";
import { ROLE_LABELS } from "@/lib/roles";
import { getMyProfile, profileOf } from "@/lib/profile/data";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Réglages" };

export default async function SettingsPage() {
  const { user, current, studios } = await requireStudio();
  const profileResult = await getMyProfile();
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
      <section
        id="mon-compte"
        aria-labelledby="mon-compte-titre"
        className="border-line bg-paper shadow-soft mb-6 scroll-mt-6 rounded-2xl border p-5"
      >
        <h2 id="mon-compte-titre" className="font-display text-lg font-semibold">
          Mon compte
        </h2>
        <p className="text-muted mb-4 text-sm">
          Ton prénom s’affiche à l’accueil et ton nom dans l’équipe du studio.
        </p>
        {profileResult.status === "missing-migration" && (
          <p className="text-danger bg-danger/10 mb-4 rounded-xl px-3.5 py-3 text-sm">
            Les profils ne sont pas encore activés (migration à appliquer).
          </p>
        )}
        {profileResult.status === "error" && (
          <p className="text-danger bg-danger/10 mb-4 rounded-xl px-3.5 py-3 text-sm">
            Profil illisible pour le moment. Réessaie dans un instant.
          </p>
        )}
        <ProfileForm profile={profileOf(profileResult)} disabled={profileResult.status !== "ok"} />
      </section>
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
