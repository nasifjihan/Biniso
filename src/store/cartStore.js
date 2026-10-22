import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * A cart line is identified by the product plus its variant, so two variants of
 * the same product stay separate rows instead of merging quantities.
 */
export const lineKey = (item) => `${item?.id ?? ""}::${item?.variantId ?? ""}`;

export const useCartStore = create(
  persist(
    (set) => ({
      cart: [],

      addToCart: (product, qty = 1) =>
        set((state) => {
          const safeQty = Math.max(1, Number(qty) || 1);
          const key = lineKey(product);
          const existing = state.cart.find((item) => lineKey(item) === key);

          if (existing) {
            return {
              cart: state.cart.map((item) =>
                lineKey(item) === key
                  ? { ...item, quantity: item.quantity + safeQty }
                  : item,
              ),
            };
          }

          return {
            cart: [...state.cart, { ...product, quantity: safeQty }],
          };
        }),

      removeFromCart: (key) =>
        set((state) => ({
          cart: state.cart.filter((item) => lineKey(item) !== key),
        })),

      increaseQty: (key) =>
        set((state) => ({
          cart: state.cart.map((item) =>
            lineKey(item) === key ? { ...item, quantity: item.quantity + 1 } : item,
          ),
        })),

      decreaseQty: (key) =>
        set((state) => ({
          cart: state.cart
            .map((item) =>
              lineKey(item) === key
                ? { ...item, quantity: item.quantity - 1 }
                : item,
            )
            .filter((item) => item.quantity > 0),
        })),

      clearCart: () => set({ cart: [] }),
    }),
    {
      name: "biniso:cart",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
