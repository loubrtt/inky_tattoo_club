"use client";

import { useActionState } from "react";
import { saveProfile } from "@/lib/profile/actions";
import type { Profile } from "@/lib/profile/display";
import { ActionForm, Field, FormMessage, SubmitButton } from "@/components/ui";

export function ProfileForm({
  profile,
  disabled,
}: {
  profile: Profile | null;
  disabled?: boolean;
}) {
  const [state, action, pending] = useActionState(saveProfile, {});

  return (
    <ActionForm action={action}>
      <fieldset disabled={disabled} className="grid gap-4 disabled:opacity-60">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Prénom"
            name="firstName"
            required
            maxLength={80}
            autoComplete="given-name"
            defaultValue={profile?.firstName ?? ""}
            error={state.errors?.firstName}
          />
          <Field
            label="Nom (facultatif)"
            name="lastName"
            maxLength={80}
            autoComplete="family-name"
            defaultValue={profile?.lastName ?? ""}
            error={state.errors?.lastName}
          />
          <Field
            label="Téléphone (facultatif)"
            name="phone"
            type="tel"
            maxLength={20}
            autoComplete="tel"
            placeholder="06 12 34 56 78"
            defaultValue={profile?.phone ?? ""}
            error={state.errors?.phone}
          />
        </div>
        <FormMessage message={state.message} ok={state.ok} />
        <div>
          <SubmitButton pending={pending} pendingLabel="Enregistrement…">
            Enregistrer
          </SubmitButton>
        </div>
      </fieldset>
    </ActionForm>
  );
}
