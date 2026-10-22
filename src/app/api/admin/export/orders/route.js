import { createSupabaseServerClient, requireAdmin } from "@/lib/supabase/server";
import { csvFilename, csvResponse, toCsv } from "@/lib/csv";

// Admin-only export. The middleware guard covers `/admin/*`, not `/api/*`, so
// the route checks the session itself.
export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      created_at,
      status,
      customer_name,
      phone,
      email,
      city,
      address,
      delivery_method,
      delivery_fee,
      subtotal,
      discount,
      coupon_code,
      total,
      order_items ( quantity, price, variant_label, products ( name ) )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) return new Response(error.message, { status: 500 });

  const columns = [
    { label: "Order ID", value: "id" },
    { label: "Placed at", value: (row) => new Date(row.created_at).toISOString() },
    { label: "Status", value: "status" },
    { label: "Customer", value: "customer_name" },
    { label: "Phone", value: "phone" },
    { label: "Email", value: "email" },
    { label: "City", value: "city" },
    { label: "Address", value: "address" },
    { label: "Delivery zone", value: "delivery_method" },
    { label: "Delivery fee", value: "delivery_fee" },
    { label: "Subtotal", value: "subtotal" },
    { label: "Discount", value: "discount" },
    { label: "Coupon", value: "coupon_code" },
    { label: "Total", value: "total" },
    {
      label: "Items",
      value: (row) =>
        (row.order_items || [])
          .map((item) => {
            const name = item.products?.name || "Item";
            const label = item.variant_label ? ` (${item.variant_label})` : "";
            return `${name}${label} x${item.quantity}`;
          })
          .join(" | "),
    },
  ];

  return csvResponse(csvFilename("orders"), toCsv(columns, data));
}
