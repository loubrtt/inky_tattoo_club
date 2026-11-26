"use client";

import { useRef } from "react";
import { Plus, X } from "lucide-react";
import { primaryButton } from "@/components/ui";
import { ProjectForm, type Option } from "./project-form";

export function NewProjectDialog({ clients, artists }: { clients: Option[]; artists: Option[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" onClick={() => dialog.current?.showModal()} className={primaryButton}>
        <Plus aria-hidden size={17} />
        Nouveau projet
      </button>
      <dialog
        ref={dialog}
        aria-labelledby="new-project-title"
        className="border-line bg-paper text-ink shadow-soft m-auto w-[calc(100%-2rem)] max-w-2xl rounded-3xl border p-0 backdrop:bg-black/40"
      >
        <div className="grid gap-4 p-6">
          <div className="flex items-start justify-between">
            <h2 id="new-project-title" className="font-display text-xl font-bold">
              Nouveau projet
            </h2>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              aria-label="Fermer"
              className="text-muted hover:bg-wash hover:text-ink grid size-9 place-items-center rounded-lg"
            >
              <X aria-hidden size={18} />
            </button>
          </div>
          {clients.length === 0 ? (
            <p className="text-muted">
              Crée d’abord une fiche client : un projet est toujours rattaché à un client.
            </p>
          ) : (
            <ProjectForm
              clients={clients}
              artists={artists}
              onCancel={() => dialog.current?.close()}
            />
          )}
        </div>
      </dialog>
    </>
  );
}
