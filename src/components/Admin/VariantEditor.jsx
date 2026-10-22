"use client";

import { useId, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createVariant } from "@/app/actions/createVariant";
import { updateVariant } from "@/app/actions/updateVariant";
import { deleteVariant } from "@/app/actions/deleteVariant";
import { formatOptions, variantLabel } from "@/lib/variants";

const emptyInput = { options: "", sku: "", price: "", stock: "" };

function VariantFields({ value, onChange, disabled }) {
  // This block renders once per variant row plus once for the draft, so the ids
  // have to be unique instead of fixed.
  const uid = useId();
  const optionsId = `${uid}-options`;
  const skuId = `${uid}-sku`;
  const priceId = `${uid}-price`;
  const stockId = `${uid}-stock`;

  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="col-span-3 space-y-1">
        <Label htmlFor={optionsId} className="text-xs">
          Options
        </Label>
        <Input
          id={optionsId}
          value={value.options}
          disabled={disabled}
          onChange={(e) => onChange({ ...value, options: e.target.value })}
          placeholder="Color=Red, Size=M"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={skuId} className="text-xs">
          SKU
        </Label>
        <Input
          id={skuId}
          value={value.sku}
          disabled={disabled}
          onChange={(e) => onChange({ ...value, sku: e.target.value })}
          placeholder="Optional"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={priceId} className="text-xs">
          Price
        </Label>
        <Input
          id={priceId}
          type="number"
          min="0"
          value={value.price}
          disabled={disabled}
          onChange={(e) => onChange({ ...value, price: e.target.value })}
          placeholder="Product price"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={stockId} className="text-xs">
          Stock
        </Label>
        <Input
          id={stockId}
          type="number"
          min="0"
          value={value.stock}
          disabled={disabled}
          onChange={(e) => onChange({ ...value, stock: e.target.value })}
          placeholder="Not tracked"
        />
      </div>
    </div>
  );
}

function VariantRow({ variant, refresh }) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [value, setValue] = useState({
    options: formatOptions(variant.attributes),
    sku: variant.sku || "",
    price: variant.price ?? "",
    stock: variant.stock ?? "",
  });

  function reset() {
    setValue({
      options: formatOptions(variant.attributes),
      sku: variant.sku || "",
      price: variant.price ?? "",
      stock: variant.stock ?? "",
    });
    setError("");
  }

  async function run(action) {
    setBusy(true);
    setError("");
    try {
      const result = await action();
      if (!result?.ok) throw new Error(result?.error || "Action failed");
      setEditing(false);
      await refresh();
    } catch (err) {
      setError(err?.message || "Action failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border p-2 space-y-2">
      {editing ? (
        <>
          <VariantFields value={value} onChange={setValue} disabled={busy} />
          {error && <div className="text-xs text-destructive">{error}</div>}
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={busy}
              onClick={() => run(() => updateVariant(variant.id, value))}
            >
              {busy ? "Saving..." : "Save"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => {
                setEditing(false);
                reset();
              }}
            >
              Cancel
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm truncate">
                {variantLabel(variant)}
                {variant.sku ? (
                  <span className="text-muted-foreground"> · {variant.sku}</span>
                ) : null}
              </div>
              <div className="text-xs text-muted-foreground">
                {variant.price === null ? "Product price" : `৳ ${variant.price}`} ·{" "}
                {variant.stock === null ? "not tracked" : `${variant.stock} in stock`}
              </div>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                Edit
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                disabled={busy}
                onClick={() => run(() => deleteVariant(variant.id))}
                aria-label="Delete variant"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
          {error && <div className="text-xs text-destructive">{error}</div>}
        </>
      )}
    </div>
  );
}

export default function VariantEditor({ productId, variants = [], refresh }) {
  const [draft, setDraft] = useState(emptyInput);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd() {
    setBusy(true);
    setError("");
    try {
      const result = await createVariant({ product_id: productId, ...draft });
      if (!result?.ok) throw new Error(result?.error || "Failed to add variant");
      setDraft(emptyInput);
      await refresh();
    } catch (err) {
      setError(err?.message || "Failed to add variant");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border p-3 space-y-3">
      <div className="text-sm font-medium">Variants</div>

      {variants.length === 0 ? (
        <div className="text-xs text-muted-foreground">
          No variants. This product sells at its own price and stock.
        </div>
      ) : (
        <div className="space-y-2">
          {variants.map((variant) => (
            <VariantRow key={variant.id} variant={variant} refresh={refresh} />
          ))}
        </div>
      )}

      <div className="border-t pt-3 space-y-2">
        <div className="text-xs text-muted-foreground">
          Add variant — options as Color=Red, Size=M
        </div>
        <VariantFields value={draft} onChange={setDraft} disabled={busy} />
        {error && <div className="text-xs text-destructive">{error}</div>}
        <Button size="sm" disabled={busy} onClick={handleAdd}>
          {busy ? "Adding..." : "Add variant"}
        </Button>
      </div>
    </div>
  );
}
