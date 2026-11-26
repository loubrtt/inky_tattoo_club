import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { requireStudio } from "@/lib/auth/dal";
import { getStudioSite } from "@/lib/landing/data";
import { canEditSite } from "@/lib/roles";
import { SiteForm } from "./site-form";

export const metadata: Metadata = { title: "Site public" };

const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Europe/Paris",
});

export default async function SitePage() {
  const { current } = await requireStudio();

  if (!canEditSite(current.role)) {
    return (
      <>
        <PageHeading
          title="Site public"
          description="Seuls les propriétaires et administrateurs du studio peuvent modifier le site public."
        />
      </>
    );
  }

  const site = await getStudioSite();

  return (
    <>
      <PageHeading
        title="Site public"
        description={
          site?.updatedAt
            ? `Dernière modification le ${dateFormat.format(new Date(site.updatedAt))}.`
            : "Ce que tu enregistres ici s’affiche tout de suite sur la page publique."
        }
        action={
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="border-line hover:bg-wash rounded-xl border px-4 py-3 font-semibold"
          >
            Voir le site ↗
          </a>
        }
      />
      {site ? (
        <SiteForm initial={site.content} />
      ) : (
        <p className="border-line bg-paper text-danger rounded-2xl border p-5">
          Le contenu du site n’a pas pu être chargé. Réessaie dans un instant.
        </p>
      )}
    </>
  );
}
