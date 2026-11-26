import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { listClients, CLIENT_LIST_LIMIT } from "@/lib/clients/data";
import { ClientTable } from "./client-table";
import { NewClientDialog } from "./new-client-dialog";

export const metadata: Metadata = { title: "Clients" };

export default async function ClientsPage() {
  const { rows, truncated } = await listClients();

  return (
    <>
      <PageHeading
        eyebrow="Carnet du studio"
        title="Les"
        accent="clients."
        subtitle="Retrouver et organiser les dossiers clients."
        action={<NewClientDialog />}
      />
      <ClientTable clients={rows} />
      {truncated && (
        <p className="text-muted mt-3 text-xs">
          Seules les {CLIENT_LIST_LIMIT} fiches les plus récentes sont affichées.
        </p>
      )}
      <p className="text-muted mt-3 text-xs">
        Les fiches affichées sont limitées au studio actif de ton compte.
      </p>
    </>
  );
}
