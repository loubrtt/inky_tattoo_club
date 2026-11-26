"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { ClientRow } from "@/lib/supabase/types";
import { formatDate } from "@/lib/dates";

function normalize(value: string) {
  return value
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function initials(c: ClientRow) {
  return `${(c.first_name ?? "").charAt(0)}${(c.last_name ?? "").charAt(0)}`.toUpperCase() || "?";
}

export function ClientTable({ clients }: { clients: ClientRow[] }) {
  const [query, setQuery] = useState("");

  const indexed = useMemo(
    () =>
      clients.map((c) => ({
        client: c,
        haystack: normalize(
          [c.first_name ?? "", c.last_name ?? "", c.email ?? "", c.project_summary ?? ""].join(" "),
        ),
      })),
    [clients],
  );
  const q = normalize(query.trim());
  const visible = q ? indexed.filter((i) => i.haystack.includes(q)) : indexed;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <label className="border-line bg-paper flex min-w-0 flex-1 items-center gap-2 rounded-xl border px-3.5 py-2.5 sm:max-w-sm">
          <Search aria-hidden size={16} className="text-muted shrink-0" />
          <span className="sr-only">Rechercher un client</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un client…"
            maxLength={100}
            className="min-w-0 flex-1 bg-transparent outline-none"
          />
        </label>
        <span className="text-muted text-xs" aria-live="polite">
          {visible.length} fiche{visible.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="border-line bg-paper shadow-soft overflow-hidden rounded-2xl border">
        {visible.length === 0 ? (
          <p className="text-muted p-8 text-center">
            {clients.length === 0
              ? "Aucune fiche client dans ce studio pour le moment."
              : "Aucune fiche ne correspond à cette recherche."}
          </p>
        ) : (
          <ul className="divide-line divide-y">
            {visible.map(({ client: c }) => (
              <li
                key={c.id}
                className="grid gap-2 px-5 py-4 sm:grid-cols-[2fr_2fr_1fr] sm:items-center"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="bg-violet-pale text-violet grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold">
                    {initials(c)}
                  </span>
                  <span className="min-w-0">
                    <strong className="block truncate">
                      {c.first_name} {c.last_name}
                    </strong>
                    <small className="text-muted block truncate">
                      {c.email ?? "Aucun e-mail renseigné"}
                    </small>
                  </span>
                </div>
                <span className="text-muted line-clamp-2">{c.project_summary ?? "À définir"}</span>
                <span className="text-muted text-xs sm:text-right">{formatDate(c.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
