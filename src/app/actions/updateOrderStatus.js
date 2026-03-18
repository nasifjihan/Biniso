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

export async function updateOrderStatus(id, status) {
  if (!id) return { ok: false, error: "Missing order id" };
  if (!status) return { ok: false, error: "Missing status" };

  const allowed = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
  if (!allowed.includes(status)) {
    return { ok: false, error: "Invalid status" };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select("id,status");

  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) {
    return {
      ok: false,
      error:
        "No rows were updated. This usually means the row was blocked by RLS policy or the id does not exist.",
    };
  }

  return { ok: true, data: data[0] };
}
