"use server";

import { revalidateTag } from "next/cache";
import { createSupabaseServerClient, requireAdmin } from "@/lib/supabase/server";
import { slugify } from "@/lib/categories";

export async function updateCategory(id, name) {
  await requireAdmin();

  if (!id) {
    return { ok: false, error: "Missing category id" };
  }

  const cleanName = typeof name === "string" ? name.trim() : "";
  if (!cleanName) {
    return { ok: false, error: "Category name is required" };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .update({ name: cleanName, slug: slugify(cleanName) })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return {
      ok: false,
      error:
        error.code === "23505"
          ? "Another category already uses that name."
          : error.message,
    };
  }

  revalidateTag("products");

  return { ok: true, data };
}
