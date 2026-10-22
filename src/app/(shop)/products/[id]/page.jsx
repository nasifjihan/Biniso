import { cache } from "react";
import { notFound } from "next/navigation";
import ProductDetail from "@/components/ProductDetail";
import JsonLd from "@/components/JsonLd";
import { getProductById } from "@/lib/products";
import { breadcrumbJsonLd, pageMetadata, productJsonLd } from "@/lib/seo";

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
    return { title: "Product not found", robots: { index: false } };
  }

  const description =
    product.description?.trim() || `Buy ${product.name} online at Biniso.`;
  const images = product.product_images
    ?.map((image) => image.url)
    .filter(Boolean)
    .slice(0, 4);

  return pageMetadata({
    title: product.name,
    description,
    path: `/products/${product.id}`,
    images: images?.length ? images : product.image ? [product.image] : undefined,
  });
}

export default async function ProductPage({ params }) {
  const { id } = await params;
  const product = await loadProduct(id);

  if (!product) notFound();

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "All Products", path: "/products" },
  ];
  if (product.category?.name) {
    crumbs.push({
      name: product.category.name,
      path: `/products?category=${product.category.slug}`,
    });
  }
  crumbs.push({ name: product.name, path: `/products/${product.id}` });

  return (
    <>
      <JsonLd data={productJsonLd(product)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <ProductDetail product={product} />
    </>
  );
}
