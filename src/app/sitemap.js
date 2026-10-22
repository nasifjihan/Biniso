import { getAllProducts, getCategories } from "@/lib/products";
import { SITE_URL } from "@/lib/seo";

const baseUrl = SITE_URL;

export const revalidate = 3600;

export default async function sitemap() {
  let products = [];
  let categories = [];
  try {
    products = (await getAllProducts()) || [];
    categories = (await getCategories()) || [];
  } catch {
    products = [];
    categories = [];
  }

  const staticRoutes = [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/products`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/track`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/refund-policy`, changeFrequency: "yearly", priority: 0.3 },
  ];

  // A category is a filtered view of the catalog rather than its own route.
  const categoryRoutes = categories.map((category) => ({
    url: `${baseUrl}/products?category=${category.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const productRoutes = products.map((product) => ({
    url: `${baseUrl}/products/${product.id}`,
    lastModified: product.created_at ? new Date(product.created_at) : undefined,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
