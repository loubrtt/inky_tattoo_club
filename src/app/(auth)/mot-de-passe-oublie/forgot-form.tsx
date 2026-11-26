"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset } from "@/lib/auth/actions";
import { Field, FormMessage, SubmitButton } from "@/components/ui";

export function ForgotForm() {
  const [state, action] = useActionState(requestPasswordReset, {});

  return (
    <form action={action} className="grid gap-4" noValidate>
      <Field
        label="Adresse e-mail"
        name="email"
        type="email"
        autoComplete="username"
        required
        error={state.errors?.email}
      />
      <FormMessage message={state.message} ok={state.ok} />
      {!state.ok && <SubmitButton pendingLabel="Envoi…">Envoyer le lien</SubmitButton>}
      <Link
        href="/connexion"
        className="text-violet text-center text-sm font-medium hover:underline"
      >
        Retour à la connexion
      </Link>
    </form>
  );
}
