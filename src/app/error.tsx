"use client";

// Filet de sécurité : attrape aussi les erreurs des layouts (ex. accès studio illisible).
export default function RootError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid flex-1 place-items-center p-8 text-center">
      <div>
        <h1 className="font-display text-xl font-extrabold">
          Quelque chose n&apos;a pas fonctionné
        </h1>
        <p className="text-muted mt-2">Réessaie dans un instant. Si ça continue, reconnecte-toi.</p>
        <div className="mt-5 flex justify-center gap-3">
          <button
            onClick={reset}
            className="bg-violet rounded-xl px-4 py-3 font-semibold text-white"
          >
            Réessayer
          </button>
          <a href="/connexion" className="border-line rounded-xl border px-4 py-3 font-semibold">
            Connexion
          </a>
        </div>
      </div>
    </main>
  );
}
