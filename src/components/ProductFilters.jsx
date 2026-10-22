"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Radix Select cannot use an empty string as an item value.
const ALL_CATEGORIES = "__all__";

export default function ProductFilters({ categories, sorts, values, query = "" }) {
  const router = useRouter();
  const pathname = usePathname();
  // Price boxes are applied on submit, so they need local draft state.
  const [min, setMin] = useState(values.min);
  const [max, setMax] = useState(values.max);

  function apply(next) {
    const params = new URLSearchParams(query);

    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }

    // Any filter change restarts the catalog from the first page.
    params.delete("page");

    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  // Clearing drops this bar's own parameters but keeps the rest of the URL,
  // so a search results page stays on its query.
  function clearFilters() {
    setMin("");
    setMax("");
    apply({ category: "", min: "", max: "", stock: "", sort: "newest" });
  }

  const hasFilters = Boolean(
    values.category || values.min || values.max || values.inStockOnly || values.sort !== "newest",
  );

  return (
    <div className="rounded-2xl border p-4 flex flex-wrap items-end gap-4">
      <div className="space-y-2 min-w-48">
        <Label>Category</Label>
        <Select
          value={values.category || ALL_CATEGORIES}
          onValueChange={(v) =>
            apply({ category: v === ALL_CATEGORIES ? "" : v })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.slug}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          apply({ min, max });
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="min-price">Min ৳</Label>
          <Input
            id="min-price"
            value={min}
            inputMode="numeric"
            className="w-24"
            onChange={(e) => setMin(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max-price">Max ৳</Label>
          <Input
            id="max-price"
            value={max}
            inputMode="numeric"
            className="w-24"
            onChange={(e) => setMax(e.target.value)}
          />
        </div>
        <Button type="submit" variant="outline">
          Apply
        </Button>
      </form>

      <div className="space-y-2 min-w-44">
        <Label>Sort by</Label>
        <Select value={values.sort} onValueChange={(v) => apply({ sort: v })}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sorts.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex h-9 items-center gap-2 rounded-md border px-3">
        <input
          id="in-stock"
          type="checkbox"
          className="size-4"
          checked={values.inStockOnly}
          onChange={(e) => apply({ stock: e.target.checked ? "in" : "" })}
        />
        <Label htmlFor="in-stock" className="cursor-pointer">
          Hide out of stock
        </Label>
      </div>

      {hasFilters && (
        <Button type="button" variant="ghost" onClick={clearFilters}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
