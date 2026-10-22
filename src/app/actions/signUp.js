"use server";

import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseCredentials } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";

// Supabase emails a confirmation link, and the PKCE code in it is exchanged for
// a session on /auth/callback. The host comes from the request so the link works
// on localhost and in production without another env var.
function originFrom(requestHeaders) {
  const host =
    requestHeaders.get("x-forwarded-host") || requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") || "http";
  return `${protocol}://${host}`;
}

function ipFrom(requestHeaders) {
  return (
    (requestHeaders.get("x-forwarded-for") || "").split(",")[0].trim() ||
    requestHeaders.get("x-real-ip") ||
    "unknown"
  );
}

export async function signUp(formData) {
  const parsed = parseCredentials(formData);
  if (!parsed.success) {
    return { ok: false, error: parsed.error, fieldErrors: parsed.fieldErrors };
  }

  const requestHeaders = await headers();
  const limited = rateLimit(`signup:${ipFrom(requestHeaders)}`, { limit: 5 });
  if (!limited.ok) {
    return {
      ok: false,
      error: "Too many attempts. Please try again in a minute.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${originFrom(requestHeaders)}/auth/callback?next=/account`,
    },
  });

  if (error) return { ok: false, error: error.message };

  // With email confirmation switched on, Supabase returns a user but no session:
  // the account only works once the emailed link is followed.
  if (!data.session) return { ok: true, needsConfirmation: true };

  return { ok: true };
}
