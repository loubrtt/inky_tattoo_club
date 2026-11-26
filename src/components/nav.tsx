"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Contact,
  HeartHandshake,
  LayoutDashboard,
  PenTool,
  Receipt,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export const NAV: readonly { href: string; label: string; icon: LucideIcon; money?: boolean }[] = [
  { href: "/dashboard", label: "Vue d’ensemble", icon: LayoutDashboard },
  { href: "/dashboard/planning", label: "Planning", icon: CalendarDays },
  { href: "/dashboard/clients", label: "Clients", icon: Contact },
  { href: "/dashboard/projets", label: "Projets et séances", icon: PenTool },
  { href: "/dashboard/devis", label: "Devis et paiements", icon: Receipt, money: true },
  { href: "/dashboard/apres-soin", label: "Suivi après-soin", icon: HeartHandshake },
  { href: "/dashboard/equipe", label: "Équipe", icon: Users },
  { href: "/dashboard/reglages", label: "Réglages", icon: Settings },
];

// canSeeMoney : masque « Devis » aux assistants (la base refuse de toute façon les montants).
export function Nav({ canSeeMoney }: { canSeeMoney: boolean }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Navigation principale" className="flex gap-1 overflow-x-auto lg:grid">
      {NAV.filter((item) => canSeeMoney || !item.money).map(({ href, label, icon: Icon }) => {
        const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm whitespace-nowrap transition-colors ${
              active
                ? "bg-violet-pale text-violet-ink font-semibold"
                : "text-muted hover:bg-wash hover:text-ink"
            }`}
          >
            <Icon
              aria-hidden
              size={18}
              strokeWidth={1.75}
              className={active ? "text-violet" : "text-current"}
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
