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

export async function updateProduct(id, data) {
  if (!id) {
    return { ok: false, error: "Missing product id" };
  }
  const supabase = await getSupabaseServerClient();
  const cleanText = (v) => (typeof v === "string" ? v.trim() : v);
  const cleanUrl = (v) =>
    typeof v === "string" ? v.trim().replace(/^`+|`+$/g, "") : v;
  const update = {
    ...(typeof data?.name === "string" ? { name: cleanText(data.name) } : null),
    ...(data?.price !== undefined
      ? {
          price:
            typeof data.price === "string" ? Number(data.price) : data.price,
        }
      : null),
    ...(typeof data?.description === "string"
      ? { description: cleanText(data.description) }
      : null),
    ...(typeof data?.image === "string" ? { image: cleanUrl(data.image) } : null),
    ...(typeof data?.status === "string" ? { status: cleanText(data.status) } : null),
    ...(typeof data?.featured === "boolean" ? { featured: data.featured } : null),
    ...(typeof data?.category === "string"
      ? { category: cleanText(data.category) }
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

  return { ok: true };
}
