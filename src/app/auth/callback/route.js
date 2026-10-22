import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Only same-site paths are accepted, so a crafted link cannot bounce the
// customer to another site after signing in.
function safeNext(value) {
  return typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//")
    ? value
    : "/account";
}

// Landing point for the link Supabase emails out. The PKCE code is exchanged for
// a session cookie here, then the customer is sent on to their account.
export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${url.origin}${next}`);
    }
  }

  // Expired, already used, or missing code: ask them to log in instead.
  return NextResponse.redirect(`${url.origin}/account/login?notice=confirm`);
}
