"use client";

import { Button } from "@/components/ui/button";
import { updateOrderStatus } from "@/app/actions/updateOrderStatus";
import { useEffect, useState, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function OrderStatusButtons({ orderId, status }) {
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(status || "pending");

  useEffect(() => {
    setValue(status || "pending");
  }, [status]);

  return (
    <div className="flex items-center gap-2">
      <Select
        value={value}
        onValueChange={(v) => {
          setValue(v);
          startTransition(async () => {
            const res = await updateOrderStatus(orderId, v);
            if (!res?.ok) {
              toast.error(res?.error || "Failed to update status");
              setValue(status || "pending");
              return;
            }
            toast.success("Status updated");
          });
        }}
        disabled={pending}
      >
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="confirmed">Confirmed</SelectItem>
          <SelectItem value="shipped">Shipped</SelectItem>
          <SelectItem value="delivered">Delivered</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>

      <Button
        size="sm"
        variant="outline"
        onClick={() =>
          startTransition(async () => {
            const res = await updateOrderStatus(orderId, "confirmed");
            if (!res?.ok) {
              toast.error(res?.error || "Failed to update status");
              return;
            }
            toast.success("Order confirmed");
          })
        }
        disabled={pending}
      >
        Confirm
      </Button>

      <Button
        size="sm"
        variant="destructive"
        onClick={() =>
          startTransition(async () => {
            const res = await updateOrderStatus(orderId, "cancelled");
            if (!res?.ok) {
              toast.error(res?.error || "Failed to update status");
              return;
            }
            toast.success("Order cancelled");
          })
        }
        disabled={pending}
      >
        Cancel
      </Button>
    </div>
  );
}
