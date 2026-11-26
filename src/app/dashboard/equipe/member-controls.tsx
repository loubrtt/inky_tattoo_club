"use client";

import { useActionState, type FormEvent } from "react";
import { changeMemberRole, removeMember } from "@/lib/team/actions";
import { ROLE_LABELS } from "@/lib/roles";
import type { StudioRole } from "@/lib/supabase/types";

export function MemberControls({
  userId,
  email,
  role,
  roles,
  isMe,
}: {
  userId: string;
  email: string;
  role: StudioRole;
  roles: StudioRole[];
  isMe: boolean;
}) {
  const [roleState, roleAction, rolePending] = useActionState(changeMemberRole, {});
  const [removeState, removeAction, removePending] = useActionState(removeMember, {});
  const error = [roleState, removeState].find((s) => s.message && !s.ok)?.message;

  const confirmRemove = (e: FormEvent<HTMLFormElement>) => {
    const text = isMe
      ? "Retirer ton propre accès à ce studio ? Tu ne pourras plus l’ouvrir."
      : `Retirer l’accès de ${email} à ce studio ?`;
    if (!window.confirm(text)) e.preventDefault();
  };

  return (
    <span className="flex flex-wrap items-center justify-end gap-2">
      <form action={roleAction} className="flex items-center gap-2">
        <input type="hidden" name="userId" value={userId} />
        <label className="sr-only" htmlFor={`role-${userId}`}>
          Rôle de {email}
        </label>
        <select
          id={`role-${userId}`}
          name="role"
          defaultValue={role}
          key={`${role}-${roleState.attempt ?? 0}`}
          disabled={rolePending}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className="border-line bg-paper focus:border-violet rounded-xl border px-3 py-2 text-sm outline-none disabled:opacity-60"
        >
          {roles.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
      </form>
      <form action={removeAction} onSubmit={confirmRemove}>
        <input type="hidden" name="userId" value={userId} />
        <button
          type="submit"
          disabled={removePending}
          className="text-danger hover:bg-wash rounded-lg px-2 py-2 text-xs font-semibold disabled:opacity-60"
        >
          {removePending ? "Retrait…" : "Retirer"}
        </button>
      </form>
      {error && (
        <span role="status" className="text-danger w-full text-right text-xs">
          {error}
        </span>
      )}
    </span>
  );
}
