"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/server";
import { parseCredentials } from "@/lib/auth";
import { ADMIN_ROLE } from "@/lib/roles";

/**
 * Creates a second admin account with a password the owner chooses.
 * Supabase's invite email is deliberately not used: it lands the invitee signed
 * in without a password, and with no password-reset flow yet there would be no
 * way for them to set one. A customer who already has an account is promoted
 * from the list instead.
 */
export async function createAdminUser(input) {
  await requireAdmin();

  const parsed = parseCredentials(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error, fieldErrors: parsed.fieldErrors };
  }

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    // The password is handed over directly, so there is no inbox to confirm.
    email_confirm: true,
    app_metadata: { role: ADMIN_ROLE },
  });

  if (error) {
    if (/already|exists|registered/i.test(error.message || "")) {
      return {
        ok: false,
        error:
          "That email already has an account — find it in the list and use Make admin.",
      };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/users");
  return { ok: true, email: data?.user?.email || parsed.data.email };
}
