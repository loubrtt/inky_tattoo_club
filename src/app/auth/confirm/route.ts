import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/safe-redirect";
import { logError } from "@/lib/errors";

const OTP_TYPES: EmailOtpType[] = [
  "recovery",
  "invite",
  "magiclink",
  "signup",
  "email",
  "email_change",
];

// Point d'arrivée des liens envoyés par e-mail (mot de passe oublié, invitation).
// Gère le flux PKCE (?code=) et le flux token_hash (?token_hash=&type=).
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const next = safeNextPath(searchParams.get("next"));
  const supabase = await createClient();

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  // Erreur renvoyée par le fournisseur (ex. connexion Google annulée).
  if (searchParams.get("error")) {
    console.error(
      "[confirm:provider]",
      searchParams.get("error"),
      searchParams.get("error_code") ?? "",
    );
    return NextResponse.redirect(new URL("/connexion?erreur=google", request.nextUrl.origin));
  }

  let ok = false;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    logError("confirm:code", error);
    ok = !error;
  } else if (tokenHash && type && OTP_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    logError("confirm:otp", error);
    ok = !error;
  }

  const target = new URL(ok ? next : "/connexion?erreur=lien", request.nextUrl.origin);
  return NextResponse.redirect(target);
}
