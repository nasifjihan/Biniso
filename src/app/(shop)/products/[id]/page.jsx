import { cache } from "react";
import { notFound } from "next/navigation";
import ProductDetail from "@/components/ProductDetail";
import { getProductById } from "@/lib/products";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// cache() dedupes the query between generateMetadata and the page render.
const loadProduct = cache(async (id) => {
  try {
    return await getProductById(id);
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await loadProduct(id);

  if (!product) {
    return { title: "Product not found | Biniso" };
  }

  const description =
    product.description?.trim() || `Buy ${product.name} online at Biniso.`;
  const images = product.image ? [product.image] : undefined;

  return {
    title: `${product.name} | Biniso`,
    description,
    alternates: { canonical: `${baseUrl}/products/${id}` },
    openGraph: {
      title: product.name,
      description,
      url: `${baseUrl}/products/${id}`,
      type: "website",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images,
    },
  };
}

export default async function ProductPage({ params }) {
  const { id } = await params;
  const product = await loadProduct(id);

  if (!product) notFound();

  return <ProductDetail product={product} />;
}
