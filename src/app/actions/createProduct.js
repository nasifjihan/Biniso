"use server";

import { revalidateTag } from "next/cache";
import { createSupabaseServerClient, requireAdmin } from "@/lib/supabase/server";

export async function createProduct(data) {
  await requireAdmin();

  const { name, price, description, image, featured, status, categoryId, stock } =
    data;
  const supabase = await createSupabaseServerClient();

  const cleanText = (v) => (typeof v === "string" ? v.trim() : v);
  const cleanUrl = (v) =>
    typeof v === "string" ? v.trim().replace(/^`+|`+$/g, "") : v;
  // Empty means "not stock-tracked" (null).
  const cleanStock = (v) => {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : null;
  };

  const payload = {
    name: cleanText(name),
    price: typeof price === "string" ? Number(price) : price,
    description: cleanText(description),
    image: cleanUrl(image),
    featured: !!featured,
    status: cleanText(status) || "active",
    stock: cleanStock(stock),
    ...(typeof categoryId === "string" && categoryId.trim()
      ? { category_id: categoryId.trim() }
      : null),
  };

  const { data: created, error } = await supabase
    .from("products")
    .insert([payload])
    .select()
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidateTag("products");

  return { ok: true, data: created };
}
