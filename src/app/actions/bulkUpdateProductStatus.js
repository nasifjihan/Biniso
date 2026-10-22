"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createSupabaseServerClient, requireAdmin } from "@/lib/supabase/server";

const ALLOWED_STATUSES = ["active", "inactive", "draft"];
const MAX_BATCH = 200;

/** Sets the same visibility status on many products, for the admin table. */
export async function bulkUpdateProductStatus(ids, status) {
  await requireAdmin();

  const productIds = Array.isArray(ids)
    ? [...new Set(ids.filter((id) => typeof id === "string" && id))]
    : [];

  if (productIds.length === 0) {
    return { ok: false, error: "Select at least one product." };
  }
  if (productIds.length > MAX_BATCH) {
    return { ok: false, error: `Update at most ${MAX_BATCH} products at a time.` };
  }
  if (!ALLOWED_STATUSES.includes(status)) {
    return { ok: false, error: "Unknown status" };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("products")
    .update({ status }, { count: "exact" })
    .in("id", productIds)
    .select("id");

  if (error) return { ok: false, error: error.message };

  revalidateTag("products");
  revalidatePath("/admin/products");

  return { ok: true, updated: data?.length ?? 0 };
}
