export const COUPON_TYPES = [
  { value: "percent", label: "Percentage off" },
  { value: "fixed", label: "Fixed amount off" },
];

export const COUPON_COLUMNS =
  "code, type, value, min_order, expires_at, usage_limit, used_count, active";

/** Codes are stored and compared in upper case, without spaces. */
export function normaliseCode(code) {
  return String(code ?? "")
    .replace(/\s+/g, "")
    .toUpperCase();
}

export function describeCoupon(coupon) {
  if (!coupon) return "";
  return coupon.type === "percent"
    ? `${Number(coupon.value)}% off`
    : `৳ ${Number(coupon.value)} off`;
}

/**
 * How much a coupon takes off a subtotal. The discount is capped at the
 * subtotal so an order total can never become negative.
 */
export function couponDiscount(coupon, subtotal) {
  const amount =
    coupon.type === "percent"
      ? (subtotal * Number(coupon.value)) / 100
      : Number(coupon.value);

  return Math.round(Math.min(amount, subtotal) * 100) / 100;
}

/**
 * Checks a coupon against an order subtotal.
 * Returns `{ ok: true, discount }` or `{ ok: false, error }`.
 */
export function checkCoupon(coupon, subtotal) {
  if (!coupon || !coupon.active) {
    return { ok: false, error: "That promo code is not valid." };
  }

  if (coupon.expires_at && new Date(coupon.expires_at).getTime() <= Date.now()) {
    return { ok: false, error: "That promo code has expired." };
  }

  if (coupon.usage_limit != null && coupon.used_count >= coupon.usage_limit) {
    return { ok: false, error: "That promo code has been fully claimed." };
  }

  const minOrder = Number(coupon.min_order) || 0;
  if (minOrder > 0 && subtotal < minOrder) {
    return { ok: false, error: `Spend at least ৳ ${minOrder} to use this code.` };
  }

  const discount = couponDiscount(coupon, subtotal);
  if (discount <= 0) {
    return { ok: false, error: "That promo code would not reduce this order." };
  }

  return { ok: true, discount };
}

/** Normalises an admin form's values into a coupon row. */
export function parseCouponForm(input) {
  const code = normaliseCode(typeof input?.code === "string" ? input.code : "");
  if (!code) return { ok: false, error: "A code is required." };

  const type = input?.type;
  if (type !== "percent" && type !== "fixed") {
    return { ok: false, error: "Choose a discount type." };
  }

  const value = Number(input?.value);
  if (!Number.isFinite(value) || value <= 0) {
    return { ok: false, error: "Enter a discount value greater than 0." };
  }
  if (type === "percent" && value > 100) {
    return { ok: false, error: "A percentage discount cannot exceed 100%." };
  }

  const minOrder = Number(input?.min_order);
  if (input?.min_order !== "" && input?.min_order != null && (!Number.isFinite(minOrder) || minOrder < 0)) {
    return { ok: false, error: "Minimum order must be 0 or more." };
  }

  const usageLimitRaw = input?.usage_limit;
  const usageLimit =
    usageLimitRaw === "" || usageLimitRaw == null ? null : Number(usageLimitRaw);
  if (usageLimit !== null && (!Number.isInteger(usageLimit) || usageLimit <= 0)) {
    return { ok: false, error: "Usage limit must be a whole number above 0." };
  }

  const expiresRaw = typeof input?.expires_at === "string" ? input.expires_at.trim() : "";
  // A date input gives "YYYY-MM-DD"; the code stops working at the end of that day.
  const expiresAt = expiresRaw
    ? new Date(`${expiresRaw}T23:59:59.999`)
    : null;
  if (expiresAt && Number.isNaN(expiresAt.getTime())) {
    return { ok: false, error: "Enter a valid expiry date." };
  }

  return {
    ok: true,
    data: {
      code,
      type,
      value,
      min_order: Number.isFinite(minOrder) && minOrder > 0 ? minOrder : 0,
      usage_limit: usageLimit,
      expires_at: expiresAt ? expiresAt.toISOString() : null,
    },
  };
}
