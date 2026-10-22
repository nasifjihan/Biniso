"use server";

import { createSupabaseServerClient, requireAdmin } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendOrderStatusEmail } from "@/lib/email";

const ALLOWED_STATUSES = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

// Tell the customer their order moved on. Best effort on purpose: the status is
// already saved, so a mail problem must not report the update as failed.
async function notifyCustomer(supabase, id, status) {
  try {
    const { data: order } = await supabase
      .from("orders")
      .select("id, customer_name, email, total")
      .eq("id", id)
      .maybeSingle();

    if (!order?.email) return;

    const { data: items } = await supabase
      .from("order_items")
      .select("quantity, price, variant_label, products ( name )")
      .eq("order_id", id);

    const lines = (items || []).map((item) => ({
      name: item.products?.name || "Item",
      variant_label: item.variant_label,
      quantity: item.quantity,
      price: item.price,
    }));

    await sendOrderStatusEmail({ ...order, items: lines }, status);
  } catch {
    // Nothing to do: the customer simply misses one notification.
  }
}

export async function updateOrderStatus(id, status) {
  if (!id) return { ok: false, error: "Missing order id" };
  if (!status) return { ok: false, error: "Missing status" };

  if (!ALLOWED_STATUSES.includes(status)) {
    return { ok: false, error: "Invalid status" };
  }

  await requireAdmin();

  const supabase = await createSupabaseServerClient();

  // Cancelling gives back the stock this order reserved, so read the order
  // first: `stock_restored` records whether that has already happened.
  const { data: order, error: readError } = await supabase
    .from("orders")
    .select("id, stock_restored")
    .eq("id", id)
    .maybeSingle();

  if (readError) return { ok: false, error: readError.message };
  if (!order) return { ok: false, error: "Order not found" };

  if (status === "cancelled" && !order.stock_restored) {
    // Claim the restore before doing it, so a second cancel can never return
    // the same items twice.
    const { data: claimed, error: claimError } = await supabase
      .from("orders")
      .update({ status, stock_restored: true })
      .eq("id", id)
      .eq("stock_restored", false)
      .select("id,status");

    if (claimError) return { ok: false, error: claimError.message };
    if (!claimed || claimed.length === 0) {
      return { ok: false, error: "Stock for this order was already returned." };
    }

    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("product_id, variant_id, variant_label, quantity")
      .eq("order_id", id);

    if (itemsError) {
      await supabase.from("orders").update({ stock_restored: false }).eq("id", id);
      return { ok: false, error: itemsError.message };
    }

    // A line labelled with a variant that no longer exists has nothing to
    // restore: the variant row (and its stock) was deleted with it.
    const lines = (items || [])
      .filter((item) => !(item.variant_label && !item.variant_id))
      .map((item) => ({
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
      }));

    if (lines.length > 0) {
      // Stock is written outside RLS, so the service role performs the restore.
      const adminClient = createSupabaseAdminClient();
      const { error: restoreError } = await adminClient.rpc("restore_stock", {
        items: lines,
      });

      if (restoreError) {
        // Release the claim so the admin can retry the cancellation.
        await supabase
          .from("orders")
          .update({ stock_restored: false })
          .eq("id", id);
        return { ok: false, error: restoreError.message };
      }
    }

    await notifyCustomer(supabase, id, status);

    return { ok: true, data: claimed[0] };
  }

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

  await notifyCustomer(supabase, id, status);

  return { ok: true, data: data[0] };
}
