"use server";

import { revalidateTag } from "next/cache";
import { createSupabaseServerClient, requireAdmin } from "@/lib/supabase/server";

export async function createProductImage(productId, url) {
  await requireAdmin();

  if (!productId) {
    return { ok: false, error: "Missing product id" };
  }

  const cleanUrl = typeof url === "string" ? url.trim() : "";
  if (!/^https?:\/\//i.test(cleanUrl)) {
    return { ok: false, error: "Image url must start with http:// or https://" };
  }

  const supabase = await createSupabaseServerClient();

  // Append to the end of the gallery.
  const { data: existing, error: readError } = await supabase
    .from("product_images")
    .select("position")
    .eq("product_id", productId)
    .order("position", { ascending: false })
    .limit(1);

  if (readError) {
    return { ok: false, error: readError.message };
  }

  const position = (existing?.[0]?.position ?? -1) + 1;

  const { data, error } = await supabase
    .from("product_images")
    .insert([{ product_id: productId, url: cleanUrl, position }])
    .select()
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidateTag("products");

  return { ok: true, data };
}
