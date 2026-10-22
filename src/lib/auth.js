import { z } from "zod";

// Login and signup share one shape. Supabase reads passwords with bcrypt, which
// only looks at the first 72 bytes, so longer passwords are rejected here
// instead of being silently truncated.
const credentialsSchema = z.object({
  email: z
    .string()
    .min(1, "Enter your email address")
    .max(120, "Email is too long")
    .pipe(z.email("Enter a valid email address")),
  password: z
    .string()
    .min(8, "Use at least 8 characters")
    .max(72, "Passwords cannot be longer than 72 characters"),
});

const text = (value) => String(value ?? "").trim();

/**
 * Reads a login or signup form (FormData or plain object) and validates it.
 * Returns `{ success: true, data }` or `{ success: false, error, fieldErrors }`.
 */
export function parseCredentials(input) {
  const get = (key) =>
    typeof input?.get === "function" ? input.get(key) : input?.[key];

  const result = credentialsSchema.safeParse({
    // Passwords keep their spaces: only the email is trimmed.
    email: text(get("email")),
    password: String(get("password") ?? ""),
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
