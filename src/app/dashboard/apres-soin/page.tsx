import type { Metadata } from "next";
import { ComingSoon, NotBuiltYet, PageHeading } from "@/components/page-heading";

export const metadata: Metadata = { title: "Suivi après-soin" };

export default function AftercarePage() {
  return (
    <>
      <PageHeading
        title="Suivi après-soin"
        description="Centraliser les consignes remises et le suivi après tatouage."
      />
      <NotBuiltYet />
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
