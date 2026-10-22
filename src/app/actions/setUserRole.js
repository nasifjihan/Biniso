"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/server";
import { ADMIN_ROLE, CUSTOMER_ROLE } from "@/lib/roles";

/** Promotes or demotes an existing account by writing `app_metadata.role`. */
export async function setUserRole(userId, role) {
  const admin = await requireAdmin();

  if (!userId) return { ok: false, error: "Missing user id" };
  if (role !== ADMIN_ROLE && role !== CUSTOMER_ROLE) {
    return { ok: false, error: "Unknown role" };
  }

  // Demoting yourself would lock you out of the screen you are looking at.
  if (userId === admin.id) {
    return { ok: false, error: "You cannot change your own role." };
  }

  const supabase = createSupabaseAdminClient();

  // `app_metadata` (not `user_metadata`) is the server-only field that
  // middleware.js reads, so a user cannot promote themselves.
  const { data, error } = await supabase.auth.admin.updateUserById(userId, {
    app_metadata: { role },
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/users");
  return { ok: true, email: data?.user?.email || "", role };
}
