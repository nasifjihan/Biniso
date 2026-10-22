import { getAllOrders } from "@/lib/orders";
import AdminOrdersList from "@/components/Admin/AdminOrdersList";

export const metadata = { title: "Orders" };

export default async function AdminOrdersPage() {
  const orders = await getAllOrders();

  return (
    <div className="container mx-auto py-10 space-y-8">
      <h1 className="text-3xl font-bold">Orders Management</h1>

      {orders.length === 0 ? (
        <p className="text-muted-foreground">No orders yet.</p>
      ) : (
        <AdminOrdersList orders={orders} />
      )}
    </div>
  );
}
