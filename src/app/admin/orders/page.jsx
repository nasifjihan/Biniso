import { getAllOrders } from "@/lib/orders";
import { Badge } from "@/components/ui/badge";
import OrderStatusButtons from "@/components/OrderStatusButtons";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/Logout";

export default async function AdminOrdersPage() {
  const orders = await getAllOrders();

  return (
    <div className="p-10 space-y-8">
      <h1 className="text-3xl font-bold">Orders Management</h1>

      <div className="space-y-6">
        {orders.map((order) => (
          <div
            key={order.id}
            className="border rounded-2xl p-6 space-y-4 shadow-sm"
          >
            {/* Order Header */}
            <div className="flex justify-between">
              <div>
                <p className="font-semibold">Order ID: {order.id}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(order.created_at).toLocaleString()}
                </p>
              </div>

              <Badge
                variant={
                  order.status === "pending"
                    ? "secondary"
                    : order.status === "confirmed"
                      ? "default"
                      : "destructive"
                }
              >
                {order.status}
              </Badge>
            </div>

            {/* Customer Info */}
            <div className="text-sm space-y-1">
              <p>
                <strong>Name:</strong> {order.customer_name}
              </p>
              <p>
                <strong>Phone:</strong> {order.phone}
              </p>
              <p>
                <strong>Address:</strong> {order.address}
              </p>
              {order.notes && (
                <p>
                  <strong>Notes:</strong> {order.notes}
                </p>
              )}
            </div>

            {/* Items */}
            <div className="border-t pt-3 space-y-2">
              {order.order_items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>
                    {item.products.name} × {item.quantity}
                  </span>
                  <span>৳ {item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="text-right font-bold text-lg">
              Total: ৳ {order.total}
            </div>

            <OrderStatusButtons orderId={order.id} />

            <Link href={`/admin/orders/${order.id}/invoice`}>
              <Button size="sm" variant="outline">
                Invoice
              </Button>
            </Link>

            <LogoutButton />
          </div>
        ))}
      </div>
    </div>
  );
}
