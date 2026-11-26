import type { Metadata } from "next";
import { ComingSoon, PageHeading } from "@/components/page-heading";

export const metadata: Metadata = { title: "Devis & paiements" };

export default function QuotesPage() {
  return (
    <>
      <PageHeading
        eyebrow="Suivi interne"
        title="Devis"
        accent="& paiements."
        subtitle="Suivre les montants convenus, acomptes et soldes. Aucun paiement par carte."
      />
      <ComingSoon
        items={[
          { title: "Devis", text: "Montant convenu, date, durée estimée et conditions." },
          {
            title: "Acompte",
            text: "Montant et date de réception, avec justificatif si nécessaire.",
          },
          { title: "Solde", text: "Historique des règlements et reste à percevoir." },
        ]}
      />
    </>
  );
}
