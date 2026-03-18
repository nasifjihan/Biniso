"use client";

import { useMemo, useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import ProductItem from "@/components/Admin/ProductItem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
    category: "",
    status: "active",
    featured: false,
    imageFile: null,
  });

  const imagePreview = useMemo(() => {
    if (!form.imageFile) return "";
    return URL.createObjectURL(form.imageFile);
  }, [form.imageFile]);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId) || null,
    [products, selectedProductId],
  );

  useEffect(() => {
    if (!imagePreview) return;
    return () => URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    setError("");
    const { data, error: dbError } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (dbError) {
      setProducts([]);
      setError(dbError.message);
      setLoading(false);
      return;
    }
    setProducts(data || []);
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.imageFile) {
      setError("Please choose an image file.");
      return;
    }

    setSaving(true);
    setError("");
    const formData = new FormData();
    formData.append("file", form.imageFile);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        throw new Error("Image upload failed");
      }
      const { url } = await res.json();

      const { error: insertError } = await supabase.from("products").insert([
        {
          name: form.name.trim(),
          price: Number(form.price),
          description: form.description.trim(),
          category: form.category.trim() || null,
          status: form.status,
          featured: form.featured,
          image: typeof url === "string" ? url.trim() : url,
        },
      ]);
      if (insertError) {
        throw new Error(insertError.message);
      }

      setForm({
        name: "",
        price: "",
        description: "",
        category: "",
        status: "active",
        featured: false,
        imageFile: null,
      });
      await fetchProducts();
    } catch (err) {
      setError(err?.message || "Failed to add product");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-10 space-y-10">
      <h1 className="text-3xl font-bold">Product Management</h1>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Add Product</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Product name"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    value={form.price}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, price: e.target.value }))
                    }
                    placeholder="0"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value }))
                  }
                  placeholder="e.g. Electronics"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Short description"
                  required
                />
              </div>

              <div className="flex items-center justify-between border rounded-lg p-3">
                <Label htmlFor="featured" className="cursor-pointer">
                  Featured Product
                </Label>
                <Switch
                  id="featured"
                  checked={form.featured}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, featured: v }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setForm((f) => ({ ...f, imageFile: e.target.files?.[0] || null }))
                  }
                  required
                />
              </div>

              {error && (
                <div className="text-sm text-destructive border border-destructive/30 bg-destructive/10 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Add Product"}
              </Button>
            </div>

            <div className="space-y-4">
              <div className="border rounded-2xl bg-muted/30 p-4">
                <div className="text-sm font-medium mb-3">Preview</div>
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-56 object-cover rounded-xl"
                  />
                ) : (
                  <div className="w-full h-56 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                    Choose an image
                  </div>
                )}
              </div>
              <div className="border rounded-2xl p-4 space-y-2">
                <div className="font-semibold">{form.name || "Product name"}</div>
                <div className="text-xs text-muted-foreground">
                  {form.category || "Category"}
                </div>
                <div className="text-muted-foreground line-clamp-3">
                  {form.description || "Product description"}
                </div>
                <div className="font-bold text-primary">
                  ৳ {form.price || 0}
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>All Products</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && <div className="text-muted-foreground">Loading...</div>}
          {!loading && products.length === 0 && !error && (
            <div className="text-muted-foreground">No products found.</div>
          )}
          {!loading && products.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <img
                        src={p.image}
                        alt={p.name}
                        className="h-10 w-14 rounded-md object-cover border"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.category || "-"}
                    </TableCell>
                    <TableCell>৳ {p.price}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.status}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.featured ? "Yes" : "No"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedProductId(p.id)}
                      >
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedProduct && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Manage Product</h2>
          <ProductItem
            key={selectedProduct.id}
            product={selectedProduct}
            refresh={fetchProducts}
            initialEditing
          />
        </div>
      )}
    </div>
  );
}
