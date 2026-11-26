import Link from "next/link";
import { Brand } from "@/components/brand";
import { Nav } from "@/components/nav";
import { StudioSwitcher } from "@/components/studio-switcher";
import { requireStudio } from "@/lib/auth/dal";
import { signOut } from "@/lib/auth/actions";
import { canEditSite, ROLE_LABELS } from "@/lib/roles";

export default async function AppLayout({ children }: LayoutProps<"/dashboard">) {
  const { user, studios, current } = await requireStudio();
  const initial = (user.email ?? "I").charAt(0).toUpperCase();

  return (
    <div className="flex min-h-full flex-1 flex-col lg:flex-row">
      <aside className="border-line bg-paper border-b px-4 py-4 lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-62 lg:flex-col lg:border-r lg:border-b-0 lg:px-4 lg:py-7">
        <Link
          href="/dashboard"
          className="mb-4 block px-2 lg:mb-10"
          aria-label="Vue d’ensemble INKY CLIENT"
        >
          <Brand />
        </Link>
        <div className="eyebrow mb-3 hidden px-3 lg:block">{current.studioName}</div>
        <Nav canEditSite={canEditSite(current.role)} />
        <div className="border-line mt-4 grid gap-3 border-t pt-4 lg:mt-auto">
          <StudioSwitcher studios={studios} currentId={current.studioId} />
          <div className="flex items-center gap-3 px-1">
            <span className="bg-violet-pale text-violet grid size-9 shrink-0 place-items-center rounded-full font-bold">
              {initial}
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block truncate text-xs">{user.email}</strong>
              <small className="text-muted block truncate text-[11px]">
                {ROLE_LABELS[current.role]} · {current.studioName}
              </small>
            </span>
            <form action={signOut}>
              <button className="text-muted hover:bg-wash hover:text-ink rounded-lg px-2 py-1 text-xs font-semibold">
                Sortir
              </button>
            </form>
          </div>
        </div>
      </aside>

      <main className="flex-1 px-4 py-6 sm:px-8 lg:ml-62 lg:py-10">{children}</main>
    </div>
  );
}
