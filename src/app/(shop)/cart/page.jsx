"use client";

import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Minus, Plus, Trash2 } from "lucide-react";

export default function CartPage() {
  const { cart, increaseQty, decreaseQty, removeFromCart } = useCartStore();

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="container mx-auto py-16 space-y-8">
      <div className="flex items-end justify-between gap-4">
        <h1 className="text-3xl font-bold">Your Cart</h1>
        {cart.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {cart.reduce((s, i) => s + i.quantity, 0)} items
          </div>
        )}
      </div>

      {cart.length === 0 && (
        <Card className="rounded-2xl">
          <CardContent className="p-8 text-center space-y-4">
            <div className="text-muted-foreground">Your cart is empty.</div>
            <Button asChild>
              <Link href="/products">Browse products</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {cart.length > 0 && (
        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          <div className="space-y-4">
            {cart.map((item) => (
              <Card key={item.id} className="rounded-2xl">
                <CardContent className="p-4 flex gap-4">
                  <Link
                    href={`/products/${item.id}`}
                    className="h-24 w-24 rounded-xl overflow-hidden border bg-muted shrink-0"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/products/${item.id}`}
                          className="font-semibold line-clamp-1"
                        >
                          {item.name}
                        </Link>
                        <div className="text-sm text-muted-foreground">
                          ৳ {item.price} each
                        </div>
                      </div>
                      <div className="font-semibold">
                        ৳ {item.price * item.quantity}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() => decreaseQty(item.id)}
                        >
                          <Minus className="size-4" />
                        </Button>
                        <div className="w-10 text-center">{item.quantity}</div>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() => increaseQty(item.id)}
                        >
                          <Plus className="size-4" />
                        </Button>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="size-4" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="rounded-2xl h-fit">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>৳ {subtotal}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Delivery</span>
                <span className="text-muted-foreground">Calculated at checkout</span>
              </div>
              <div className="border-t pt-4 flex items-center justify-between font-semibold">
                <span>Total</span>
                <span>৳ {subtotal}</span>
              </div>

              <Button size="lg" className="w-full" asChild>
                <Link href="/checkout">Proceed to Checkout</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
