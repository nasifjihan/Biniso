"use client";

import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CartPage() {
  const { cart, increaseQty, decreaseQty, removeFromCart } = useCartStore();

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="container mx-auto py-16 space-y-8">
      <h1 className="text-3xl font-bold">Your Cart</h1>

      {cart.length === 0 && <p>Your cart is empty.</p>}

      {cart.map((item) => (
        <div
          key={item.id}
          className="flex justify-between items-center border p-4 rounded-xl"
        >
          <div>
            <h3 className="font-semibold">{item.name}</h3>
            <p>৳ {item.price}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => decreaseQty(item.id)}>
              -
            </Button>
            <span>{item.quantity}</span>
            <Button size="sm" onClick={() => increaseQty(item.id)}>
              +
            </Button>
          </div>

          <Button
            size="sm"
            variant="destructive"
            onClick={() => removeFromCart(item.id)}
          >
            Remove
          </Button>
        </div>
      ))}

      {cart.length > 0 && (
        <div className="text-right space-y-4">
          <div className="text-xl font-bold">Total: ৳ {total}</div>
          <Link href="/checkout">
            <Button size="lg">Proceed to Checkout</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
