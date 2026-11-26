import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

const PUBLIC_PATHS = ["/connexion", "/mot-de-passe-oublie", "/auth/confirm"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function proxy(request: NextRequest) {
  const { response, userId } = await updateSession(request);
  const { pathname, search } = request.nextUrl;

  // Redirection « optimiste » : chaque page et chaque action revérifient l'utilisateur.
  if (!userId && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.search = "";
    if (pathname !== "/") url.searchParams.set("next", `${pathname}${search}`);
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
