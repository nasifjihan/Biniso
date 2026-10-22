// Shared inventory rules. Server-side only: `stock` lives on the products table
// and `null` means "not tracked", so a product is only ever low when it has a
// real number at or below the threshold.

const configured = Number(process.env.LOW_STOCK_THRESHOLD);

// A product at or below this many units shows up in the dashboard's low-stock
// list and triggers the owner alert. Override with LOW_STOCK_THRESHOLD.
export const LOW_STOCK_THRESHOLD =
  Number.isFinite(configured) && configured > 0 ? configured : 5;

/** True when a tracked product is at or below the threshold. */
export function isLowStock(stock) {
  return stock !== null && stock !== undefined && Number(stock) <= LOW_STOCK_THRESHOLD;
}
