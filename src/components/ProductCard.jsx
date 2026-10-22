"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/store/cartStore";
import { useFavoritesStore } from "@/store/favoritesStore";

export default function ProductCard({ product }) {
  const addToCart = useCartStore((s) => s.addToCart);
  const isFavorite = useFavoritesStore((s) => s.isFavorite);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);

  const favored = isFavorite(product.id);
  // `stock === null` means the product is not stock-tracked.
  const tracked = product.stock !== null && product.stock !== undefined;
  const inStock = !tracked || product.stock > 0;

  return (
    <Card className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="relative">
        <Link href={`/products/${product.id}`} className="block">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              width={600}
              height={600}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="h-56 w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="h-56 w-full bg-muted" />
          )}
        </Link>

        <div className="absolute top-3 right-3">
          <Button
            size="icon"
            variant="secondary"
            className="rounded-full"
            onClick={() => {
              toggleFavorite(product.id);
              toast.success(favored ? "Removed from favorites" : "Added to favorites");
            }}
          >
            <Heart
              className={
                favored
                  ? "size-4 text-rose-600 fill-rose-600"
                  : "size-4 text-muted-foreground"
              }
            />
          </Button>
        </div>

        {!inStock && (
          <div className="absolute top-3 left-3 rounded-full bg-destructive px-3 py-1 text-xs font-medium text-white">
            Out of stock
          </div>
        )}
      </div>

      <CardContent className="px-5 py-4 space-y-3">
        <Link href={`/products/${product.id}`} className="block">
          <div className="font-semibold leading-tight line-clamp-2">
            {product.name}
          </div>
          <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {product.description}
          </div>
        </Link>

        <div className="flex items-center justify-between">
          <div className="text-primary font-bold text-lg">৳ {product.price}</div>
          <Button
            size="sm"
            disabled={!inStock}
            onClick={() => {
              addToCart(product, 1);
              toast.success("Added to cart");
            }}
          >
            <ShoppingCart className="size-4" />
            Add
          </Button>
        </div>

        <Button variant="outline" className="w-full" asChild>
          <Link href={`/products/${product.id}`}>View details</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
