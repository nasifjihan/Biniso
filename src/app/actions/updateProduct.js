"use server";

import { revalidateTag } from "next/cache";
import { createSupabaseServerClient, requireAdmin } from "@/lib/supabase/server";

export async function updateProduct(id, data) {
  if (!id) {
    return { ok: false, error: "Missing product id" };
  }

  await requireAdmin();

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
  const update = {
    ...(typeof data?.name === "string" ? { name: cleanText(data.name) } : null),
    ...(data?.price !== undefined
      ? {
          price:
            typeof data.price === "string" ? Number(data.price) : data.price,
        }
      : null),
    ...(data?.stock !== undefined ? { stock: cleanStock(data.stock) } : null),
    ...(typeof data?.description === "string"
      ? { description: cleanText(data.description) }
      : null),
    ...(typeof data?.image === "string" ? { image: cleanUrl(data.image) } : null),
    ...(typeof data?.status === "string" ? { status: cleanText(data.status) } : null),
    ...(typeof data?.featured === "boolean" ? { featured: data.featured } : null),
    // An empty category id clears the product's category.
    ...(data?.categoryId !== undefined
      ? {
          category_id:
            typeof data.categoryId === "string" && data.categoryId.trim()
              ? data.categoryId.trim()
              : null,
        }
      : null),
  };

  if (Object.keys(update).length === 0) {
    return { ok: false, error: "No fields to update" };
  }

  const { data: updatedRows, error } = await supabase
    .from("products")
    .update(update, { count: "exact" })
    .eq("id", id)
    .select("id");
  if (error) {
    return { ok: false, error: error.message };
  }

  if (!updatedRows || updatedRows.length === 0) {
    return {
      ok: false,
      error:
        "No rows were updated. This usually means the row was blocked by RLS policy or the id does not exist.",
    };
  }

  revalidateTag("products");

  return { ok: true };
}
