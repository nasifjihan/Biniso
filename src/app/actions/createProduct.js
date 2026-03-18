"use server";

import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

async function getSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch (e) {
            return;
          }
        },
      },
    },
  );
}

export async function createProduct(data) {
  const { name, price, description, image, featured, status, category } = data;
  const supabase = await getSupabaseServerClient();

  const cleanText = (v) => (typeof v === "string" ? v.trim() : v);
  const cleanUrl = (v) =>
    typeof v === "string" ? v.trim().replace(/^`+|`+$/g, "") : v;

  const payload = {
    name: cleanText(name),
    price: typeof price === "string" ? Number(price) : price,
    description: cleanText(description),
    image: cleanUrl(image),
    featured: !!featured,
    status: cleanText(status) || "active",
    ...(typeof category === "string" && category.trim()
      ? { category: category.trim() }
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

  return { ok: true, data: created };
}
