"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Minus, Plus, ShoppingCart } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useFavoritesStore } from "@/store/favoritesStore";
import { toast } from "sonner";

export default function ProductDetail({ product }) {
  const addToCart = useCartStore((s) => s.addToCart);
  const isFavorite = useFavoritesStore((s) => s.isFavorite);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);

  const [qty, setQty] = useState(1);

  const favored = useMemo(() => isFavorite(product.id), [isFavorite, product.id]);

  // `stock === null` means the product is not stock-tracked.
  const tracked = product.stock !== null && product.stock !== undefined;
  const inStock = !tracked || product.stock > 0;
  const maxQty = tracked ? Math.max(1, product.stock) : undefined;

  return (
    <div className="container mx-auto py-16 grid md:grid-cols-2 gap-10">
      <div className="border rounded-2xl overflow-hidden bg-card">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            width={1200}
            height={1200}
            sizes="(max-width: 768px) 100vw, 50vw"
            className="w-full h-[420px] object-cover"
          />
        ) : (
          <div className="w-full h-[420px] bg-muted" />
        )}
      </div>

      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold leading-tight">{product.name}</h1>
          <Button
            size="icon"
            variant="outline"
            className="rounded-full"
            onClick={() => {
              toggleFavorite(product.id);
              toast.success(favored ? "Removed from favorites" : "Added to favorites");
            }}
          >
            <Heart className={favored ? "size-4 text-rose-600 fill-rose-600" : "size-4"} />
          </Button>
        </div>

        <p className="text-muted-foreground">{product.description}</p>

        <div className="text-3xl font-bold text-primary">৳ {product.price}</div>

        {tracked && (
          <div
            className={
              inStock
                ? "text-sm text-muted-foreground"
                : "text-sm font-medium text-destructive"
            }
          >
            {inStock ? `${product.stock} in stock` : "Out of stock"}
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
          >
            <Minus className="size-4" />
          </Button>
          <Input
            value={qty}
            onChange={(e) =>
              setQty(
                Math.max(
                  1,
                  Math.min(Number(e.target.value) || 1, maxQty ?? Infinity),
                ),
              )
            }
            type="number"
            min={1}
            max={maxQty}
            className="w-24 text-center"
          />
          <Button
            variant="outline"
            size="icon"
            disabled={tracked && qty >= product.stock}
            onClick={() => setQty((q) => Math.min(q + 1, maxQty ?? q + 1))}
          >
            <Plus className="size-4" />
          </Button>
        </div>

        <Button
          size="lg"
          disabled={!inStock}
          onClick={() => {
            addToCart(product, qty);
            toast.success("Added to cart");
          }}
          className="w-full"
        >
          <ShoppingCart className="size-4" />
          {inStock ? "Add to cart" : "Out of stock"}
        </Button>
      </div>
    </div>
  );
}
