import { z } from "zod";

export const DELIVERY_METHODS = ["inside_dhaka", "outside_dhaka", "pickup"];

// Bangladeshi mobile numbers: optional +88/88 prefix, then 01[3-9] and 8 digits.
const BD_PHONE = /^(?:\+?88)?01[3-9]\d{8}$/;

/** Shape of a validated checkout submission. Empty optional strings become `null`. */
export const checkoutSchema = z.object({
  name: z
    .string()
    .min(2, "Please enter your full name")
    .max(100, "Name is too long"),
  phone: z
    .string()
    .regex(BD_PHONE, "Enter a valid mobile number, e.g. 01XXXXXXXXX"),
  email: z
    .union([z.literal(""), z.email("Enter a valid email address")])
    .transform((v) => v || null),
  city: z.string().max(80, "City is too long").transform((v) => v || null),
  address: z
    .string()
    .min(10, "Please enter a complete delivery address")
    .max(500, "Address is too long"),
  notes: z.string().max(500, "Notes are too long").transform((v) => v || null),
  delivery_method: z.enum(DELIVERY_METHODS),
});

const text = (value) => String(value ?? "").trim();

/**
 * Reads a checkout form (FormData or plain object) and validates it.
 * Returns `{ success: true, data }` or `{ success: false, error, fieldErrors }`.
 */
export function parseCheckoutForm(input) {
  const get = (key) =>
    typeof input?.get === "function" ? input.get(key) : input?.[key];

  const result = checkoutSchema.safeParse({
    name: text(get("name")),
    phone: text(get("phone")),
    email: text(get("email")),
    city: text(get("city")),
    address: text(get("address")),
    notes: text(get("notes")),
    delivery_method: text(get("delivery_method")),
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
