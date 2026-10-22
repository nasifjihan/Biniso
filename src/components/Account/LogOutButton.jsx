"use client";

import { useFavoritesStore } from "@/store/favoritesStore";
import { Button } from "@/components/ui/button";

/** Log-out submit button that drops the local wishlist on the way out. */
export default function LogOutButton() {
  const clearFavorites = useFavoritesStore((s) => s.clearFavorites);

  // The wishlist is in the account now, so the local copy is only cache. This
  // runs before the form submits, which keeps one customer's favorites off the
  // screen for the next person on the same device. They come back on login.
  return (
    <Button variant="destructive" onClick={() => clearFavorites()}>
      Log out
    </Button>
  );
}
