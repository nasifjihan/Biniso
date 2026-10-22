"use server";

import { createSupabaseServerClient, requireAdmin } from "@/lib/supabase/server";

export async function deleteCoupon(id) {
  await requireAdmin();

  if (!id) return { ok: false, error: "Missing coupon id" };

  const supabase = await createSupabaseServerClient();
  // Orders keep the code they used (it is stored as plain text on the order).
  const { data: deletedRows, error } = await supabase
    .from("coupons")
    .delete({ count: "exact" })
    .eq("id", id)
    .select("id");

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!deletedRows || deletedRows.length === 0) {
    return {
      ok: false,
      error:
        "No rows were deleted. This usually means the row was blocked by RLS policy or the id does not exist.",
    };
  }

  return { ok: true };
}
