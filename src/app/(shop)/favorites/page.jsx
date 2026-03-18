"use client";

import { useEffect, useMemo, useState } from "react";
import { useFavoritesStore } from "@/store/favoritesStore";
import { supabase } from "@/lib/supabaseClient";
import ProductCard from "@/components/ProductCard";

export default function FavoritesPage() {
  const ids = useFavoritesStore((s) => s.ids);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");

  const normalizedIds = useMemo(
    () => Array.from(new Set(ids)).filter((v) => v !== null && v !== undefined),
    [ids],
  );

  useEffect(() => {
    let active = true;
    setError("");

    if (normalizedIds.length === 0) {
      setProducts([]);
      return;
    }

    async function load() {
      setLoading(true);
      const { data, error: dbError } = await supabase
        .from("products")
        .select("*")
        .in("id", normalizedIds);

      if (!active) return;

      if (dbError) {
        setProducts([]);
        setError(dbError.message);
        setLoading(false);
        return;
      }

      const list = (data || []).slice().sort((a, b) => {
        const ai = normalizedIds.indexOf(a.id);
        const bi = normalizedIds.indexOf(b.id);
        return ai - bi;
      });

      setProducts(list);
      setLoading(false);
    }

    load();

    return () => {
      active = false;
    };
  }, [normalizedIds]);

  return (
    <div className="container mx-auto py-16 space-y-8">
      <h1 className="text-3xl font-bold">Favorites</h1>

      {normalizedIds.length === 0 && (
        <div className="text-muted-foreground">No favorites yet.</div>
      )}

      {error && <div className="text-sm text-destructive">{error}</div>}

      {loading && <div className="text-muted-foreground">Loading...</div>}

      {!loading && products.length > 0 && (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

