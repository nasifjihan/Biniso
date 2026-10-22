/** "Home & Living" -> "home-living". Used when a category is created or renamed. */
export function slugify(name) {
  const slug = String(name || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "category";
}
