"use server";

import { createSupabaseServerClient, getUser } from "@/lib/supabase/server";
import { ADDRESS_COLUMNS, addressKey, parseAddressForm } from "@/lib/addresses";

export async function createAddress(input) {
  const user = await getUser();
  if (!user) return { ok: false, error: "Log in to save an address." };

  const parsed = parseAddressForm(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error, fieldErrors: parsed.fieldErrors };
  }

  // Writes go through the customer's own session, so RLS decides that the row
  // belongs to them — the service role is not needed and not used here.
  const supabase = await createSupabaseServerClient();

  const { data: existing, error: readError } = await supabase
    .from("addresses")
    .select(ADDRESS_COLUMNS)
    .eq("user_id", user.id);

  if (readError) return { ok: false, error: readError.message };

  const key = addressKey(parsed.data);
  const saved = (existing || []).find((row) => addressKey(row) === key);
  if (saved) return { ok: true, data: saved, duplicate: true };

  const { data, error } = await supabase
    .from("addresses")
    .insert([{ ...parsed.data, user_id: user.id }])
    .select(ADDRESS_COLUMNS)
    .single();

  if (error) return { ok: false, error: error.message };

  return { ok: true, data };
}
