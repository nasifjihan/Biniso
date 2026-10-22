"use server";

import { revalidateTag } from "next/cache";
import { createSupabaseServerClient, requireAdmin } from "@/lib/supabase/server";

export async function deleteVariant(id) {
  await requireAdmin();

  if (!id) {
    return { ok: false, error: "Missing variant id" };
  }

  const supabase = await createSupabaseServerClient();
  const { data: deletedRows, error } = await supabase
    .from("product_variants")
    .delete({ count: "exact" })
    .eq("id", id)
    .select("id");

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!deletedRows || deletedRows.length === 0) {
    return { ok: false, error: "The variant could not be deleted." };
  }

  revalidateTag("products");

  return { ok: true };
}
