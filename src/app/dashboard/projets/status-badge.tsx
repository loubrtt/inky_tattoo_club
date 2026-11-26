import { PROJECT_STATUS_LABELS, type ProjectStatus } from "@/lib/projects/types";

const TONE: Record<ProjectStatus, string> = {
  to_draw: "bg-wash text-muted border-line",
  in_progress: "bg-violet-pale text-violet-ink border-transparent",
  done: "bg-mint/10 text-mint border-transparent",
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TONE[status]}`}
    >
      {PROJECT_STATUS_LABELS[status]}
    </span>
  );
}
