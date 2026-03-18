"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SuccessPage() {
  const params = useSearchParams();
  const orderId = params.get("order");
  const subtotal = params.get("subtotal");
  const deliveryFee = params.get("delivery_fee");
  const total = params.get("total");
  const deliveryMethod = params.get("delivery_method");

  return (
    <div className="container mx-auto py-16 max-w-2xl">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-center text-3xl">
            Order Successful
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center text-muted-foreground">
            We will contact you soon.
          </div>

          <div className="border rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Order ID</span>
              <span className="font-medium">{orderId || "-"}</span>
            </div>
            {subtotal && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>৳ {subtotal}</span>
              </div>
            )}
            {deliveryMethod && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Delivery</span>
                <span className="capitalize">{deliveryMethod.replaceAll("_", " ")}</span>
              </div>
            )}
            {deliveryFee && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Delivery fee</span>
                <span>৳ {deliveryFee}</span>
              </div>
            )}
            {total && (
              <div className="border-t pt-3 flex items-center justify-between font-semibold">
                <span>Total</span>
                <span>৳ {total}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button className="flex-1" asChild>
              <Link href="/products">Continue Shopping</Link>
            </Button>
            <Button className="flex-1" variant="outline" asChild>
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
