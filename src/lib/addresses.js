import { z } from "zod";
import { BD_PHONE } from "@/lib/validation";

export const ADDRESS_COLUMNS = "id, label, name, phone, address, city, created_at";

// The same rules checkout applies, so a saved address can always refill the
// checkout form without tripping its validation.
const addressSchema = z.object({
  label: z
    .string()
    .max(40, "Keep the label under 40 characters")
    .transform((v) => v || null),
  name: z
    .string()
    .min(2, "Please enter your full name")
    .max(100, "Name is too long"),
  phone: z
    .string()
    .regex(BD_PHONE, "Enter a valid mobile number, e.g. 01XXXXXXXXX"),
  address: z
    .string()
    .min(10, "Please enter a complete delivery address")
    .max(500, "Address is too long"),
  city: z.string().max(80, "City is too long").transform((v) => v || null),
});

const text = (value) => String(value ?? "").trim();

/**
 * Reads an address form (FormData or plain object) and validates it.
 * Returns `{ success: true, data }` or `{ success: false, error, fieldErrors }`.
 */
export function parseAddressForm(input) {
  const get = (key) =>
    typeof input?.get === "function" ? input.get(key) : input?.[key];

  const result = addressSchema.safeParse({
    label: text(get("label")),
    name: text(get("name")),
    phone: text(get("phone")),
    address: text(get("address")),
    city: text(get("city")),
  });

  if (result.success) {
    return { success: true, data: result.data };
  }

  const fieldErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (field && !fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }
  }

  return {
    success: false,
    error: result.error.issues[0]?.message || "Please check the form",
    fieldErrors,
  };
}

/**
 * The fields that make two addresses the same one. Used to stop a repeated
 * "save this address" from piling up identical rows.
 */
export function addressKey(address) {
  return [address.name, address.phone, address.address, address.city ?? ""]
    .map((value) =>
      String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " "),
    )
    .join("|");
}
