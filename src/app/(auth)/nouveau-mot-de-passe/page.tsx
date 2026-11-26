import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/dal";
import { NewPasswordForm } from "./new-password-form";

export const metadata: Metadata = { title: "Nouveau mot de passe" };

export default async function NewPasswordPage() {
  const user = await requireUser();
  return (
    <>
      <h1 className="font-display text-2xl font-extrabold">Nouveau mot de passe</h1>
      <p className="text-muted mt-2 mb-6">
        Pour le compte <strong className="text-ink">{user.email}</strong>.
      </p>
      <NewPasswordForm />
    </>
  );
}
