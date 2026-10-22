"use server";

import { revalidateTag } from "next/cache";
import { createSupabaseServerClient, requireAdmin } from "@/lib/supabase/server";
import { normaliseVariantInput } from "@/lib/variants";

export async function createVariant({ product_id, options, sku, price, stock }) {
  await requireAdmin();

  if (!product_id) {
    return { ok: false, error: "Missing product" };
  }

  const payload = normaliseVariantInput({ options, sku, price, stock });
  if (Object.keys(payload.attributes).length === 0) {
    return {
      ok: false,
      error: "Add at least one option, e.g. Color=Red, Size=M",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("product_variants")
    .insert([{ product_id, ...payload }])
    .select()
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidateTag("products");

  return { ok: true, data };
}
