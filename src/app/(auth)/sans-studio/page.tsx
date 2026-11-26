import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMemberships, requireUser } from "@/lib/auth/dal";
import { signOut } from "@/lib/auth/actions";

export const metadata: Metadata = { title: "Aucun accès studio" };

export default async function NoStudioPage() {
  const user = await requireUser();
  if ((await getMemberships(user.id)).length) redirect("/dashboard");

  return (
    <>
      <h1 className="font-display text-2xl font-extrabold">Aucun accès studio</h1>
      <p className="text-muted mt-2 mb-6">
        Le compte <strong className="text-ink">{user.email}</strong> n&apos;est rattaché à aucun
        studio. Demande à un propriétaire du studio de vérifier ton invitation et ton rôle.
      </p>
      <form action={signOut}>
        <button className="border-line hover:bg-wash w-full rounded-xl border px-4 py-3 font-semibold">
          Se déconnecter
        </button>
      </form>
    </>
  );
}
