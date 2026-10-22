"use server";

import { createSupabaseServerClient, getUser } from "@/lib/supabase/server";
import { FAVORITE_COLUMNS } from "@/lib/favorites";

/** The signed-in customer's saved wishlist, newest first. */
export async function loadFavorites() {
  const user = await getUser();
  // A guest has nothing stored against an account, so an empty list is the
  // right answer here rather than an error.
  if (!user) return { ok: true, ids: [], skipped: true };

  // The customer's own session, so RLS returns only their rows.
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("favorites")
    .select(FAVORITE_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) return { ok: false, error: error.message, ids: [] };

  return { ok: true, ids: (data || []).map((row) => row.product_id) };
}
