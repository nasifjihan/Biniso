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

export async function deleteProduct(id) {
  const supabase = await getSupabaseServerClient();
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
  return { ok: true };
}
