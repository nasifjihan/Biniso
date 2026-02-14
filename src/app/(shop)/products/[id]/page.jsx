import { getProductById } from "@/lib/products";
import { Button } from "@/components/ui/button";
import AddToCartButton from "@/components/AddToCartButton";

export default async function ProductDetails({ params }) {
  const product = await getProductById(params.id);

  return (
    <div className="container mx-auto py-16 grid md:grid-cols-2 gap-10">
      <img
        src={product.image}
        alt={product.name}
        className="rounded-2xl w-full"
      />

      <div className="space-y-4">
        <h1 className="text-3xl font-bold">{product.name}</h1>
        <p className="text-muted-foreground">{product.description}</p>

        <div className="text-2xl font-bold text-primary">৳ {product.price}</div>

        <AddToCartButton product={product} />
      </div>
    </div>
  );
}
