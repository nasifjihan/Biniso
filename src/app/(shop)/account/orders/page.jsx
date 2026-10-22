import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { getCustomerOrders } from "@/lib/orders";
import { orderStatusVariant } from "@/lib/orderStatus";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "My orders" };

// The zone code is what the order stores, so it is shown with its hyphens opened
// up rather than as a slug.
function describeDelivery(order) {
  const method = String(order.delivery_method || "").replaceAll("-", " ");
  const fee = Number(order.delivery_fee) || 0;
  return method ? `${method} (৳ ${fee})` : `৳ ${fee}`;
}

export default async function MyOrdersPage() {
  const user = await getUser();
  if (!user) redirect("/account/login");

  const orders = await getCustomerOrders(user.id);

  return (
    <div className="container mx-auto py-16 max-w-3xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">My orders</h1>
        <Button variant="outline" asChild>
          <Link href="/account">Account</Link>
        </Button>
      </div>

      {orders.length === 0 && (
        <Card className="rounded-2xl">
          <CardContent className="p-10 text-center space-y-4">
            <p className="text-muted-foreground">
              You have not placed an order yet.
            </p>
            <Button asChild>
              <Link href="/products">Browse products</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {orders.map((order) => (
        <div
          key={order.id}
          className="border rounded-2xl p-6 space-y-4 shadow-sm"
        >
          <div className="flex flex-wrap justify-between gap-2">
            <div>
              <p className="font-semibold">Order ID: {order.id}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(order.created_at).toLocaleString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <Badge variant={orderStatusVariant(order.status)}>
              {order.status}
            </Badge>
          </div>

          <div className="border-t pt-3 space-y-2">
            {order.order_items.map((item, index) => (
              <div
                key={index}
                className="flex justify-between gap-4 text-sm"
              >
                <span>
                  {item.products?.name || "Item no longer available"}
                  {item.variant_label ? ` (${item.variant_label})` : ""} ×{" "}
                  {item.quantity}
                </span>
                <span>৳ {item.price * item.quantity}</span>
              </div>
            ))}
          </div>

          <div className="border-t pt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>৳ {order.subtotal}</span>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Discount{order.coupon_code ? ` (${order.coupon_code})` : ""}
                </span>
                <span>- ৳ {order.discount}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery</span>
              <span>{describeDelivery(order)}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-1">
              <span>Total</span>
              <span>৳ {order.total}</span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Delivering to {[order.address, order.city].filter(Boolean).join(", ")}
          </p>

          {order.status === "cancelled" && (
            <p className="text-sm text-muted-foreground">
              This order was cancelled. Anything reserved for it is back in
              stock.
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
