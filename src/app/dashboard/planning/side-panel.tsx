"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { deleteAppointment, saveAppointment } from "@/lib/planning/actions";
import {
  APPOINTMENT_KINDS,
  KIND_LABELS,
  type Appointment,
  type ClientOption,
  type Member,
} from "@/lib/planning/types";
import { dayLabel } from "@/lib/planning/time";
import type { FormState } from "@/lib/validation";
import {
  ActionForm,
  Field,
  FormMessage,
  SelectField,
  SubmitButton,
  TextArea,
} from "@/components/ui";
import { colorFor } from "./colors";

export type Selection =
  | { mode: "view"; id: string }
  | { mode: "edit"; id: string }
  | { mode: "new"; date: string; start: string; end: string }
  | null;

type Props = {
  selection: Selection;
  appointments: Appointment[];
  members: Member[];
  memberMap: Map<string, Member>;
  clients: ClientOption[];
  onClose: () => void;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
};

export function SidePanel(props: Props) {
  const { selection, appointments, onClose } = props;
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);

  if (!selection) return null;
  const appt = selection.mode === "new" ? null : appointments.find((a) => a.id === selection.id);

  const title =
    selection.mode === "new"
      ? "Nouveau rendez-vous"
      : selection.mode === "edit"
        ? "Modifier le rendez-vous"
        : (appt?.title ?? "Rendez-vous");

  return (
    <div className="flex min-h-full flex-col">
      <div className="border-line bg-paper sticky top-0 z-10 flex items-center justify-between gap-3 border-b px-5 py-4">
        <h2
          ref={heading}
          tabIndex={-1}
          className="font-display min-w-0 truncate text-lg font-extrabold outline-none"
        >
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer le panneau"
          className="text-muted hover:bg-wash hover:text-ink grid size-9 shrink-0 place-items-center rounded-full text-xl"
        >
          ×
        </button>
      </div>
      <div className="flex-1 px-5 py-5">
        {selection.mode !== "new" && !appt ? (
          <p className="text-muted">
            Ce rendez-vous n&apos;est pas dans la période affichée, ou il a été supprimé.
          </p>
        ) : selection.mode === "view" && appt ? (
          <Details {...props} appt={appt} />
        ) : (
          <AppointmentForm {...props} appt={appt ?? null} selection={selection} />
        )}
      </div>
    </div>
  );
}

function Details({ appt, memberMap, onEdit, onClose }: Props & { appt: Appointment }) {
  const c = colorFor(appt, memberMap);
  const artist = appt.artistId ? memberMap.get(appt.artistId) : undefined;
  const [confirming, setConfirming] = useState(false);
  const [state, action, pending] = useActionState(async (prev: FormState, fd: FormData) => {
    const res = await deleteAppointment(prev, fd);
    if (res.ok) onClose();
    return res;
  }, {});

  const rows = [
    {
      label: "Quand",
      value: `${dayLabel(appt.dateKey, "EEEE d MMMM yyyy")} · ${appt.startTime} – ${appt.endTime}`,
    },
    { label: "Artiste", value: artist?.email ?? "Non attribué" },
    { label: "Client", value: appt.clientName ?? "Aucun" },
  ];

  return (
    <div className="grid gap-5">
      <div className="flex items-center gap-3">
        <span className="h-10 w-1.5 rounded-full" style={{ backgroundColor: c.border }} />
        <div>
          <span
            className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ backgroundColor: c.bg, color: c.text }}
          >
            {KIND_LABELS[appt.kind]}
          </span>
          <p className="font-display mt-1 text-xl font-extrabold">{appt.title}</p>
        </div>
      </div>

      <dl className="grid gap-3">
        {rows.map((r) => (
          <div key={r.label}>
            <dt className="eyebrow">{r.label}</dt>
            <dd className="mt-0.5 first-letter:uppercase">{r.value}</dd>
          </div>
        ))}
        {appt.clientId && (
          <Link href="/clients" className="text-violet text-sm font-semibold hover:underline">
            Voir les fiches clients →
          </Link>
        )}
        <div>
          <dt className="eyebrow">Notes</dt>
          <dd className="text-ink mt-0.5 whitespace-pre-wrap">
            {appt.notes ?? <span className="text-muted">Aucune note</span>}
          </dd>
        </div>
      </dl>

      <FormMessage message={state.message} ok={state.ok} />

      <div className="border-line flex flex-wrap gap-2 border-t pt-5">
        <button
          type="button"
          onClick={() => onEdit(appt.id)}
          className="bg-violet shadow-soft hover:bg-violet-dark rounded-xl px-4 py-2.5 font-semibold text-white"
        >
          Modifier
        </button>
        {confirming ? (
          <ActionForm action={action} className="flex gap-2">
            <input type="hidden" name="id" value={appt.id} />
            <SubmitButton
              pending={pending}
              pendingLabel="Suppression…"
              className="!bg-danger hover:!bg-[#8f2a3e]"
            >
              Confirmer la suppression
            </SubmitButton>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="border-line hover:bg-wash rounded-xl border px-4 py-2.5 font-semibold"
            >
              Annuler
            </button>
          </ActionForm>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="border-line text-danger rounded-xl border px-4 py-2.5 font-semibold hover:bg-[#fbeef1]"
          >
            Supprimer
          </button>
        )}
      </div>
    </div>
  );
}

function AppointmentForm({
  appt,
  selection,
  members,
  clients,
  onView,
  onClose,
}: Props & { appt: Appointment | null; selection: NonNullable<Selection> }) {
  const [state, action, pending] = useActionState(async (prev: FormState, fd: FormData) => {
    const res = await saveAppointment(prev, fd);
    if (res.ok && res.id) onView(res.id);
    return res;
  }, {});

  const d =
    selection.mode === "new"
      ? {
          title: "",
          kind: "session",
          date: selection.date,
          start: selection.start,
          end: selection.end,
          clientId: "",
          artistId: "",
          notes: "",
        }
      : {
          title: appt?.title ?? "",
          kind: appt?.kind ?? "session",
          date: appt?.dateKey ?? "",
          start: appt?.startTime ?? "10:00",
          end: appt?.endTime ?? "11:00",
          clientId: appt?.clientId ?? "",
          artistId: appt?.artistId ?? "",
          notes: appt?.notes ?? "",
        };

  return (
    <ActionForm action={action} className="grid gap-4">
      <input type="hidden" name="id" value={appt?.id ?? ""} />
      <Field
        label="Titre"
        name="title"
        required
        maxLength={120}
        defaultValue={d.title}
        placeholder="Ex. Séance bras – Alex"
        error={state.errors?.title}
      />
      <SelectField label="Type" name="kind" defaultValue={d.kind} error={state.errors?.kind}>
        {APPOINTMENT_KINDS.map((k) => (
          <option key={k} value={k}>
            {KIND_LABELS[k]}
          </option>
        ))}
      </SelectField>
      <Field
        label="Date"
        name="date"
        type="date"
        required
        defaultValue={d.date}
        error={state.errors?.date}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Début"
          name="start"
          type="time"
          step={300}
          required
          defaultValue={d.start}
          error={state.errors?.start}
        />
        <Field
          label="Fin"
          name="end"
          type="time"
          step={300}
          required
          defaultValue={d.end}
          error={state.errors?.end}
        />
      </div>
      <SelectField
        label="Artiste"
        name="artistId"
        defaultValue={d.artistId}
        error={state.errors?.artistId}
      >
        <option value="">— Non attribué —</option>
        {members.map((m) => (
          <option key={m.userId} value={m.userId}>
            {m.email}
          </option>
        ))}
      </SelectField>
      <SelectField
        label="Client"
        name="clientId"
        defaultValue={d.clientId}
        error={state.errors?.clientId}
      >
        <option value="">— Aucun —</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </SelectField>
      <TextArea
        label="Notes (facultatif)"
        name="notes"
        rows={4}
        maxLength={2000}
        defaultValue={d.notes}
        error={state.errors?.notes}
      />
      <p className="bg-pink text-rose rounded-xl px-3.5 py-3 text-xs">
        Pas de données de santé ni d&apos;informations sensibles dans les notes à ce stade.
      </p>
      {!state.ok && <FormMessage message={state.message} />}
      <div className="flex gap-2">
        <SubmitButton pending={pending} pendingLabel="Enregistrement…">
          Enregistrer
        </SubmitButton>
        <button
          type="button"
          onClick={() => (appt ? onView(appt.id) : onClose())}
          className="border-line hover:bg-wash rounded-xl border px-4 py-3 font-semibold"
        >
          Annuler
        </button>
      </div>
    </ActionForm>
  );
}
