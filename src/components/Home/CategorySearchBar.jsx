"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { ChevronDown, Search, Menu } from "lucide-react";

export default function CategorySearchBar() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function loadCategories() {
      const { data } = await supabase
        .from("categories")
        .select("id, name, slug")
        .order("name", { ascending: true });
      setCategories(data || []);
    }
    loadCategories();
  }, []);

  function handleSearch() {
    const term = query.trim();
    router.push(term ? `/search?q=${encodeURIComponent(term)}` : "/search");
  }

  function handleCategoryClick(cat) {
    setOpen(false);
    router.push(`/products?category=${encodeURIComponent(cat.slug)}`);
  }

  return (
    <div className="container mx-auto mt-4">
      <form
        className="grid grid-cols-[250px_1fr_48px] gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
      >
        <button
          type="button"
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
          type="submit"
          className="border rounded-xl h-12 flex items-center justify-center bg-background"
        >
          <Search className="size-5" />
        </button>
      </form>

      {open && (
        <div className="mt-4 border rounded-xl p-4 bg-background">
          <div className="grid md:grid-cols-5 gap-3">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => handleCategoryClick(c)}
                className="text-left border rounded-lg px-3 py-2 hover:bg-accent hover:text-accent-foreground"
              >
                {c.name}
              </button>
            ))}
            {categories.length === 0 && (
              <div className="text-muted-foreground">No categories</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
