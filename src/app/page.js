import { getAllProducts } from "@/lib/products";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata = {
  title: "Home - Biniso",
  description: "Check out our featured products and shop easily online.",
  openGraph: {
    title: "Home - Biniso",
    description: "Check out our featured products and shop easily online.",
    url: "https://biniso.com",
  },
};

export default async function HomePage() {
  const products = await getAllProducts();

  return (
    <div className="space-y-20 pb-20">
      {/* HERO BANNER */}
      <section className="bg-muted py-24">
        <div className="container mx-auto text-center space-y-6">
          <h1 className="text-5xl font-bold">
            Premium Products, Trusted Quality
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Discover our best items carefully selected for you.
          </p>
          <Link href="/products">
            <Button size="lg">Shop Now</Button>
          </Link>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="container mx-auto space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">Our Products</h2>
          <p className="text-muted-foreground">Browse our collection</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
