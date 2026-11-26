"use client";

import { primaryButton } from "@/components/ui";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="border-line bg-paper shadow-soft rounded-2xl border p-8 text-center">
      <h1 className="font-display text-xl font-extrabold">Quelque chose n&apos;a pas fonctionné</h1>
      <p className="text-muted mt-2">
        Les données n&apos;ont pas pu être chargées. Réessaie dans un instant.
      </p>
      <button onClick={reset} className={`${primaryButton} mt-5`}>
        Réessayer
      </button>
    </div>
  );
}
