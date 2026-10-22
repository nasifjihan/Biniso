"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/server";
import { updateOrderStatus } from "./updateOrderStatus";

const MAX_BATCH = 100;

/**
 * Moves many orders to one status. Each order goes through `updateOrderStatus`
 * so cancelling a batch still returns the reserved stock, and each customer
 * still gets the usual notification.
 */
export async function bulkUpdateOrderStatus(ids, status) {
  await requireAdmin();

  const orderIds = Array.isArray(ids)
    ? [...new Set(ids.filter((id) => typeof id === "string" && id))]
    : [];

  if (orderIds.length === 0) {
    return { ok: false, error: "Select at least one order." };
  }
  if (orderIds.length > MAX_BATCH) {
    return { ok: false, error: `Update at most ${MAX_BATCH} orders at a time.` };
  }

  let updated = 0;
  const failures = [];

  for (const id of orderIds) {
    const result = await updateOrderStatus(id, status);
    if (result?.ok) {
      updated += 1;
    } else {
      failures.push({ id, error: result?.error || "Failed" });
    }
  }

  revalidatePath("/admin/orders");

  return { ok: true, updated, failures };
}
