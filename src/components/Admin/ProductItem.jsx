"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateProduct } from "@/app/actions/updateProduct";
import { deleteProduct } from "@/app/actions/deleteProduct";

export default function ProductItem({ product, refresh }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(product);

  async function handleUpdate() {
    await updateProduct(product.id, form);
    setEditing(false);
    refresh();
  }

  async function handleDelete() {
    if (!confirm("Delete this product?")) return;
    await deleteProduct(product.id);
    refresh();
  }

  return (
    <div className="border p-4 rounded-xl space-y-2">
      <img src={product.image} className="h-40 w-full object-cover rounded" />

      {editing ? (
        <>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border p-1 w-full"
          />
          <input
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="border p-1 w-full"
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="border p-1 w-full"
          />

          <label className="flex gap-2">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
            />
            Featured
          </label>

          <Button size="sm" onClick={handleUpdate}>
            Save
          </Button>
        </>
      ) : (
        <>
          <h3 className="font-semibold">{product.name}</h3>
          <p>৳ {product.price}</p>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing(true)}
            >
              Edit
            </Button>
            <Button size="sm" variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
