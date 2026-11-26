import type { ReactNode } from "react";

export function PageHeading({
  eyebrow,
  title,
  accent,
  subtitle,
  action,
}: {
  eyebrow: string;
  title: string;
  accent: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="font-display mt-2 text-3xl font-extrabold sm:text-4xl">
          {title} <em className="text-violet not-italic">{accent}</em>
        </h1>
        <p className="text-muted mt-2">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

export function ComingSoon({ items }: { items: { title: string; text: string }[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {items.map((item) => (
        <article
          key={item.title}
          className="border-line bg-paper shadow-soft rounded-2xl border p-5"
        >
          <h2 className="font-display font-bold">{item.title}</h2>
          <p className="text-muted mt-2">{item.text}</p>
          <span className="bg-wash text-muted mt-4 inline-block rounded-full px-2.5 py-1 text-[11px]">
            À construire
          </span>
        </article>
      ))}
    </div>
  );
}
