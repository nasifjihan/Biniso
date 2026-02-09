"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { createProduct } from "@/app/actions/createProduct";
import { Button } from "@/components/ui/button";
import { updateProduct } from "@/app/actions/updateProduct";
import { deleteProduct } from "@/app/actions/deleteProduct";
import ProductItem from "@/components/Admin/ProductItem";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    const { data } = await supabase.from("products").select("*");
    setProducts(data);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const file = e.target.image.files[0];

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const { url } = await res.json();

    await createProduct({
      name: e.target.name.value,
      price: e.target.price.value,
      description: e.target.description.value,
      image: url,
      featured: e.target.featured.checked,
    });

    e.target.reset();
    fetchProducts();
  }

  return (
    <div className="p-10 space-y-10">
      <h1 className="text-3xl font-bold">Product Management</h1>

      {/* Add Product */}
      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        <input
          name="name"
          placeholder="Product Name"
          required
          className="w-full border p-2 rounded"
        />
        <input
          name="price"
          type="number"
          placeholder="Price"
          required
          className="w-full border p-2 rounded"
        />
        <textarea
          name="description"
          placeholder="Description"
          required
          className="w-full border p-2 rounded"
        />
        <input name="image" type="file" required />
        <label className="flex items-center gap-2">
          <input type="checkbox" name="featured" />
          Featured Product
        </label>
        <Button>Add Product</Button>
      </form>

      {/* Product List */}
      <div className="grid md:grid-cols-3 gap-6">
        {products.map((p) => (
          <ProductItem key={p.id} product={p} refresh={fetchProducts} />
        ))}
      </div>
    </div>
  );
}
