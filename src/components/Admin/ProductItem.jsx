"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ProductItem({ product, refresh, initialEditing = false }) {
  const [editing, setEditing] = useState(initialEditing);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: product.name || "",
    price: product.price ?? "",
    description: product.description || "",
    category: product.category || "",
    featured: !!product.featured,
    status: product.status || "active",
    image: product.image || "",
  });

  async function handleUpdate() {
    setSaving(true);
    setError("");
    try {
      const update = {
        name: form.name.trim(),
        price: Number(form.price),
        description: form.description.trim(),
        category: form.category.trim() || null,
        featured: form.featured,
        status: form.status,
        image: form.image.trim(),
      };
      const { data: updatedRows, error: updateError } = await supabase
        .from("products")
        .update(update)
        .eq("id", product.id)
        .select("id");
      if (updateError) {
        throw new Error(updateError.message);
      }
      if (!updatedRows || updatedRows.length === 0) {
        throw new Error(
          "No rows were updated. This usually means the row was blocked by RLS policy or the id does not exist.",
        );
      }
      setEditing(false);
      await refresh();
    } catch (err) {
      setError(err?.message || "Failed to update product");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this product?")) return;
    setDeleting(true);
    setError("");
    try {
      const { data: deletedRows, error: deleteError } = await supabase
        .from("products")
        .delete()
        .eq("id", product.id)
        .select("id");
      if (deleteError) {
        throw new Error(deleteError.message);
      }
      if (!deletedRows || deletedRows.length === 0) {
        throw new Error(
          "No rows were deleted. This usually means the row was blocked by RLS policy or the id does not exist.",
        );
      }
      await refresh();
    } catch (err) {
      setError(err?.message || "Failed to delete product");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-4 space-y-4">
        <img
          src={form.image || product.image}
          alt={product.name}
          className="h-40 w-full object-cover rounded-xl border"
        />

        {editing ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Price</Label>
                <Input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
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
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
                placeholder="e.g. Electronics"
              />
            </div>
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input
                value={form.image}
                onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="flex items-center justify-between border rounded-lg p-3">
              <Label className="cursor-pointer">Featured</Label>
              <Switch
                checked={form.featured}
                onCheckedChange={(v) => setForm((f) => ({ ...f, featured: v }))}
              />
            </div>
            {error && (
              <div className="text-sm text-destructive border border-destructive/30 bg-destructive/10 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleUpdate} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditing(false);
                  setError("");
                  setForm({
                    name: product.name || "",
                    price: product.price ?? "",
                    description: product.description || "",
                    category: product.category || "",
                    featured: !!product.featured,
                    status: product.status || "active",
                    image: product.image || "",
                  });
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="font-semibold line-clamp-1">{product.name}</div>
            {product.category && (
              <div className="text-xs text-muted-foreground">{product.category}</div>
            )}
            <div className="text-muted-foreground text-sm line-clamp-2">
              {product.description}
            </div>
            <div className="flex items-center justify-between">
              <div className="font-bold text-primary">৳ {product.price}</div>
              <div className="text-xs text-muted-foreground">{product.status}</div>
            </div>
            {error && (
              <div className="text-sm text-destructive border border-destructive/30 bg-destructive/10 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
