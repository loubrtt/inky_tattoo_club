import type { ReactNode } from "react";

export function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-muted mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function ComingSoon({ items }: { items: { title: string; text: string }[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {items.map((item) => (
        <article key={item.title} className="border-line bg-paper rounded-2xl border p-5">
          <h2 className="font-display font-semibold">{item.title}</h2>
          <p className="text-muted mt-2">{item.text}</p>
        </article>
      ))}
    </div>
  );
}

export function NotBuiltYet() {
  return (
    <p className="text-muted mb-4 text-sm">
      Ce module n’est pas encore construit. Voici ce qu’il contiendra.
    </p>
  );
}
