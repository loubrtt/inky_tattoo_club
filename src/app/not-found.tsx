import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid flex-1 place-items-center p-8 text-center">
      <div>
        <h1 className="font-display text-2xl font-extrabold">Page introuvable</h1>
        <Link href="/" className="text-violet mt-4 inline-block font-semibold hover:underline">
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
