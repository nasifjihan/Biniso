import Link from "next/link";
import { getCategories, getProductPage, PRODUCT_SORTS } from "@/lib/products";
import ProductCard from "@/components/ProductCard";
import ProductFilters from "@/components/ProductFilters";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "All Products - Biniso",
  description: "Browse our complete collection of premium products online.",
};

const PER_PAGE = 12;

function toPrice(value) {
  if (typeof value !== "string" || value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export default async function ProductsPage({ searchParams }) {
  const params = await searchParams;

  const categorySlug = typeof params.category === "string" ? params.category : "";
  const sortKey =
    typeof params.sort === "string" && PRODUCT_SORTS[params.sort]
      ? params.sort
      : "newest";
  const minPrice = toPrice(params.min);
  const maxPrice = toPrice(params.max);
  const inStockOnly = params.stock === "in";
  const page = Math.max(1, Number.parseInt(params.page, 10) || 1);

  const categories = await getCategories();
  const activeCategory =
    categories.find((c) => c.slug === categorySlug) || null;

  const { items, total, pageCount } = await getProductPage({
    categoryId: activeCategory?.id,
    minPrice,
    maxPrice,
    inStockOnly,
    sort: sortKey,
    page,
    perPage: PER_PAGE,
  });

  // Active filters, serialised once for the filter bar and pagination links.
  const filterQuery = new URLSearchParams();
  if (categorySlug) filterQuery.set("category", categorySlug);
  if (typeof params.min === "string" && params.min) filterQuery.set("min", params.min);
  if (typeof params.max === "string" && params.max) filterQuery.set("max", params.max);
  if (inStockOnly) filterQuery.set("stock", "in");
  if (sortKey !== "newest") filterQuery.set("sort", sortKey);

  // Pagination links keep whatever filters are active.
  const pageHref = (target) => {
    const query = new URLSearchParams(filterQuery);
    if (target > 1) query.set("page", String(target));

    const qs = query.toString();
    return qs ? `/products?${qs}` : "/products";
  };

  const first = total === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const last = Math.min(page * PER_PAGE, total);

  return (
    <div className="container mx-auto py-16 space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">
          {activeCategory ? activeCategory.name : "All Products"}
        </h1>
        <p className="text-muted-foreground">
          {total === 0
            ? "No products found"
            : `Showing ${first}–${last} of ${total}`}
        </p>
      </div>

      <ProductFilters
        categories={categories}
        sorts={Object.entries(PRODUCT_SORTS).map(([value, sort]) => ({
          value,
          label: sort.label,
        }))}
        values={{
          category: categorySlug,
          min: typeof params.min === "string" ? params.min : "",
          max: typeof params.max === "string" ? params.max : "",
          inStockOnly,
          sort: sortKey,
        }}
        query={filterQuery.toString()}
      />

      {items.length === 0 ? (
        <div className="rounded-2xl border p-10 text-center space-y-4">
          <div className="text-muted-foreground">
            No products match these filters.
          </div>
          <Button variant="outline" asChild>
            <Link href="/products">Clear filters</Link>
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
