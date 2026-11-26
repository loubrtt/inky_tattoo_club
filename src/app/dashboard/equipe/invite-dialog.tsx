"use client";

import { Plus, X } from "lucide-react";

import { useActionState, useEffect, useRef } from "react";
import { inviteMember } from "@/lib/team/actions";
import { ROLE_LABELS } from "@/lib/roles";
import type { StudioRole } from "@/lib/supabase/types";
import {
  ActionForm,
  Field,
  FormMessage,
  primaryButton,
  SelectField,
  SubmitButton,
} from "@/components/ui";

export function InviteMemberDialog({ roles }: { roles: StudioRole[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(inviteMember, {});

  useEffect(() => {
    if (state.ok) form.current?.reset();
  }, [state]);

  return (
    <>
      <button type="button" onClick={() => dialog.current?.showModal()} className={primaryButton}>
        <Plus aria-hidden size={17} />
        Inviter un membre
      </button>
      <dialog
        ref={dialog}
        aria-labelledby="invite-title"
        className="border-line bg-paper text-ink shadow-soft m-auto w-[calc(100%-2rem)] max-w-lg rounded-3xl border p-0 backdrop:bg-black/40"
      >
        <ActionForm ref={form} action={action} className="grid gap-4 p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="eyebrow">Nouvel accès</div>
              <h2 id="invite-title" className="font-display mt-1 text-xl font-extrabold">
                Inviter un membre
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
          <p className="text-muted text-sm">
            Si la personne a déjà un compte, elle a accès tout de suite. Sinon, elle reçoit un
            e-mail pour créer son mot de passe.
          </p>
          <Field
            label="E-mail"
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="off"
            placeholder="tatoueur@example.test"
            error={state.errors?.email}
          />
          <SelectField
            label="Rôle"
            name="role"
            defaultValue={roles.includes("artist") ? "artist" : roles[0]}
            error={state.errors?.role}
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </SelectField>
          <FormMessage message={state.message} ok={state.ok} />
          <SubmitButton pending={pending} pendingLabel="Envoi…">
            Inviter
          </SubmitButton>
        </ActionForm>
      </dialog>
    </>
  );
}
