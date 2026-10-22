import { slugify } from "@/lib/categories";

export const SHIPPING_ZONE_COLUMNS = "code, name, fee, position, active";

/** "Inside Dhaka (৳ 60)" — how a delivery option reads at checkout. */
export function describeZone(zone) {
  return `${zone.name} (৳ ${Number(zone.fee)})`;
}

/**
 * Reads an admin delivery form. The code is derived from the name so admins
 * only ever type a label and a fee.
 * Returns `{ ok: true, data }` or `{ ok: false, error }`.
 */
export function parseShippingZoneForm(input) {
  const name = String(input?.name ?? "").trim();
  if (name.length < 2 || name.length > 60) {
    return { ok: false, error: "Enter a name between 2 and 60 characters." };
  }

  // A blank fee must not quietly become free delivery, so 0 has to be typed.
  const rawFee = input?.fee;
  if (rawFee === "" || rawFee === null || rawFee === undefined) {
    return { ok: false, error: "Enter a delivery fee of 0 or more." };
  }

  const fee = Number(rawFee);
  if (!Number.isFinite(fee) || fee < 0) {
    return { ok: false, error: "Enter a delivery fee of 0 or more." };
  }

  return { ok: true, data: { code: slugify(name), name, fee } };
}
