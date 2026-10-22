"use server";

import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseCredentials } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";

export async function signIn(formData) {
  const parsed = parseCredentials(formData);
  if (!parsed.success) {
    return { ok: false, error: parsed.error, fieldErrors: parsed.fieldErrors };
  }

  const requestHeaders = await headers();
  const ip =
    (requestHeaders.get("x-forwarded-for") || "").split(",")[0].trim() ||
    requestHeaders.get("x-real-ip") ||
    "unknown";

  const limited = rateLimit(`login:${ip}`, { limit: 10 });
  if (!limited.ok) {
    return {
      ok: false,
      error: "Too many attempts. Please try again in a minute.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // Supabase's own wording is accurate but reads oddly inside the form.
    if (/email not confirmed/i.test(error.message)) {
      return {
        ok: false,
        error: "Confirm your email address first — check your inbox for the link.",
      };
    }
    if (/invalid login credentials/i.test(error.message)) {
      return { ok: false, error: "That email and password do not match." };
    }
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
