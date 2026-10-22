"use server";

import { createSupabaseServerClient, getUser } from "@/lib/supabase/server";
import { parseFavoriteIds } from "@/lib/favorites";

/**
 * Makes the account match the list the browser is showing: the ids that are
 * missing are added and the ones that are gone are removed. Nothing else on the
 * row set is touched, so an out-of-date tab cannot wipe the wishlist.
 */
export async function pushFavorites(ids) {
  const user = await getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const wanted = parseFavoriteIds(ids);
  const supabase = await createSupabaseServerClient();

  const { data: current, error: readError } = await supabase
    .from("favorites")
    .select("product_id")
    .eq("user_id", user.id);

  if (readError) return { ok: false, error: readError.message };

  const have = (current || []).map((row) => row.product_id);
  const added = wanted.filter((id) => !have.includes(id));
  const removed = have.filter((id) => !wanted.includes(id));

  if (added.length > 0) {
    // `ignoreDuplicates` keeps a repeat save from failing on the primary key,
    // which happens when two tabs push the same list at the same time.
    const { error } = await supabase.from("favorites").upsert(
      added.map((product_id) => ({ user_id: user.id, product_id })),
      { onConflict: "user_id,product_id", ignoreDuplicates: true },
    );

    if (error) return { ok: false, error: error.message };
  }

  if (removed.length > 0) {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .in("product_id", removed);

    if (error) return { ok: false, error: error.message };
  }

  return { ok: true };
}
