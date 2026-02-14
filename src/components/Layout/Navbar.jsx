"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import ThemeToggle from "../ThemeToggle";
import { Search, Heart, UserRound } from "lucide-react";

export default function Navbar() {
  const cart = useCartStore((s) => s.cart);
  const count = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <header className="border-b sticky top-0 bg-background z-50">
      <div className="container mx-auto flex justify-between items-center py-4">
        <Link href="/" className="text-xl font-bold">
          Biniso
        </Link>

        <nav className="flex items-center gap-6">
          <Link href="/">Home</Link>
          <Link href="/products">Products</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/orders">Orders</Link>
          <Link href="/admin">Admin</Link>
          <Link href="/admin/login">Login</Link>
          <Link href="/admin/orders">Orders</Link>
          <Link href="/admin/products">Products</Link>
          <Link href="/cart">Cart</Link>
          <Link href="/checkout">Checkout</Link>
          <Link href="/order-success">Order Success</Link>
          <Link href="/products/1">Product Details</Link>

          {/* Cart */}
          <Link href="/cart" className="relative">
            🛒
            {count > 0 && (
              <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs px-2 rounded-full">
                {count}
              </span>
            )}
          </Link>

          <div className="flex items-center gap-3">
            <button className="size-9 rounded-md border flex items-center justify-center">
              <Search className="size-4" />
            </button>
            <button className="size-9 rounded-md border flex items-center justify-center">
              <Heart className="size-4" />
            </button>
            <button className="size-9 rounded-md border flex items-center justify-center">
              <UserRound className="size-4" />
            </button>
          </div>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
