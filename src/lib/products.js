import { supabase } from "@/lib/supabase";

export async function getCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("name", { ascending: true });

  if (error) throw error;
  return data || [];
}

// Sort keys offered by the catalog, mapped to their database column.
export const PRODUCT_SORTS = {
  newest: { column: "created_at", ascending: false, label: "Newest" },
  "price-asc": { column: "price", ascending: true, label: "Price: low to high" },
  "price-desc": { column: "price", ascending: false, label: "Price: high to low" },
  "name-asc": { column: "name", ascending: true, label: "Name: A to Z" },
};

/**
 * One page of the public catalog with its filters applied server-side, so the
 * browser never downloads the whole table.
 */
export async function getProductPage({
  categoryId,
  minPrice,
  maxPrice,
  inStockOnly = false,
  sort = "newest",
  page = 1,
  perPage = 12,
} = {}) {
  const from = (page - 1) * perPage;

  let request = supabase
    .from("products")
    .select("*, category:categories(id, name, slug)", { count: "exact" })
    .eq("status", "active");

  if (categoryId) request = request.eq("category_id", categoryId);
  if (minPrice !== null && minPrice !== undefined) {
    request = request.gte("price", minPrice);
  }
  if (maxPrice !== null && maxPrice !== undefined) {
    request = request.lte("price", maxPrice);
  }
  // `stock === null` means "not tracked", so those products are always available.
  if (inStockOnly) request = request.or("stock.is.null,stock.gt.0");

  const { column, ascending } = PRODUCT_SORTS[sort] || PRODUCT_SORTS.newest;

  const { data, count, error } = await request
    .order(column, { ascending })
    .range(from, from + perPage - 1);

  if (error) throw error;

  const total = count ?? 0;

  return {
    items: data || [],
    total,
    page,
    perPage,
    pageCount: Math.max(1, Math.ceil(total / perPage)),
  };
}

export async function getAllProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getFeaturedProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("featured", true)
    .eq("status", "active");

  if (error) throw error;
  return data;
}

export async function getProductById(id) {
  const { data, error } = await supabase
    .from("products")
    .select(
      "*, category:categories(id, name, slug), product_variants(id, attributes, sku, price, stock, created_at), product_images(id, url, position)",
    )
    .eq("id", id)
    .order("created_at", { referencedTable: "product_variants", ascending: true })
    .single();

  if (error) throw error;
  return data;
}
