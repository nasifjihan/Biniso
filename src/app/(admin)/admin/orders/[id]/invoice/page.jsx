import InvoiceClient from "@/components/InvoiceClient";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

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

    const cookieStore = await cookies();
    const supabase = createServerClient(
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
