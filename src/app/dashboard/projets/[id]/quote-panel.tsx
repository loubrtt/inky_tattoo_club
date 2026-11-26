"use client";

import { useActionState, useEffect, useRef, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { addPayment, removePayment, saveQuote } from "@/lib/quotes/actions";
import { centsToInput, formatEuros } from "@/lib/money";
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  QUOTE_STATUSES,
  QUOTE_STATUS_LABELS,
  type Quote,
} from "@/lib/quotes/types";
import { ActionForm, Field, FormMessage, SelectField, SubmitButton } from "@/components/ui";
import { formatDate } from "@/lib/dates";

export function QuotePanel({
  projectId,
  quote,
  today,
}: {
  projectId: string;
  quote: Quote | null;
  today: string;
}) {
  const [state, action, pending] = useActionState(saveQuote, {});

  return (
    <div className="grid gap-5">
      <ActionForm action={action} className="grid gap-3">
        <input type="hidden" name="projectId" value={projectId} />
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Montant total (€)"
            name="total"
            inputMode="decimal"
            required
            defaultValue={quote ? centsToInput(quote.totalCents) : ""}
            placeholder="Ex. 450"
            error={state.errors?.total}
          />
          <Field
            label="Acompte (€)"
            name="deposit"
            inputMode="decimal"
            defaultValue={quote ? centsToInput(quote.depositCents) : ""}
            placeholder="Ex. 100"
            error={state.errors?.deposit}
          />
        </div>
        <SelectField
          label="Statut du devis"
          name="status"
          defaultValue={quote?.status ?? "sent"}
          error={state.errors?.status}
        >
          {QUOTE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {QUOTE_STATUS_LABELS[s]}
            </option>
          ))}
        </SelectField>
        <FormMessage message={state.message} ok={state.ok} />
        <SubmitButton pending={pending} pendingLabel="Enregistrement…">
          {quote ? "Enregistrer le devis" : "Créer le devis"}
        </SubmitButton>
      </ActionForm>

      {quote && (
        <>
          <dl className="border-line grid grid-cols-3 gap-2 border-t pt-4 text-center">
            {[
              { label: "Total", value: quote.totalCents },
              { label: "Reçu", value: quote.paidCents },
              { label: "Reste", value: quote.remainingCents },
            ].map((r) => (
              <div key={r.label}>
                <dt className="text-muted text-xs">{r.label}</dt>
                <dd className="font-semibold tabular-nums">{formatEuros(r.value)}</dd>
              </div>
            ))}
          </dl>
          {quote.depositCents > 0 && quote.paidCents < quote.depositCents && (
            <p className="text-muted text-xs">
              Acompte de {formatEuros(quote.depositCents)} pas encore entièrement reçu.
            </p>
          )}
          <Payments quote={quote} today={today} />
        </>
      )}
    </div>
  );
}

function Payments({ quote, today }: { quote: Quote; today: string }) {
  const form = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(addPayment, {});
  const [removeState, remove, removing] = useActionState(removePayment, {});

  useEffect(() => {
    if (state.ok) form.current?.reset();
  }, [state]);

  const confirmRemove = (e: FormEvent<HTMLFormElement>) => {
    if (!window.confirm("Retirer ce règlement ?")) e.preventDefault();
  };

  return (
    <div className="grid gap-3">
      <h3 className="font-semibold">Règlements reçus</h3>
      {quote.payments.length === 0 ? (
        <p className="text-muted text-sm">Aucun règlement enregistré.</p>
      ) : (
        <ul className="divide-line border-line divide-y rounded-xl border">
          {quote.payments.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <span className="min-w-0">
                <strong className="tabular-nums">{formatEuros(p.amountCents)}</strong>
                <span className="text-muted">
                  {" "}
                  · {formatDate(`${p.paidOn}T12:00:00Z`)} · {PAYMENT_METHOD_LABELS[p.method]}
                </span>
              </span>
              <form action={remove} onSubmit={confirmRemove}>
                <input type="hidden" name="id" value={p.id} />
                <button
                  type="submit"
                  disabled={removing}
                  aria-label={`Retirer le règlement de ${formatEuros(p.amountCents)}`}
                  className="text-muted hover:bg-danger/10 hover:text-danger grid size-8 place-items-center rounded-lg disabled:opacity-60"
                >
                  <Trash2 aria-hidden size={15} />
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
      {!removeState.ok && <FormMessage message={removeState.message} />}

      <ActionForm ref={form} action={action} className="bg-wash grid gap-3 rounded-xl p-3">
        <input type="hidden" name="quoteId" value={quote.id} />
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Montant (€)"
            name="amount"
            inputMode="decimal"
            required
            placeholder="Ex. 100"
            error={state.errors?.amount}
          />
          <Field
            label="Date"
            name="paidOn"
            type="date"
            required
            defaultValue={today}
            error={state.errors?.paidOn}
          />
        </div>
        <SelectField
          label="Moyen"
          name="method"
          defaultValue="transfer"
          error={state.errors?.method}
        >
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>
              {PAYMENT_METHOD_LABELS[m]}
            </option>
          ))}
        </SelectField>
        <FormMessage message={state.message} ok={state.ok} />
        <SubmitButton pending={pending} pendingLabel="Ajout…">
          Ajouter le règlement
        </SubmitButton>
      </ActionForm>
    </div>
  );
}
