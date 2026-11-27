"use client";

import { Plus, X } from "lucide-react";

import { useActionState, useEffect, useRef } from "react";
import { createClientRecord } from "@/lib/clients/actions";
import {
  ActionForm,
  Field,
  FormMessage,
  primaryButton,
  SubmitButton,
  TextArea,
} from "@/components/ui";

export function NewClientDialog({ label = "Nouveau client" }: { label?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(createClientRecord, {});

  useEffect(() => {
    if (state.ok) {
      form.current?.reset();
      dialog.current?.close();
    }
  }, [state]);

  return (
    <>
      <button type="button" onClick={() => dialog.current?.showModal()} className={primaryButton}>
        <Plus aria-hidden size={17} />
        {label}
      </button>
      <dialog
        ref={dialog}
        aria-labelledby="new-client-title"
        className="border-line bg-paper text-ink shadow-soft m-auto w-[calc(100%-2rem)] max-w-lg rounded-3xl border p-0 backdrop:bg-black/40"
      >
        <ActionForm ref={form} action={action} className="grid gap-4 p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="eyebrow">Nouveau dossier</div>
              <h2 id="new-client-title" className="font-display mt-1 text-xl font-extrabold">
                Créer un client
              </h2>
            </div>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              aria-label="Fermer"
              className="text-muted hover:bg-wash hover:text-ink grid size-9 place-items-center rounded-lg"
            >
              <X aria-hidden size={18} />
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Prénom"
              name="firstName"
              required
              maxLength={80}
              placeholder="Ex. Alex"
              error={state.errors?.firstName}
            />
            <Field
              label="Nom"
              name="lastName"
              required
              maxLength={80}
              placeholder="Ex. Martin"
              error={state.errors?.lastName}
            />
            <Field
              className="sm:col-span-2"
              label="E-mail (facultatif)"
              name="email"
              type="email"
              maxLength={254}
              placeholder="alex@example.test"
              error={state.errors?.email}
            />
            <TextArea
              className="sm:col-span-2"
              label="Résumé du projet (facultatif)"
              name="project"
              rows={3}
              maxLength={1000}
              placeholder="Résumé du projet…"
              error={state.errors?.project}
            />
          </div>
          {!state.ok && <FormMessage message={state.message} />}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className="border-line hover:bg-wash rounded-xl border px-4 py-3 font-semibold"
            >
              Annuler
            </button>
            <SubmitButton pending={pending} pendingLabel="Enregistrement…">
              Enregistrer la fiche
            </SubmitButton>
          </div>
        </ActionForm>
      </dialog>
    </>
  );
}
