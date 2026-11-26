"use client";

import { useFormStatus } from "react-dom";
import { startTransition, type ComponentProps, type FormEvent, type ReactNode } from "react";

// Formulaire qui envoie l'action SANS que React vide les champs après coup
// (avec <form action>, React 19 réinitialise le formulaire, même en cas d'erreur).
export function ActionForm({
  action,
  children,
  ...props
}: Omit<ComponentProps<"form">, "action" | "onSubmit"> & { action: (formData: FormData) => void }) {
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => action(formData));
  };
  return (
    <form {...props} onSubmit={onSubmit} noValidate>
      {children}
    </form>
  );
}

export function SubmitButton({
  children,
  pendingLabel,
  pending: pendingProp,
  className = "",
}: {
  children: ReactNode;
  pendingLabel: string;
  pending?: boolean;
  className?: string;
}) {
  const status = useFormStatus();
  const pending = pendingProp ?? status.pending;
  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className={`bg-violet shadow-soft hover:bg-violet-dark rounded-xl px-4 py-3 font-semibold text-white transition disabled:cursor-wait disabled:opacity-70 ${className}`}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

type FieldBase = { label: string; name: string; error?: string; className?: string };

const fieldClass = (error?: string) =>
  `mt-1.5 w-full rounded-xl border bg-white px-3.5 py-3 text-sm outline-none transition focus:border-violet focus:ring-3 focus:ring-violet-pale ${error ? "border-danger" : "border-line"}`;

function FieldShell({
  label,
  name,
  error,
  className = "",
  children,
}: FieldBase & { children: (a11y: Record<string, unknown>) => ReactNode }) {
  const id = `field-${name}`;
  const errorId = `${id}-error`;
  return (
    <label htmlFor={id} className={`text-ink block font-medium ${className}`}>
      {label}
      {children({
        id,
        name,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": error ? errorId : undefined,
      })}
      {error && (
        <span id={errorId} className="text-danger mt-1 block text-xs font-normal">
          {error}
        </span>
      )}
    </label>
  );
}

export function Field({
  label,
  name,
  error,
  className,
  ...input
}: FieldBase & ComponentProps<"input">) {
  return (
    <FieldShell label={label} name={name} error={error} className={className}>
      {(a11y) => <input {...input} {...a11y} className={fieldClass(error)} />}
    </FieldShell>
  );
}

export function TextArea({
  label,
  name,
  error,
  className,
  ...textarea
}: FieldBase & ComponentProps<"textarea">) {
  return (
    <FieldShell label={label} name={name} error={error} className={className}>
      {(a11y) => <textarea {...textarea} {...a11y} className={fieldClass(error)} />}
    </FieldShell>
  );
}

export function SelectField({
  label,
  name,
  error,
  className,
  children,
  ...select
}: FieldBase & ComponentProps<"select">) {
  return (
    <FieldShell label={label} name={name} error={error} className={className}>
      {(a11y) => (
        <select {...select} {...a11y} className={fieldClass(error)}>
          {children}
        </select>
      )}
    </FieldShell>
  );
}

export function FormMessage({ message, ok }: { message?: string; ok?: boolean }) {
  if (!message) return null;
  return (
    <p
      role="status"
      aria-live="polite"
      className={`rounded-xl px-3.5 py-3 text-sm ${ok ? "text-mint bg-[#eaf5f0]" : "text-danger bg-[#fbeef1]"}`}
    >
      {message}
    </p>
  );
}
