import type { Metadata } from "next";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function ForgotPage() {
  return (
    <>
      <h1 className="font-display text-2xl font-extrabold">Mot de passe oublié</h1>
      <p className="text-muted mt-2 mb-6">
        Saisis ton adresse e-mail : tu recevras un lien pour choisir un nouveau mot de passe.
      </p>
      <ForgotForm />
    </>
  );
}
