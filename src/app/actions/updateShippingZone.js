"use server";

import { createSupabaseServerClient, requireAdmin } from "@/lib/supabase/server";

/**
 * Updates a zone's label, fee or active state. The code is left alone: orders
 * already placed store it.
 */
export async function updateShippingZone(id, patch) {
  await requireAdmin();

  if (!id) return { ok: false, error: "Missing delivery option id" };

  const update = {};

  if (patch?.name !== undefined) {
    const name = String(patch.name).trim();
    if (name.length < 2 || name.length > 60) {
      return { ok: false, error: "Enter a name between 2 and 60 characters." };
    }
    update.name = name;
  }

  if (patch?.fee !== undefined) {
    const fee = Number(patch.fee);
    if (!Number.isFinite(fee) || fee < 0) {
      return { ok: false, error: "Enter a delivery fee of 0 or more." };
    }
    update.fee = fee;
  }

  if (patch?.active !== undefined) {
    if (typeof patch.active !== "boolean") {
      return { ok: false, error: "Missing the delivery option's new state." };
    }
    update.active = patch.active;
  }

  if (Object.keys(update).length === 0) {
    return { ok: false, error: "Nothing to update." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("shipping_zones")
    .update(update)
    .eq("id", id)
    .select("id, code, name, fee, position, active");

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
