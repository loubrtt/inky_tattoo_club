"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn } from "@/lib/auth/actions";
import type { FormState } from "@/lib/validation";
import { ActionForm, Field, FormMessage, SubmitButton } from "@/components/ui";
import { GoogleButton } from "./google-button";

export function LoginForm({ next, initialError }: { next: string; initialError?: string }) {
  const [state, action, pending] = useActionState(
    async (prev: FormState, fd: FormData): Promise<FormState> => ({
      ...(await signIn(prev, fd)),
      attempt: (prev.attempt ?? 0) + 1,
    }),
    { message: initialError },
  );

  // Identifiants refusés : le champ mot de passe secoue (« nope »), les champs restent remplis.
  const refused = Boolean(state.attempt && state.message && !state.errors);
  const nope = refused
    ? { animation: `${state.attempt! % 2 ? "nope-a" : "nope-b"} 0.45s ease-in-out` }
    : undefined;

  return (
    <div className="grid gap-4">
      <GoogleButton next={next} />
      <div className="text-muted flex items-center gap-3 text-xs" aria-hidden>
        <span className="bg-line h-px flex-1" />
        ou avec ton e-mail
        <span className="bg-line h-px flex-1" />
      </div>
      <ActionForm action={action} className="grid gap-4">
        <input type="hidden" name="next" value={next} />
        <Field
          label="Adresse e-mail"
          name="email"
          type="email"
          autoComplete="username"
          required
          placeholder="toi@studio.fr"
          error={state.errors?.email}
        />
        <Field
          label="Mot de passe"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          error={state.errors?.password}
          aria-invalid={refused || undefined}
          style={nope}
        />
        <FormMessage message={state.message} ok={state.ok} />
        <SubmitButton pending={pending} pendingLabel="Connexion…">
          Se connecter
        </SubmitButton>
        <Link
          href="/mot-de-passe-oublie"
          className="text-violet text-center text-sm font-medium hover:underline"
        >
          Mot de passe oublié ?
        </Link>
      </ActionForm>
    </div>
  );
}
