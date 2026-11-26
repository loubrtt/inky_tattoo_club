import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { formatEuros } from "@/lib/money";
import { listQuotes, QUOTE_LIST_LIMIT } from "@/lib/quotes/data";
import { QUOTE_STATUS_LABELS } from "@/lib/quotes/types";

export const metadata: Metadata = { title: "Devis et paiements" };

export default async function QuotesPage({ searchParams }: PageProps<"/dashboard/devis">) {
  const params = await searchParams;
  const onlyDue = params.filtre === "a-percevoir";
  const list = await listQuotes();

  const heading = (
    <PageHeading
      title="Devis et paiements"
      description="Montants convenus, acomptes et règlements reçus. Aucun paiement par carte."
    />
  );

  if (list.status === "forbidden") {
    return (
      <>
        {heading}
        <p className="border-line bg-paper text-muted rounded-2xl border p-5">
          Ton rôle ne permet pas de voir les montants du studio.
        </p>
      </>
    );
  }
  if (list.status === "missing-migration") {
    return (
      <>
        {heading}
        <p className="border-line bg-paper text-muted rounded-2xl border p-5">
          Les devis ne sont pas encore activés : les migrations <code>projects</code> puis{" "}
          <code>quotes</code> doivent être appliquées dans Supabase.
        </p>
      </>
    );
  }

  const active = list.quotes.filter((q) => q.status !== "declined");
  const totals = active.reduce(
    (t, q) => ({ paid: t.paid + q.paidCents, due: t.due + q.remainingCents }),
    { paid: 0, due: 0 },
  );
  const shown = onlyDue ? active.filter((q) => q.remainingCents > 0) : list.quotes;

  return (
    <>
      {heading}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="border-line bg-paper rounded-2xl border p-5">
          <span className="text-muted text-sm">Reçu (devis non refusés)</span>
          <strong className="font-display mt-1 block text-2xl font-bold tabular-nums">
            {formatEuros(totals.paid)}
          </strong>
        </div>
        <div className="border-line bg-paper rounded-2xl border p-5">
          <span className="text-muted text-sm">Reste à percevoir</span>
          <strong className="font-display mt-1 block text-2xl font-bold tabular-nums">
            {formatEuros(totals.due)}
          </strong>
        </div>
      </div>

      <nav aria-label="Filtrer les devis" className="mb-4 flex flex-wrap gap-1">
        {[
          { href: "/dashboard/devis", label: "Tous", on: !onlyDue },
          { href: "/dashboard/devis?filtre=a-percevoir", label: "Reste à percevoir", on: onlyDue },
        ].map((t) => (
          <Link
            key={t.href}
            href={t.href}
            aria-current={t.on ? "page" : undefined}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
              t.on ? "bg-violet-pale text-violet-ink" : "text-muted hover:bg-wash hover:text-ink"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="border-line bg-paper overflow-hidden rounded-2xl border">
        {shown.length === 0 ? (
          <p className="text-muted p-8 text-center">
            {onlyDue
              ? "Rien à percevoir pour le moment."
              : "Aucun devis. Un devis se crée depuis la fiche d’un projet."}
          </p>
        ) : (
          <ul className="divide-line divide-y">
            {shown.map((q) => (
              <li key={q.id}>
                <Link
                  href={`/dashboard/projets/${q.projectId}`}
                  className="hover:bg-wash grid gap-2 px-5 py-4 transition-colors sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-6"
                >
                  <span className="min-w-0">
                    <strong className="block truncate">{q.projectTitle}</strong>
                    <small className="text-muted block truncate">
                      {q.clientName} · {QUOTE_STATUS_LABELS[q.status]}
                    </small>
                  </span>
                  <span className="grid grid-cols-3 gap-4 text-right text-sm tabular-nums sm:w-80">
                    <span>
                      <small className="text-muted block">Total</small>
                      {formatEuros(q.totalCents)}
                    </span>
                    <span>
                      <small className="text-muted block">Reçu</small>
                      {formatEuros(q.paidCents)}
                    </span>
                    <span>
                      <small className="text-muted block">Reste</small>
                      <strong>{formatEuros(q.remainingCents)}</strong>
                    </span>
                  </span>
                  <ChevronRight aria-hidden size={18} className="text-muted hidden sm:block" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      {list.truncated && (
        <p className="text-muted mt-3 text-xs">
          Seuls les {QUOTE_LIST_LIMIT} devis modifiés le plus récemment sont affichés.
        </p>
      )}
    </>
  );
}
