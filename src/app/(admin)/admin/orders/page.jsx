import { getAllOrders } from "@/lib/orders";
import { Badge } from "@/components/ui/badge";
import OrderStatusButtons from "@/components/OrderStatusButtons";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdminOrdersPage() {
  const orders = await getAllOrders();

  return (
    <div className="container mx-auto py-10 space-y-8">
      <h1 className="text-3xl font-bold">Orders Management</h1>

      <div className="space-y-6">
        {orders.map((order) => (
          <div
            key={order.id}
            className="border rounded-2xl p-6 space-y-4 shadow-sm"
          >
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
                    : order.status === "cancelled"
                      ? "destructive"
                      : order.status === "confirmed"
                      ? "default"
                      : "outline"
                }
              >
                {order.status}
              </Badge>
            </div>

            <div className="text-sm space-y-1">
              <p>
                <strong>Name:</strong> {order.customer_name}
              </p>
              <p>
                <strong>Phone:</strong> {order.phone}
              </p>
              {order.email && (
                <p>
                  <strong>Email:</strong> {order.email}
                </p>
              )}
              {order.city && (
                <p>
                  <strong>City:</strong> {order.city}
                </p>
              )}
              <p>
                <strong>Address:</strong> {order.address}
              </p>
              {order.delivery_method && (
                <p>
                  <strong>Delivery:</strong> {order.delivery_method}
                </p>
              )}
              {order.delivery_fee !== undefined && order.delivery_fee !== null && (
                <p>
                  <strong>Delivery fee:</strong> ৳ {order.delivery_fee}
                </p>
              )}
              {order.notes && (
                <p>
                  <strong>Notes:</strong> {order.notes}
                </p>
              )}
            </div>

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

            <div className="text-right font-bold text-lg">
              Total: ৳ {order.total}
            </div>

            <OrderStatusButtons orderId={order.id} status={order.status} />

            {order.id ? (
              <Link href={`/admin/orders/${order.id}/invoice`}>
                <Button size="sm" variant="outline">
                  Invoice
                </Button>
              </Link>
            ) : (
              <Button size="sm" variant="outline" disabled>
                Invoice
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
