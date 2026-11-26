import type { Metadata } from "next";
import { ComingSoon, PageHeading } from "@/components/page-heading";

export const metadata: Metadata = { title: "Projets & séances" };

export default function ProjectsPage() {
  return (
    <>
      <PageHeading
        eyebrow="Création & réalisation"
        title="Projets"
        accent="& séances."
        subtitle="Un projet peut contenir plusieurs séances et son historique."
      />
      <ComingSoon
        items={[
          {
            title: "Fiche projet",
            text: "Zone du corps, dimensions, style, références, notes artistiques et statut.",
          },
          {
            title: "Séances",
            text: "Dates, durée, artiste, notes de séance et progression du projet.",
          },
          {
            title: "Traçabilité",
            text: "Encres, références et lots, consommables et matériel utilisés.",
          },
        ]}
      />
    </>
  );
}
