"use server";

import { createSupabaseServerClient, requireAdmin } from "@/lib/supabase/server";

/**
 * Pauses or resumes a coupon. Everything else about a coupon is fixed once it
 * exists, because orders already placed reference the code it gave them.
 */
export async function setCouponActive(id, active) {
  await requireAdmin();

  if (!id) return { ok: false, error: "Missing coupon id" };
  if (typeof active !== "boolean") {
    return { ok: false, error: "Missing the coupon's new state" };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("coupons")
    .update({ active })
    .eq("id", id)
    .select("id, active");

  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) {
    return {
      ok: false,
      error:
        "No rows were updated. This usually means the row was blocked by RLS policy or the id does not exist.",
    };
  }

  return { ok: true, data: data[0] };
}
