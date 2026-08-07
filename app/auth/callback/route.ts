import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requestedNext = url.searchParams.get("next") ?? "/profil";
  const next = requestedNext.startsWith("/") ? requestedNext : "/profil";

  if (!code) {
    return NextResponse.redirect(new URL(`/anmelden?error=${encodeURIComponent("Bestätigungslink ist unvollständig. Bitte fordere eine neue Bestätigungs-E-Mail an.")}`, url.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL(`/anmelden?error=${encodeURIComponent("E-Mail konnte nicht bestätigt werden. Bitte fordere eine neue Bestätigungs-E-Mail an.")}`, url.origin));
  }

  return NextResponse.redirect(new URL(`${next}?confirmed=1`, url.origin));
}
