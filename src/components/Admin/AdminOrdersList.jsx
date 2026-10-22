"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import OrderStatusButtons from "@/components/OrderStatusButtons";
import { bulkUpdateOrderStatus } from "@/app/actions/bulkUpdateOrderStatus";
import { orderStatusVariant } from "@/lib/orderStatus";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AdminOrdersList({ orders }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState([]);
  const [status, setStatus] = useState("confirmed");

  const allSelected = orders.length > 0 && selected.length === orders.length;

  const toggle = (id) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );

  const toggleAll = () =>
    setSelected(allSelected ? [] : orders.map((order) => order.id));

  function applyBulk() {
    startTransition(async () => {
      const result = await bulkUpdateOrderStatus(selected, status);
      if (!result?.ok) {
        toast.error(result?.error || "Failed to update orders");
        return;
      }

      const failed = result.failures?.length || 0;
      if (failed > 0) {
        toast.warning(`Updated ${result.updated} order(s). ${failed} could not be changed.`);
      } else {
        toast.success(`Updated ${result.updated} order(s)`);
      }

      setSelected([]);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border p-4">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={allSelected}
            onCheckedChange={toggleAll}
            aria-label="Select all orders"
          />
          Select all
        </label>

        <span className="text-sm text-muted-foreground">
          {selected.length} selected
        </span>

        <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
          <Select value={status} onValueChange={setStatus} disabled={pending}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            size="sm"
            onClick={applyBulk}
            disabled={pending || selected.length === 0}
          >
            {pending ? "Applying..." : "Apply to selected"}
          </Button>

          <Button size="sm" variant="outline" asChild>
            <a href="/api/admin/export/orders">Export CSV</a>
          </Button>
        </div>
      </div>

      {orders.map((order) => (
        <div key={order.id} className="border rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex justify-between">
            <div className="flex gap-3">
              <Checkbox
                checked={selected.includes(order.id)}
                onCheckedChange={() => toggle(order.id)}
                aria-label={`Select order ${order.id}`}
                className="mt-1"
              />
              <div>
                <p className="font-semibold">Order ID: {order.id}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(order.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            <Badge variant={orderStatusVariant(order.status)}>
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

          {Number(order.discount) > 0 && (
            <div className="flex justify-between text-sm">
              <span>
                Discount{order.coupon_code ? ` (${order.coupon_code})` : ""}
              </span>
              <span>- ৳ {order.discount}</span>
            </div>
          )}

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

          <Link href={`/admin/orders/${order.id}/invoice`}>
            <Button size="sm" variant="outline">
              Invoice
            </Button>
          </Link>
        </div>
      ))}
    </div>
  );
}
