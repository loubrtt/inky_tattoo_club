"use server";

import { cookies } from "next/headers";
import { THEME_COOKIE } from "@/lib/theme";
import { themeSchema } from "@/lib/validation";

// Enregistre le thème choisi (préférence d'affichage, aucune donnée sensible).
export async function saveTheme(value: string) {
  const parsed = themeSchema.safeParse(value);
  if (!parsed.success) return;
  (await cookies()).set(THEME_COOKIE, parsed.data, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
