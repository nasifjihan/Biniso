import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getAllOrders() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      order_items (
        quantity,
        price,
        products ( name )
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}
