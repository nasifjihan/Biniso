"use server";

import { createSupabaseServerClient, getUser } from "@/lib/supabase/server";

export async function deleteAddress(id) {
  if (!id) return { ok: false, error: "Missing address id" };

  const user = await getUser();
  if (!user) return { ok: false, error: "Log in to manage your addresses." };

  // RLS scopes the delete to the signed-in customer, so an id belonging to
  // somebody else simply matches no row.
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) {
    return { ok: false, error: "That address no longer exists." };
  }

  return { ok: true };
}
