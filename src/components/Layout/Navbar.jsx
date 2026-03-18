"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { useFavoritesStore } from "@/store/favoritesStore";
import ThemeToggle from "../ThemeToggle";
import { Search, Heart, UserRound } from "lucide-react";
import { Button } from "../ui/button";

export default function Navbar() {
  const cart = useCartStore((s) => s.cart);
  const count = cart.reduce((s, i) => s + i.quantity, 0);
  const favoriteCount = useFavoritesStore((s) => s.ids.length);

  return (
    <header className="border-b sticky top-0 bg-background z-50">
      <div className="container mx-auto flex justify-between items-center py-4">
        <Link href="/" className="text-xl font-bold">
          Biniso
        </Link>

        <nav className="flex items-center gap-6">
          <Link href="/">Home</Link>
          <Link href="/products">Products</Link>
          <Link href="/checkout">Checkout</Link>

          <Link href="/cart" className="relative">
            🛒
            {count > 0 && (
              <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs px-2 rounded-full">
                {count}
              </span>
            )}
          </Link>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon">
              <Search className="size-4" />
            </Button>
            <Button variant="outline" size="icon" asChild>
              <Link href="/favorites" className="relative">
                <Heart className="size-4" />
                {favoriteCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] px-1.5 rounded-full">
                    {favoriteCount}
                  </span>
                )}
              </Link>
            </Button>
            <Button variant="outline" size="icon">
              <UserRound className="size-4" />
            </Button>
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}
