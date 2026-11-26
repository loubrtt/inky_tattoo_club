"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn } from "@/lib/auth/actions";
import { GoogleButton } from "./google-button";
import { Field, FormMessage, SubmitButton } from "@/components/ui";

export function LoginForm({ next, initialError }: { next: string; initialError?: string }) {
  const [state, action] = useActionState(signIn, { message: initialError });

  return (
    <div className="grid gap-4">
      <GoogleButton next={next} />
      <div className="text-muted flex items-center gap-3 text-xs" aria-hidden>
        <span className="bg-line h-px flex-1" />
        ou avec ton e-mail
        <span className="bg-line h-px flex-1" />
      </div>
      <form action={action} className="grid gap-4" noValidate>
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
        />
        <FormMessage message={state.message} ok={state.ok} />
        <SubmitButton pendingLabel="Connexion…">Se connecter</SubmitButton>
        <Link
          href="/mot-de-passe-oublie"
          className="text-violet text-center text-sm font-medium hover:underline"
        >
          Mot de passe oublié ?
        </Link>
      </form>
    </div>
  );
}
