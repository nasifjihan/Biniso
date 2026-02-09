"use client";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cartStore";
import { toast } from "sonner";

export default function AddToCartButton({ product }) {
  const addToCart = useCartStore((s) => s.addToCart);

  return (
    <Button
      size="lg"
      onClick={() => {
        addToCart(product);
        toast.success("Added to cart");
      }}
    >
      Add to Cart
    </Button>
  );
}
