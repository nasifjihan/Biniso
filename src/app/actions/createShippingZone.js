"use server";

import { createSupabaseServerClient, requireAdmin } from "@/lib/supabase/server";
import { parseShippingZoneForm } from "@/lib/shipping";

export async function createShippingZone(input) {
  await requireAdmin();

  const parsed = parseShippingZoneForm(input);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }

  const supabase = await createSupabaseServerClient();

  // New zones go to the end of the checkout list.
  const { data: last } = await supabase
    .from("shipping_zones")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("shipping_zones")
    .insert([{ ...parsed.data, position: (last?.position ?? 0) + 1 }])
    .select()
    .single();

  if (error) {
    return {
      ok: false,
      error:
        error.code === "23505"
          ? "A delivery option with that name already exists."
          : error.message,
    };
  }

  return { ok: true, data };
}
