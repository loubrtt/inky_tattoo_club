import { switchStudio } from "@/lib/auth/actions";
import type { StudioMembership } from "@/lib/supabase/types";

export function StudioSwitcher({
  studios,
  currentId,
}: {
  studios: StudioMembership[];
  currentId: string;
}) {
  if (studios.length < 2) return null;
  return (
    <form action={switchStudio} className="flex gap-2">
      <label className="sr-only" htmlFor="studio-switch">
        Studio actif
      </label>
      <select
        id="studio-switch"
        name="studioId"
        defaultValue={currentId}
        className="border-line min-w-0 flex-1 rounded-lg border bg-white px-2 py-1.5 text-xs"
      >
        {studios.map((s) => (
          <option key={s.studioId} value={s.studioId}>
            {s.studioName}
          </option>
        ))}
      </select>
      <button className="border-line hover:bg-wash rounded-lg border px-2 py-1.5 text-xs font-semibold">
        Changer
      </button>
    </form>
  );
}
