"use client";

import { useEffect, useRef } from "react";
import { useFavoritesStore } from "@/store/favoritesStore";
import { supabase } from "@/lib/supabaseClient";
import { loadFavorites } from "@/app/actions/loadFavorites";
import { pushFavorites } from "@/app/actions/pushFavorites";
import { toast } from "sonner";

/**
 * Mirrors the wishlist into the signed-in customer's account. Guests keep the
 * localStorage-only behaviour they always had, so nothing changes until someone
 * logs in; from then on the account list is the truth and every change is
 * written back to it.
 *
 * Renders nothing — it is mounted once in the shop layout purely for its effect.
 */
export default function FavoritesSync() {
  const ids = useFavoritesStore((s) => s.ids);
  const setIds = useFavoritesStore((s) => s.setIds);
  // Only the initial merge may write; later changes go through the effect below.
  const ready = useRef(false);

  useEffect(() => {
    let active = true;

    async function start() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active || !user) return;

      const remote = await loadFavorites();
      if (!active) return;

      // Whatever this browser had before logging in is kept: the guest list and
      // the account list are merged, so signing in never loses a favorite.
      const local = useFavoritesStore.getState().ids;
      const merged = remote.ok
        ? Array.from(new Set([...remote.ids, ...local]))
        : local;

      setIds(merged);

      const res = await pushFavorites(merged);
      ready.current = true;

      if (!res?.ok) toast.error(res?.error || "Could not sync your wishlist");
    }

    start();
    return () => {
      active = false;
    };
  }, [setIds]);

  useEffect(() => {
    // The first render and the merge above both run with this false, so the
    // account is not written to before the merge has been pushed.
    if (!ready.current) return;

    let active = true;

    pushFavorites(ids).then((res) => {
      if (active && !res?.ok) {
        toast.error(res?.error || "Could not save your wishlist");
      }
    });

    return () => {
      active = false;
    };
  }, [ids]);

  return null;
}
