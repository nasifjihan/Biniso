"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { createProductImage } from "@/app/actions/createProductImage";
import { deleteProductImage } from "@/app/actions/deleteProductImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";

export default function ImageGalleryEditor({
  productId,
  images = [],
  refresh,
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const ordered = useMemo(
    () => [...images].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    [images],
  );

  async function handleUpload(files) {
    if (!files || files.length === 0) return;

    setUploading(true);
    setError("");
    try {
      // Upload one file at a time so a failure keeps the earlier successes.
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("Image upload failed");

        const { url } = await res.json();
        const result = await createProductImage(productId, url);
        if (!result?.ok) {
          throw new Error(result?.error || "Failed to save image");
        }
      }
      await refresh();
    } catch (err) {
      setError(err?.message || "Failed to upload image");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove(id) {
    if (!confirm("Remove this image?")) return;

    setError("");
    try {
      const result = await deleteProductImage(id);
      if (!result?.ok) {
        throw new Error(result?.error || "Failed to remove image");
      }
      await refresh();
    } catch (err) {
      setError(err?.message || "Failed to remove image");
    }
  }

  return (
    <div className="space-y-3 border rounded-xl p-3">
      <div className="flex items-center justify-between">
        <Label>Gallery</Label>
        <span className="text-xs text-muted-foreground">
          The product image above stays the card thumbnail
        </span>
      </div>

      {ordered.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {ordered.map((image) => (
            <div key={image.id} className="relative">
              <Image
                src={image.url}
                alt=""
                width={160}
                height={160}
                sizes="80px"
                className="h-20 w-20 rounded-lg border object-cover"
              />
              <Button
                type="button"
                size="icon-xs"
                variant="secondary"
                className="absolute -top-2 -right-2 rounded-full"
                onClick={() => handleRemove(image.id)}
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">
          No gallery images yet.
        </div>
      )}

      <Input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        disabled={uploading}
        onChange={(e) => handleUpload(Array.from(e.target.files || []))}
      />

      {error && <div className="text-sm text-destructive">{error}</div>}
      {uploading && (
        <div className="text-sm text-muted-foreground">Uploading...</div>
      )}
    </div>
  );
}
