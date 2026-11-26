import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { redirect } from "next/navigation";
import { safeNextPath } from "@/lib/safe-redirect";
import { getCurrentUser } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Connexion" };

const ERRORS: Record<string, string> = {
  lien: "Ce lien n'est plus valide, a déjà servi ou a été ouvert dans un autre navigateur. Refais une demande.",
};

export default async function LoginPage({ searchParams }: PageProps<"/connexion">) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  if (await getCurrentUser()) redirect(next);
  const erreur = typeof params.erreur === "string" ? ERRORS[params.erreur] : undefined;

  return (
    <>
      <div className="eyebrow">Espace privé du studio</div>
      <h1 className="font-display mt-2 text-3xl font-extrabold">
        Bienvenue <em className="text-violet not-italic">chez INKY.</em>
      </h1>
      <p className="text-muted mt-2 mb-6">Connecte-toi avec ton compte équipe.</p>
      <LoginForm next={next} initialError={erreur} />
    </>
  );
}
