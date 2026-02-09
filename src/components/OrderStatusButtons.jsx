"use client";

import { Button } from "@/components/ui/button";
import { updateOrderStatus } from "@/app/actions/updateOrderStatus";
import { useTransition } from "react";

export default function OrderStatusButtons({ orderId }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        onClick={() =>
          startTransition(() => updateOrderStatus(orderId, "confirmed"))
        }
        disabled={pending}
      >
        Confirm
      </Button>

      <Button
        size="sm"
        variant="destructive"
        onClick={() =>
          startTransition(() => updateOrderStatus(orderId, "cancelled"))
        }
        disabled={pending}
      >
        Cancel
      </Button>
    </div>
  );
}
