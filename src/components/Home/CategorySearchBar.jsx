"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ChevronDown, Search, Menu } from "lucide-react";
import ProductCard from "@/components/ProductCard";

export default function CategorySearchBar() {
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadCategories() {
      const { data } = await supabase.from("products").select("category");
      const list = Array.from(
        new Set((data || []).map((d) => d.category).filter(Boolean))
      ).sort();
      setCategories(list);
    }
    loadCategories();
  }, []);

  async function performSearch() {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("*")
      .ilike("name", `%${query}%`)
      .limit(12);
    setResults(data || []);
    setLoading(false);
  }

  function handleCategoryClick(cat) {
    setQuery(cat);
    setOpen(false);
    setTimeout(() => performSearch(), 0);
  }

  const hasResults = useMemo(() => results.length > 0, [results]);

  return (
    <div className="container mx-auto mt-4 space-y-6">
      <div className="grid grid-cols-[250px_1fr_48px] gap-4">
        <button
          onClick={() => setOpen((o) => !o)}
          className="border rounded-xl h-12 px-4 flex items-center justify-between bg-background"
        >
          <span className="flex items-center gap-2">
            <Menu className="size-4" />
            Categories
          </span>
          <ChevronDown className="size-4" />
        </button>

        <div className="border rounded-xl h-12 px-4 flex items-center bg-background">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Searching for..."
            className="w-full bg-transparent outline-none"
          />
        </div>
        <button
          onClick={performSearch}
          className="border rounded-xl h-12 flex items-center justify-center bg-background"
        >
          <Search className="size-5" />
        </button>
      </div>

      {open && (
        <div className="border rounded-xl p-4 bg-background">
          <div className="grid md:grid-cols-5 gap-3">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => handleCategoryClick(c)}
                className="text-left border rounded-lg px-3 py-2 hover:bg-accent hover:text-accent-foreground"
              >
                {c}
              </button>
            ))}
            {categories.length === 0 && (
              <div className="text-muted-foreground">No categories</div>
            )}
          </div>
        </div>
      )}

      <div className="min-h-0">
        {loading && <div className="text-muted-foreground">Searching...</div>}
        {hasResults && (
          <div className="grid md:grid-cols-4 gap-6">
            {results.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
