"use client";

import { useCartStore } from "@/store/cartStore";
import { createOrder } from "../actions/createOrder";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function CheckoutPage() {
  const cart = useCartStore((s) => s.cart);
  const clearCart = useCartStore((s) => s.clearCart);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);

    const orderId = await createOrder(formData, cart);

    clearCart();
    router.push(`/order-success?order=${orderId}`);
  }

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <div className="container mx-auto py-16 max-w-xl space-y-6">
      <h1 className="text-3xl font-bold">Checkout</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          placeholder="Full Name"
          required
          className="w-full border p-2 rounded"
        />
        <input
          name="phone"
          placeholder="Phone Number"
          required
          className="w-full border p-2 rounded"
        />
        <textarea
          name="address"
          placeholder="Delivery Address"
          required
          className="w-full border p-2 rounded"
        />
        <textarea
          name="notes"
          placeholder="Notes (optional)"
          className="w-full border p-2 rounded"
        />

        <div className="text-lg font-semibold">Total: ৳ {total}</div>

        <Button type="submit" size="lg" className="w-full">
          Place Order (Cash on Delivery)
        </Button>
      </form>
    </div>
  );
}
