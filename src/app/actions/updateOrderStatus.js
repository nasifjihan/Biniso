"use server";

import { createSupabaseServerClient, requireAdmin } from "@/lib/supabase/server";

const ALLOWED_STATUSES = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

export async function updateOrderStatus(id, status) {
  if (!id) return { ok: false, error: "Missing order id" };
  if (!status) return { ok: false, error: "Missing status" };

  if (!ALLOWED_STATUSES.includes(status)) {
    return { ok: false, error: "Invalid status" };
  }

  await requireAdmin();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select("id,status");

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
