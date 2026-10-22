"use server";

import { headers } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rateLimit";
import { reportError } from "@/lib/monitoring";
import { COUPON_COLUMNS, checkCoupon, describeCoupon, normaliseCode } from "@/lib/coupons";

/**
 * Checks a promo code so the checkout page can preview the discount. The
 * subtotal is whatever the browser sent, so this is a preview only: the order
 * is priced again from the database when it is placed.
 */
export async function validateCoupon(code, subtotal) {
  const normalised = normaliseCode(code);
  if (!normalised) {
    return { ok: false, error: "Enter a promo code." };
  }

  const amount = Number(subtotal);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Add something to your cart first." };
  }

  const requestHeaders = await headers();
  const ip =
    (requestHeaders.get("x-forwarded-for") || "").split(",")[0].trim() ||
    requestHeaders.get("x-real-ip") ||
    "unknown";

  // Codes are short and guessable, so the lookup is throttled per caller.
  const limited = rateLimit(`coupon:${ip}`, { limit: 8 });
  if (!limited.ok) {
    return { ok: false, error: "Too many attempts. Please try again in a minute." };
  }

  // Coupons are not publicly readable, so the lookup needs the service role.
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("coupons")
    .select(COUPON_COLUMNS)
    .eq("code", normalised)
    .maybeSingle();

  // Reachable without a session, so the raw database error is logged rather than
  // returned — it would otherwise name tables and columns to an anonymous caller.
  if (error) {
    await reportError(error, { where: "validateCoupon" });
    return { ok: false, error: "Could not check that code. Please try again." };
  }

  const check = checkCoupon(data, amount);
  if (!check.ok) return { ok: false, error: check.error };

  return {
    ok: true,
    coupon: {
      code: data.code,
      discount: check.discount,
      description: describeCoupon(data),
    },
  };
}
