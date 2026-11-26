import Link from "next/link";
import { LogOut } from "lucide-react";
import { Brand } from "@/components/brand";
import { Nav } from "@/components/nav";
import { StudioSwitcher } from "@/components/studio-switcher";
import { requireStudio } from "@/lib/auth/dal";
import { signOut } from "@/lib/auth/actions";
import { canSeeMoney, ROLE_LABELS } from "@/lib/roles";
import { ThemeToggle } from "@/components/theme-toggle";
import { themeAttr } from "@/lib/theme";
import { readTheme } from "@/lib/theme-server";

export default async function AppLayout({ children }: LayoutProps<"/dashboard">) {
  const { user, studios, current } = await requireStudio();
  const initial = (user.email ?? "I").charAt(0).toUpperCase();
  const theme = await readTheme();

  return (
    <div
      data-theme={themeAttr(theme)}
      className="app-theme flex min-h-full flex-1 flex-col lg:flex-row"
    >
      <aside className="border-line bg-paper border-b px-4 py-4 lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-62 lg:flex-col lg:border-r lg:border-b-0 lg:px-4 lg:py-7">
        <Link
          href="/dashboard"
          className="mb-4 block px-2 lg:mb-8"
          aria-label="Vue d’ensemble INKY CLIENT"
        >
          <Brand />
        </Link>
        <div className="text-muted mb-2 hidden truncate px-3 text-xs font-semibold lg:block">
          {current.studioName}
        </div>
        <Nav canSeeMoney={canSeeMoney(current.role)} />
        <div className="border-line mt-4 grid gap-3 border-t pt-4 lg:mt-auto">
          <StudioSwitcher studios={studios} currentId={current.studioId} />
          <ThemeToggle initial={theme} />
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
              <button
                aria-label="Se déconnecter"
                title="Se déconnecter"
                className="text-muted hover:bg-wash hover:text-ink grid size-9 place-items-center rounded-lg"
              >
                <LogOut aria-hidden size={17} strokeWidth={1.75} />
              </button>
            </form>
          </div>
        </div>
      </aside>

      <main className="flex-1 px-4 py-6 sm:px-8 lg:ml-62 lg:py-10">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
