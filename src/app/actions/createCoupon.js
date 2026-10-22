"use server";

import { createSupabaseServerClient, requireAdmin } from "@/lib/supabase/server";
import { parseCouponForm } from "@/lib/coupons";

export async function createCoupon(input) {
  await requireAdmin();

  const parsed = parseCouponForm(input);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("coupons")
    .insert([parsed.data])
    .select()
    .single();

  if (error) {
    return {
      ok: false,
      error:
        error.code === "23505"
          ? "A coupon with that code already exists."
          : error.message,
    };
  }

  return { ok: true, data };
}
