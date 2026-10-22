// The wishlist lives in the browser for guests and in the `favorites` table for
// signed-in customers, so both sides need the same idea of a valid entry.

export const FAVORITE_COLUMNS = "product_id, created_at";

// A wishlist is a handful of ids; anything past this is a runaway client.
const MAX_FAVORITES = 200;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Keeps only unique, well-formed, non-empty product ids, in the order given.
 * Anything else is dropped rather than rejecting the whole list.
 */
export function parseFavoriteIds(input) {
  const values = Array.isArray(input) ? input : [];
  const seen = new Set();

  for (const value of values) {
    const id = String(value ?? "").trim();
    if (UUID.test(id)) seen.add(id);
    if (seen.size >= MAX_FAVORITES) break;
  }

  return Array.from(seen);
}
