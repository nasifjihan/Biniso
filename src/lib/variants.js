/**
 * Helpers shared by the admin variant editor and the storefront selector.
 * Variant attributes are stored as jsonb, e.g. { "Color": "Red", "Size": "M" }.
 */

/** "Color=Red, Size=M" -> { Color: "Red", Size: "M" } */
export function parseOptions(text) {
  const attributes = {};

  for (const part of String(text || "").split(",")) {
    const [rawKey, ...rest] = part.split("=");
    const key = rawKey?.trim();
    const value = rest.join("=").trim();
    if (key && value) attributes[key] = value;
  }

  return attributes;
}

/** { Color: "Red", Size: "M" } -> "Color=Red, Size=M" */
export function formatOptions(attributes) {
  return Object.entries(attributes || {})
    .map(([key, value]) => `${key}=${value}`)
    .join(", ");
}

/** How the customer sees a variant: "Red / M". */
export function variantLabel(variant) {
  const values = Object.values(variant?.attributes || {});
  if (values.length === 0) return variant?.sku || "Default";
  return values.join(" / ");
}

/** Distinct attribute names across a product's variants, in first-seen order. */
export function attributeKeys(variants) {
  const keys = [];
  for (const variant of variants || []) {
    for (const key of Object.keys(variant?.attributes || {})) {
      if (!keys.includes(key)) keys.push(key);
    }
  }
  return keys;
}

/** Distinct values a single attribute takes across a product's variants. */
export function attributeValues(variants, key) {
  const values = [];
  for (const variant of variants || []) {
    const value = variant?.attributes?.[key];
    if (value && !values.includes(value)) values.push(value);
  }
  return values;
}

/** The variant matching every selected attribute, or undefined. */
export function findVariant(variants, selection) {
  const keys = Object.keys(selection || {});
  if (keys.length === 0) return undefined;

  return (variants || []).find((variant) =>
    keys.every((key) => variant?.attributes?.[key] === selection[key]),
  );
}

/** `stock === null` means the variant is not stock-tracked. */
export function isInStock(stock) {
  return stock === null || stock === undefined || stock > 0;
}

/**
 * Cleans variant form input into database columns.
 * Empty price / stock / sku become `null` (fall back to the product, or untracked).
 */
export function normaliseVariantInput({ options, sku, price, stock }) {
  const cleanNumber = (value, { integer = false } = {}) => {
    if (value === "" || value === null || value === undefined) return null;
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return null;
    return integer ? Math.trunc(n) : n;
  };

  return {
    attributes: parseOptions(options),
    sku: typeof sku === "string" && sku.trim() ? sku.trim() : null,
    price: cleanNumber(price),
    stock: cleanNumber(stock, { integer: true }),
  };
}
