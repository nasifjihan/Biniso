"use server";

import { revalidateTag } from "next/cache";
import { createSupabaseServerClient, requireAdmin } from "@/lib/supabase/server";

export async function deleteProduct(id) {
  await requireAdmin();

  const supabase = await createSupabaseServerClient();
  const { data: deletedRows, error } = await supabase
    .from("products")
    .delete({ count: "exact" })
    .eq("id", id)
    .select("id");
  if (error) {
    return { ok: false, error: error.message };
  }
  if (!deletedRows || deletedRows.length === 0) {
    return {
      ok: false,
      error:
        "No rows were deleted. This usually means the row was blocked by RLS policy or the id does not exist.",
    };
  }
  revalidateTag("products");

  return { ok: true };
}
