"use client";

import { useActionState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { deleteProject } from "@/lib/projects/actions";
import { FormMessage } from "@/components/ui";

export function DeleteProject({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(deleteProject, {});

  useEffect(() => {
    if (state.ok) router.push("/dashboard/projets");
  }, [state, router]);

  const confirmDelete = (e: FormEvent<HTMLFormElement>) => {
    if (!window.confirm(`Supprimer le projet « ${title} » ?`)) e.preventDefault();
  };

  return (
    <form action={action} onSubmit={confirmDelete} className="grid gap-3">
      <input type="hidden" name="id" value={id} />
      {!state.ok && <FormMessage message={state.message} />}
      <button
        type="submit"
        disabled={pending}
        className="border-line text-danger hover:bg-danger/10 justify-self-start rounded-xl border px-4 py-2.5 font-semibold disabled:opacity-60"
      >
        {pending ? "Suppression…" : "Supprimer"}
      </button>
    </form>
  );
}
