"use client";
import { useCartStore } from "@/store/cartStore";
import Link from "next/link";

export function CartIcon() {
  const cart = useCartStore((s) => s.cart);
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Link href="/cart" className="relative">
      🛒
      {count > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 rounded-full">
          {count}
        </span>
      )}
    </Link>
  );
}
