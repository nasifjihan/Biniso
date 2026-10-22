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

// Orders belonging to one customer. RLS already limits reads to their own rows;
// the filter is repeated so a policy mistake cannot widen the result.
export async function getCustomerOrders(userId) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      status,
      created_at,
      subtotal,
      discount,
      coupon_code,
      delivery_method,
      delivery_fee,
      total,
      city,
      address,
      order_items (
        quantity,
        price,
        variant_label,
        products ( name )
      )
    `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}
