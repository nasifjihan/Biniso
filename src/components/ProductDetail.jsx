"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Minus, Plus, ShoppingCart } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCartStore } from "@/store/cartStore";
import { useFavoritesStore } from "@/store/favoritesStore";
import { toast } from "sonner";
import {
  attributeKeys,
  attributeValues,
  findVariant,
  isInStock,
  variantLabel,
} from "@/lib/variants";

export default function ProductDetail({ product }) {
  const addToCart = useCartStore((s) => s.addToCart);
  const isFavorite = useFavoritesStore((s) => s.isFavorite);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);

  const variants = useMemo(() => product.product_variants || [], [product]);
  const optionKeys = useMemo(() => attributeKeys(variants), [variants]);

  // `products.image` is the card thumbnail and stays first in the gallery.
  const images = useMemo(() => {
    const primary = product.image ? [product.image] : [];
    const extra = [...(product.product_images || [])]
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map((image) => image.url);
    return [...primary, ...extra].filter(
      (url, index, all) => url && all.indexOf(url) === index,
    );
  }, [product]);

  const [activeImage, setActiveImage] = useState(0);

  // Preselect the first buyable combination so the page is usable immediately.
  const defaultSelection = useMemo(() => {
    if (variants.length === 0) return {};
    const first = variants.find((v) => isInStock(v.stock)) || variants[0];
    return first.attributes || {};
  }, [variants]);

  const [selection, setSelection] = useState(defaultSelection);
  const [qty, setQty] = useState(1);

  const favored = useMemo(() => isFavorite(product.id), [isFavorite, product.id]);

  const selectedVariant =
    variants.length > 0 ? findVariant(variants, selection) : null;
  const needsSelection = variants.length > 0 && !selectedVariant;

  const unitPrice =
    selectedVariant?.price != null
      ? Number(selectedVariant.price)
      : Number(product.price);

  // A product with variants tracks stock per variant and ignores products.stock.
  const stock = variants.length > 0 ? selectedVariant?.stock : product.stock;
  const tracked = stock !== null && stock !== undefined;
  const inStock = !tracked || stock > 0;
  const maxQty = tracked ? Math.max(1, stock) : undefined;
  const canAdd = inStock && !needsSelection;

  return (
    <div className="container mx-auto py-16 grid md:grid-cols-2 gap-10">
      <div className="space-y-3">
        <div className="border rounded-2xl overflow-hidden bg-card">
          {images[activeImage] ? (
            <Image
              src={images[activeImage]}
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

        {images.length > 1 && (
          <div className="flex flex-wrap gap-3">
            {images.map((url, index) => (
              <button
                key={url}
                type="button"
                onClick={() => setActiveImage(index)}
                aria-label={`Show image ${index + 1}`}
                className={
                  index === activeImage
                    ? "h-20 w-20 rounded-xl overflow-hidden border-2 border-primary"
                    : "h-20 w-20 rounded-xl overflow-hidden border-2 border-transparent"
                }
              >
                <Image
                  src={url}
                  alt=""
                  width={160}
                  height={160}
                  sizes="80px"
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
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

        <div className="text-3xl font-bold text-primary">৳ {unitPrice}</div>

        {optionKeys.length > 0 && (
          <div className="space-y-3">
            {optionKeys.map((key) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={`option-${key}`}>{key}</Label>
                <Select
                  value={selection[key] ?? ""}
                  onValueChange={(value) => {
                    setSelection((s) => ({ ...s, [key]: value }));
                    setQty(1);
                  }}
                >
                  <SelectTrigger id={`option-${key}`} className="w-full">
                    <SelectValue placeholder={`Choose ${key}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {attributeValues(variants, key).map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}

        {needsSelection ? (
          <div className="text-sm font-medium text-destructive">
            This combination is unavailable. Try another option.
          </div>
        ) : (
          tracked && (
            <div
              className={
                inStock
                  ? "text-sm text-muted-foreground"
                  : "text-sm font-medium text-destructive"
              }
            >
              {inStock ? `${stock} in stock` : "Out of stock"}
            </div>
          )
        )}

        {selectedVariant && variants.length > 0 && (
          <div className="text-sm text-muted-foreground">
            Selected: {variantLabel(selectedVariant)}
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
            disabled={tracked && qty >= stock}
            onClick={() => setQty((q) => Math.min(q + 1, maxQty ?? q + 1))}
          >
            <Plus className="size-4" />
          </Button>
        </div>

        <Button
          size="lg"
          disabled={!canAdd}
          onClick={() => {
            addToCart(
              {
                id: product.id,
                name: product.name,
                price: unitPrice,
                image: product.image,
                variantId: selectedVariant?.id ?? null,
                variantLabel: selectedVariant
                  ? variantLabel(selectedVariant)
                  : null,
              },
              qty,
            );
            toast.success("Added to cart");
          }}
          className="w-full"
        >
          <ShoppingCart className="size-4" />
          {!inStock
            ? "Out of stock"
            : needsSelection
              ? "Choose options"
              : "Add to cart"}
        </Button>
      </div>
    </div>
  );
}
