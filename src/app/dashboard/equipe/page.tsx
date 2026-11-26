import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { requireStudio } from "@/lib/auth/dal";
import { formatDate } from "@/lib/dates";
import { assignableRoles, canEditMember, canManageTeam, ROLE_LABELS } from "@/lib/roles";
import { loadTeam } from "@/lib/team/data";
import { InviteMemberDialog } from "./invite-dialog";
import { MemberControls } from "./member-controls";

export const metadata: Metadata = { title: "Équipe" };

export default async function TeamPage() {
  const { user, current } = await requireStudio();
  const team = await loadTeam();
  const manage = canManageTeam(current.role);
  const roles = assignableRoles(current.role);

  return (
    <>
      <PageHeading
        title="Équipe"
        description={
          manage
            ? "Inviter les tatoueurs et l’équipe, choisir leur rôle, retirer un accès."
            : "Les personnes qui ont accès au studio."
        }
        action={manage && team.status === "ok" ? <InviteMemberDialog roles={roles} /> : undefined}
      />

      {team.status === "missing-migration" ? (
        <p className="border-line bg-paper text-muted rounded-2xl border p-5">
          La gestion de l’équipe n’est pas encore activée : la migration <code>studio_team</code>{" "}
          doit être appliquée dans Supabase.
        </p>
      ) : (
        <ul className="divide-line border-line bg-paper shadow-soft divide-y rounded-2xl border">
          {team.members.map((m) => {
            const isMe = m.userId === user.id;
            const editable = canEditMember(current.role, m.role);
            return (
              <li
                key={m.userId}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="bg-violet-pale text-violet grid size-9 shrink-0 place-items-center rounded-full font-bold">
                    {m.email.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <strong className="block truncate">
                      {m.email}
                      {isMe && <span className="text-muted font-normal"> (toi)</span>}
                    </strong>
                    <small className="text-muted">
                      {m.pending
                        ? "Invitation envoyée, pas encore acceptée"
                        : `Membre depuis le ${formatDate(m.joinedAt)}`}
                    </small>
                  </span>
                </span>
                {editable ? (
                  <MemberControls
                    userId={m.userId}
                    email={m.email}
                    role={m.role}
                    roles={roles.includes(m.role) ? roles : [m.role, ...roles]}
                    isMe={isMe}
                  />
                ) : (
                  <b className="text-violet-ink">{ROLE_LABELS[m.role]}</b>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {manage && (
        <p className="text-muted mt-3 text-xs">
          Un administrateur ne peut ni nommer ni modifier un propriétaire. Le studio garde toujours
          au moins un propriétaire. Retirer un membre lui enlève l’accès à ce studio, sans supprimer
          son compte.
        </p>
      )}
    </>
  );
}
