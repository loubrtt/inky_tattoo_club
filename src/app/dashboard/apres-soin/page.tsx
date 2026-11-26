import type { Metadata } from "next";
import { ComingSoon, PageHeading } from "@/components/page-heading";

export const metadata: Metadata = { title: "Suivi après-soin" };

export default function AftercarePage() {
  return (
    <>
      <PageHeading
        eyebrow="Accompagnement client"
        title="Après-"
        accent="soin."
        subtitle="Centraliser les consignes remises et le suivi après tatouage."
      />
      <ComingSoon
        items={[
          { title: "Consignes", text: "Version du document d’après-soin remise au client." },
          { title: "Suivi", text: "Date de contrôle et notes factuelles." },
          { title: "Historique", text: "Retours du client et actions de l’équipe." },
        ]}
      />
    </>
  );
}
