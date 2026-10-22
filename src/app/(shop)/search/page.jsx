import Link from "next/link";
import { getCategories, getProductPage, PRODUCT_SORTS } from "@/lib/products";
import ProductCard from "@/components/ProductCard";
import ProductFilters from "@/components/ProductFilters";
import { Button } from "@/components/ui/button";
import { pageMetadata } from "@/lib/seo";
import { Search } from "lucide-react";

export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim() : "";

  return {
    ...pageMetadata({
      title: query ? `Search: ${query}` : "Search",
      description: "Search the Biniso catalog and filter the results.",
      path: "/search",
    }),
    // Results change with every query, so they are kept out of the index.
    robots: { index: false, follow: true },
  };
}

const PER_PAGE = 12;

function toPrice(value) {
  if (typeof value !== "string" || value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export default async function SearchPage({ searchParams }) {
  const params = await searchParams;

  const query = typeof params.q === "string" ? params.q : "";
  const categorySlug = typeof params.category === "string" ? params.category : "";
  const sortKey =
    typeof params.sort === "string" && PRODUCT_SORTS[params.sort]
      ? params.sort
      : "newest";
  const minValue = typeof params.min === "string" ? params.min : "";
  const maxValue = typeof params.max === "string" ? params.max : "";
  const inStockOnly = params.stock === "in";
  const page = Math.max(1, Number.parseInt(params.page, 10) || 1);

  const categories = await getCategories();
  const activeCategory =
    categories.find((c) => c.slug === categorySlug) || null;

  const { items, total, pageCount } = await getProductPage({
    search: query,
    categoryId: activeCategory?.id,
    minPrice: toPrice(minValue),
    maxPrice: toPrice(maxValue),
    inStockOnly,
    sort: sortKey,
    page,
    perPage: PER_PAGE,
  });

  // Active filters, serialised once for the filter bar and pagination links.
  const filterQuery = new URLSearchParams();
  if (query) filterQuery.set("q", query);
  if (categorySlug) filterQuery.set("category", categorySlug);
  if (minValue) filterQuery.set("min", minValue);
  if (maxValue) filterQuery.set("max", maxValue);
  if (inStockOnly) filterQuery.set("stock", "in");
  if (sortKey !== "newest") filterQuery.set("sort", sortKey);

  // Pagination links keep whatever filters are active.
  const pageHref = (target) => {
    const next = new URLSearchParams(filterQuery);
    if (target > 1) next.set("page", String(target));

    const qs = next.toString();
    return qs ? `/search?${qs}` : "/search";
  };

  const first = total === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const last = Math.min(page * PER_PAGE, total);

  return (
    <div className="container mx-auto py-16 space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">
          {query ? `Results for “${query}”` : "Search"}
        </h1>
        <p className="text-muted-foreground">
          {query
            ? total === 0
              ? "No products found"
              : `Showing ${first}–${last} of ${total}`
            : "Type a product name to search the catalog"}
        </p>
      </div>

      <form action="/search" className="mx-auto flex max-w-xl gap-2">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Searching for..."
          aria-label="Search products"
          className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:border-ring"
        />
        {/* Submitting the box keeps the filters that are already applied. */}
        {categorySlug && <input type="hidden" name="category" value={categorySlug} />}
        {minValue && <input type="hidden" name="min" value={minValue} />}
        {maxValue && <input type="hidden" name="max" value={maxValue} />}
        {inStockOnly && <input type="hidden" name="stock" value="in" />}
        {sortKey !== "newest" && <input type="hidden" name="sort" value={sortKey} />}
        <Button type="submit">
          <Search className="size-4" />
          Search
        </Button>
      </form>

      <ProductFilters
        categories={categories}
        sorts={Object.entries(PRODUCT_SORTS).map(([value, sort]) => ({
          value,
          label: sort.label,
        }))}
        values={{
          category: categorySlug,
          min: minValue,
          max: maxValue,
          inStockOnly,
          sort: sortKey,
        }}
        query={filterQuery.toString()}
      />

      {items.length === 0 ? (
        <div className="rounded-2xl border p-10 text-center space-y-4">
          <div className="text-muted-foreground">
            {query
              ? "No products match this search."
              : "No products match these filters."}
          </div>
          <Button variant="outline" asChild>
            <Link href="/products">Browse all products</Link>
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-4 gap-6">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-4">
          {page > 1 ? (
            <Button variant="outline" asChild>
              <Link href={pageHref(page - 1)}>Previous</Link>
            </Button>
          ) : (
            <Button variant="outline" disabled>
              Previous
            </Button>
          )}

          <div className="text-sm text-muted-foreground">
            Page {page} of {pageCount}
          </div>

          {page < pageCount ? (
            <Button variant="outline" asChild>
              <Link href={pageHref(page + 1)}>Next</Link>
            </Button>
          ) : (
            <Button variant="outline" disabled>
              Next
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
