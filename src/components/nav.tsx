"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const NAV = [
  { href: "/dashboard", label: "Vue d’ensemble", icon: "⌂" },
  { href: "/dashboard/planning", label: "Planning", icon: "◷" },
  { href: "/dashboard/clients", label: "Clients", icon: "♙" },
  { href: "/dashboard/projets", label: "Projets & séances", icon: "✳" },
  { href: "/dashboard/devis", label: "Devis & paiements", icon: "€" },
  { href: "/dashboard/apres-soin", label: "Suivi après-soin", icon: "♡" },
  { href: "/dashboard/reglages", label: "Réglages", icon: "⚙" },
] as const;

export function Nav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Navigation principale" className="flex gap-1 overflow-x-auto lg:grid">
      {NAV.map((item) => {
        const active =
          item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-3 text-[13px] whitespace-nowrap transition ${
              active ? "bg-violet-pale text-violet-dark font-bold" : "hover:bg-wash text-[#77717e]"
            }`}
          >
            <span
              aria-hidden
              className={`w-5 text-center text-lg ${active ? "text-violet" : "text-[#a28aa8]"}`}
            >
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
