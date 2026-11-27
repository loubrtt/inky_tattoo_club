"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { saveProject } from "@/lib/projects/actions";
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS, type Project } from "@/lib/projects/types";
import {
  ActionForm,
  Field,
  FormMessage,
  SelectField,
  SubmitButton,
  TextArea,
} from "@/components/ui";

export type Option = { id: string; label: string };

// Formulaire projet, utilisé à la création (fenêtre) et sur la fiche projet.
export function ProjectForm({
  project,
  clients,
  artists,
  onCancel,
}: {
  project?: Project;
  clients: Option[];
  artists: Option[];
  onCancel?: () => void;
}) {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(saveProject, {});

  useEffect(() => {
    // Création réussie : on ouvre la fiche du nouveau projet.
    if (state.ok && state.id && !project) router.push(`/dashboard/projets/${state.id}`);
  }, [state, project, router]);

  return (
    <ActionForm ref={form} action={action} className="grid gap-4">
      <input type="hidden" name="id" value={project?.id ?? ""} />
      <Field
        label="Titre"
        name="title"
        required
        maxLength={120}
        defaultValue={project?.title}
        placeholder="Ex. Pivoines avant-bras"
        error={state.errors?.title}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Client"
          name="clientId"
          required
          defaultValue={project?.clientId ?? ""}
          error={state.errors?.clientId}
        >
          <option value="" disabled>
            Choisir un client
          </option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Artiste"
          name="artistId"
          defaultValue={project?.artistId ?? ""}
          error={state.errors?.artistId}
        >
          <option value="">Non attribué</option>
          {artists.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Statut"
          name="status"
          defaultValue={project?.status ?? "to_draw"}
          error={state.errors?.status}
        >
          {PROJECT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {PROJECT_STATUS_LABELS[s]}
            </option>
          ))}
        </SelectField>
        <Field
          label="Zone du corps"
          name="bodyZone"
          maxLength={120}
          defaultValue={project?.bodyZone ?? ""}
          placeholder="Ex. Avant-bras gauche"
          error={state.errors?.bodyZone}
        />
        <Field
          label="Dimensions"
          name="dimensions"
          maxLength={80}
          defaultValue={project?.dimensions ?? ""}
          placeholder="Ex. 15 × 8 cm"
          error={state.errors?.dimensions}
        />
        <Field
          label="Style"
          name="style"
          maxLength={80}
          defaultValue={project?.style ?? ""}
          placeholder="Ex. Fineline"
          error={state.errors?.style}
        />
      </div>
      <TextArea
        label="Références"
        name="refs"
        rows={3}
        maxLength={2000}
        defaultValue={project?.refs ?? ""}
        placeholder="Liens ou description des références"
        error={state.errors?.refs}
      />
      <TextArea
        label="Notes artistiques"
        name="artisticNotes"
        rows={4}
        maxLength={4000}
        defaultValue={project?.artisticNotes ?? ""}
        error={state.errors?.artisticNotes}
      />
      <FormMessage message={state.message} ok={state.ok} />
      <div className="flex flex-wrap gap-2">
        <SubmitButton pending={pending} pendingLabel="Enregistrement…">
          {project ? "Enregistrer" : "Créer le projet"}
        </SubmitButton>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="border-line hover:bg-wash rounded-xl border px-4 py-3 font-semibold"
          >
            Annuler
          </button>
        )}
      </div>
    </ActionForm>
  );
}
