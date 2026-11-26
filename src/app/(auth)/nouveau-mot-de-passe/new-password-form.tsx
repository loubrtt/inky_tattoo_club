"use client";

import { useActionState } from "react";
import { updatePassword } from "@/lib/auth/actions";
import { ActionForm, Field, FormMessage, SubmitButton } from "@/components/ui";

export function NewPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, {});

  return (
    <ActionForm action={action} className="grid gap-4">
      <Field
        label="Nouveau mot de passe (8 caractères minimum)"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        maxLength={72}
        error={state.errors?.password}
      />
      <Field
        label="Confirme le mot de passe"
        name="confirm"
        type="password"
        autoComplete="new-password"
        required
        error={state.errors?.confirm}
      />
      <FormMessage message={state.message} ok={state.ok} />
      <SubmitButton pending={pending} pendingLabel="Enregistrement…">
        Enregistrer
      </SubmitButton>
    </ActionForm>
  );
}
