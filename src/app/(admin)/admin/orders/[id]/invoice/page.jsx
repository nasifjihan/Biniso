import InvoiceClient from "@/components/InvoiceClient";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function InvoicePage({ params }) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const orderId = resolvedParams?.id;
    if (!orderId || orderId === "undefined") {
      return (
        <div className="container mx-auto py-10">
          <div className="text-sm text-destructive">Invalid order id.</div>
        </div>
      );
    }

    const supabase = await createSupabaseServerClient();

    const { data: order, error } = await supabase
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
      .eq("id", orderId)
      .maybeSingle();

    if (error) {
      return (
        <div className="container mx-auto py-10">
          <div className="text-sm text-destructive">{error.message}</div>
        </div>
      );
    }

    if (!order) {
      return (
        <div className="container mx-auto py-10">
          <div className="text-sm text-muted-foreground">
            Invoice not available for this order.
          </div>
        </div>
      );
    }

    return <InvoiceClient order={order} />;
  } catch (e) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-sm text-destructive">
          {e?.message || "Failed to load invoice."}
        </div>
      </div>
    );
  }
}
