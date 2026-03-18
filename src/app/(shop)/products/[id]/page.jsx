"use client";

import { useEffect, useMemo, useState } from "react";
import { getProductById } from "@/lib/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Minus, Plus, ShoppingCart } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useFavoritesStore } from "@/store/favoritesStore";
import { toast } from "sonner";

export default function ProductDetails({ params }) {
  const addToCart = useCartStore((s) => s.addToCart);
  const isFavorite = useFavoritesStore((s) => s.isFavorite);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setProduct(null);

    getProductById(params.id)
      .then((p) => {
        if (!active) return;
        setProduct(p);
        setLoading(false);
      })
      .catch((e) => {
        if (!active) return;
        setError(e?.message || "Failed to load product");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [params.id]);

  const favored = useMemo(() => (product ? isFavorite(product.id) : false), [isFavorite, product]);

  if (loading) {
    return (
      <div className="container mx-auto py-16">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto py-16">
        <div className="text-sm text-destructive">{error || "Product not found"}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-16 grid md:grid-cols-2 gap-10">
      <div className="border rounded-2xl overflow-hidden bg-card">
        <img src={product.image} alt={product.name} className="w-full h-[420px] object-cover" />
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
            onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
            type="number"
            min={1}
            className="w-24 text-center"
          />
          <Button variant="outline" size="icon" onClick={() => setQty((q) => q + 1)}>
            <Plus className="size-4" />
          </Button>
        </div>

        <Button
          size="lg"
          onClick={() => {
            addToCart(product, qty);
            toast.success("Added to cart");
          }}
          className="w-full"
        >
          <ShoppingCart className="size-4" />
          Add to cart
        </Button>
      </div>
    </div>
  );
}
