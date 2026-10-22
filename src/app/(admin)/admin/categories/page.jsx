"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { createCategory } from "@/app/actions/createCategory";
import { updateCategory } from "@/app/actions/updateCategory";
import { deleteCategory } from "@/app/actions/deleteCategory";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    setError("");
    const { data, error: dbError } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (dbError) {
      setCategories([]);
      setError(dbError.message);
      setLoading(false);
      return;
    }
    setCategories(data || []);
    setLoading(false);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      const result = await createCategory(name);
      if (!result?.ok) {
        throw new Error(result?.error || "Failed to add category");
      }
      setName("");
      await fetchCategories();
    } catch (err) {
      setError(err?.message || "Failed to add category");
    }
  }

  async function handleRename(id) {
    setError("");
    try {
      const result = await updateCategory(id, editingName);
      if (!result?.ok) {
        throw new Error(result?.error || "Failed to rename category");
      }
      setEditingId("");
      setEditingName("");
      await fetchCategories();
    } catch (err) {
      setError(err?.message || "Failed to rename category");
    }
  }

  async function handleDelete(category) {
    if (
      !confirm(
        `Delete "${category.name}"? Products in it stay, but become uncategorised.`,
      )
    ) {
      return;
    }

    setError("");
    try {
      const result = await deleteCategory(category.id);
      if (!result?.ok) {
        throw new Error(result?.error || "Failed to delete category");
      }
      await fetchCategories();
    } catch (err) {
      setError(err?.message || "Failed to delete category");
    }
  }

  return (
    <div className="p-10 space-y-10">
      <h1 className="text-3xl font-bold">Categories</h1>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Add Category</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex items-end gap-4">
            <div className="space-y-2 flex-1 max-w-sm">
              <Label htmlFor="category-name">Name</Label>
              <Input
                id="category-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Electronics"
                required
              />
            </div>
            <Button type="submit">Add Category</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="text-sm text-destructive border border-destructive/30 bg-destructive/10 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          {loading && <div className="text-muted-foreground">Loading...</div>}
          {!loading && categories.length === 0 && (
            <div className="text-muted-foreground">No categories yet.</div>
          )}
          {!loading && categories.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      {editingId === c.id ? (
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                        />
                      ) : (
                        c.name
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.slug}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {editingId === c.id ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleRename(c.id)}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingId("");
                              setEditingName("");
                            }}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingId(c.id);
                              setEditingName(c.name);
                              setError("");
                            }}
                          >
                            Rename
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(c)}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
