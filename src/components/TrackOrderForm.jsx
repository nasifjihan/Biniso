"use client";

import { useState } from "react";
import { lookupOrder } from "@/app/actions/lookupOrder";
import { STATUS_NOTES, orderStatusVariant } from "@/lib/orderStatus";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function TrackOrderForm({ defaultOrderId = "" }) {
  const [orderId, setOrderId] = useState(defaultOrderId);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOrder(null);

    const res = await lookupOrder({ orderId, phone });
    setLoading(false);

    if (!res?.ok) {
      setError(res?.error || "Could not look that order up");
      return;
    }

    setOrder(res.order);
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Order details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orderId">Order ID</Label>
              <Input
                id="orderId"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="00000000-0000-0000-0000-000000000000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                required
              />
            </div>

            {error && (
              <div className="text-sm text-destructive border border-destructive/30 bg-destructive/10 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <Button className="w-full" disabled={loading}>
              {loading ? "Checking..." : "Track order"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {order && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Order status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Order ID</span>
              <span className="font-medium break-all text-right">{order.id}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={orderStatusVariant(order.status)}>
                {order.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Placed</span>
              <span>
                {new Date(order.created_at).toLocaleString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Total</span>
              <span className="font-medium">৳ {order.total}</span>
            </div>
            <p className="text-muted-foreground pt-1">
              {STATUS_NOTES[order.status] || ""}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
