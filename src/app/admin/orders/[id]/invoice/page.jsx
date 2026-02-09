import InvoiceClient from "@/components/InvoiceClient";
import { supabase } from "@/lib/supabase";

export default async function InvoicePage({ params }) {
  const { data: order } = await supabase
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
    .eq("id", params.id)
    .single();

  return <InvoiceClient order={order} />;
}
