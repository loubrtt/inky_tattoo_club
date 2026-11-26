import type { Metadata } from "next";
import { listClients } from "@/lib/clients/data";
import { loadPlanning } from "@/lib/planning/data";
import { listProjectOptions } from "@/lib/projects/data";
import { parseDateKey, parseView, rangeFor, todayKey } from "@/lib/planning/time";
import { Planning } from "./planning";

export const metadata: Metadata = { title: "Planning" };

export default async function PlanningPage({ searchParams }: PageProps<"/dashboard/planning">) {
  const params = await searchParams;
  const range = rangeFor(parseView(params.vue), parseDateKey(params.date));
  const selected = typeof params.rdv === "string" ? params.rdv : null;

  const { rows } = await listClients();
  const clients = rows
    .map((c) => ({
      id: c.id,
      name: `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || "Sans nom",
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
  const [data, projects] = await Promise.all([
    loadPlanning(range, new Map(clients.map((c) => [c.id, c.name]))),
    listProjectOptions(),
  ]);

  if (data.status === "missing-migration") {
    return (
      <div className="border-line bg-paper shadow-soft rounded-2xl border p-8">
        <h1 className="font-display text-2xl font-extrabold">Planning pas encore activé</h1>
        <p className="text-muted mt-2">
          La table des rendez-vous n&apos;existe pas encore dans Supabase. Applique la migration{" "}
          <code className="bg-wash text-ink rounded px-1.5 py-0.5">
            supabase/migrations/20261126220000_appointments.sql
          </code>{" "}
          dans le SQL Editor, puis recharge cette page.
        </p>
      </div>
    );
  }

  return (
    <Planning
      range={range}
      today={todayKey()}
      appointments={data.appointments}
      members={data.members}
      clients={clients}
      projects={projects}
      initialSelected={selected}
    />
  );
}
