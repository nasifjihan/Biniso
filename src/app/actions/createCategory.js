"use server";

import { revalidateTag } from "next/cache";
import { createSupabaseServerClient, requireAdmin } from "@/lib/supabase/server";
import { slugify } from "@/lib/categories";

export async function createCategory(name) {
  await requireAdmin();

  const cleanName = typeof name === "string" ? name.trim() : "";
  if (!cleanName) {
    return { ok: false, error: "Category name is required" };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .insert([{ name: cleanName, slug: slugify(cleanName) }])
    .select()
    .single();

  if (error) {
    return {
      ok: false,
      error:
        error.code === "23505"
          ? `A category with that name already exists.`
          : error.message,
    };
  }

  revalidateTag("products");

  return { ok: true, data };
}
