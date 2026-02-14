import { getAllProducts } from "@/lib/products";
import ProductCard from "@/components/ProductCard";

export const metadata = {
  title: "All Products - Biniso",
  description: "Browse our complete collection of premium products online.",
};

export default async function ProductsPage() {
  const products = await getAllProducts();

  return (
    <div className="container mx-auto py-16 space-y-8">
      <h1 className="text-3xl font-bold text-center">All Products</h1>

      <div className="grid md:grid-cols-4 gap-6">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
