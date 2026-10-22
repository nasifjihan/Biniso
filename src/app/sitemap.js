import { getAllProducts } from "@/lib/products";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const revalidate = 3600;

export default async function sitemap() {
  let products = [];
  try {
    products = (await getAllProducts()) || [];
  } catch {
    products = [];
  }

  const staticRoutes = [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/products`, changeFrequency: "daily", priority: 0.9 },
  ];

  const productRoutes = products.map((product) => ({
    url: `${baseUrl}/products/${product.id}`,
    lastModified: product.created_at ? new Date(product.created_at) : undefined,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...productRoutes];
}
