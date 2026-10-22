# Biniso — Roadmap to a Fully Dynamic E-commerce Site

> **Living document.** This is the single source of truth for what is left to do.
> Update the checkbox/status of an item as it is completed and add a line to the
> [Progress Log](#progress-log) at the bottom.

## How to use this file

- Status markers: `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked
- Each task has an **ID** (e.g. `P1-02`), a **priority**, and **acceptance criteria**.
- Work top-to-bottom: phases are ordered so each one is usable before the next.
- Only one task should be `[~]` at a time.
- When a task changes the database, add a new file in `supabase/migrations/`.

## Current state (baseline)

Already working: storefront browse/search/cart/favorites, COD checkout, admin
order management with status updates, printable invoices, Cloudinary product
uploads, Supabase email/password auth with `app_metadata.role` admin gating,
RLS policies, and a documented env template.

Known gaps: no payment gateway, no inventory, no customer accounts, no sitemap,
no per-product SEO, hardcoded delivery fees/statuses, no tests, static catalog.

---

## Phase 0 — Foundation (COMPLETE)

- [x] **P0-01** Migrate auth from `@supabase/auth-helpers-nextjs` to `@supabase/ssr`
- [x] **P0-02** Single admin gate in `middleware.js` using `app_metadata.role`
- [x] **P0-03** RLS policies for `products` / `orders` / `order_items`
- [x] **P0-04** Rewrite `createOrder` to one schema, server-side pricing, service-role client
- [x] **P0-05** Route admin product writes through server actions
- [x] **P0-06** Order line items in the notification email
- [x] **P0-07** `.env.example` + SQL migration + `Step.md` / `README.md`

---

## Phase 1 — Launch blockers & quick wins (COMPLETE)

Small, high-value changes. These make the site safe to put in front of real
customers.

- [x] **P1-01 · Sitemap + robots** — priority: high
  - `robots.txt` points at `https://yourstore.com/sitemap.xml`, which does not exist.
  - Add `src/app/sitemap.js` generating storefront + product URLs; fix the host in `robots.txt`.
  - **Acceptance:** `/sitemap.xml` returns valid XML listing `/`, `/products`, and each active product; `robots.txt` Sitemap line is correct.
  - **Files:** `public/robots.txt`, `src/app/sitemap.js` (new)

- [x] **P1-02 · Per-product SEO metadata** — priority: high
  - `src/app/(shop)/products/[id]/page.jsx` is `"use client"`, so products share one generic title/description.
  - Split into a server component (`page.jsx`) that exports `generateMetadata`, and move the interactive parts into a child client component.
  - **Acceptance:** each product page has a unique `<title>`, description, canonical URL and OG image.
  - **Files:** `src/app/(shop)/products/[id]/page.jsx`, new client child component

- [x] **P1-03 · Checkout abuse protection** — priority: high
  - `createOrder` is a public server action; there is no rate limit, so it can be spammed.
  - Add per-IP rate limiting and a honeypot/timing check; keep it env-configurable.
  - **Acceptance:** repeated submissions from one IP are throttled; bot submissions are rejected without breaking real checkout.
  - **Files:** `src/app/actions/createOrder.js`, new `src/lib/rateLimit.js`

- [x] **P1-04 · Customer order confirmation email** — priority: high
  - Only `ORDER_RECEIVER_EMAIL` is notified; the buyer gets nothing.
  - Send a second email to `order.email` with the itemised receipt.
  - **Acceptance:** buyer with an email receives a receipt; failures do not block the order.
  - **Files:** `src/lib/email.js`, `src/app/actions/createOrder.js`

- [x] **P1-05 · Legal pages** — priority: medium
  - Add Privacy Policy, Terms & Conditions and Return/Refund pages, linked in the footer.
  - **Acceptance:** all three routes render and are linked from the footer.
  - **Files:** `src/app/(shop)/privacy/page.jsx`, `terms`, `refund-policy`, `src/components/Layout/Footer.jsx`

- [x] **P1-06 · Fresh catalog (revalidation)** — priority: medium
  - `/products` is statically prerendered, so admin edits do not appear until redeploy.
  - Add `revalidate`/`revalidateTag` (e.g. `"products"`) and call `revalidateTag("products")` from the product actions.
  - **Acceptance:** adding/updating a product is visible on the storefront without rebuilding.
  - **Files:** `src/lib/products.js`, `src/app/actions/createProduct.js`, `updateProduct.js`, `deleteProduct.js`

- [x] **P1-07 · Migrate to `next/image`** — priority: medium
  - All imagery uses plain `<img>`; `next.config.mjs` already has unused `remotePatterns`.
  - Switch product cards, gallery, hero and promos to `next/image` and configure allowed hosts.
  - **Acceptance:** images are optimised/served in modern formats; no layout shift; no console warnings.
  - **Files:** `next.config.mjs`, `src/components/ProductCard.jsx`, `src/components/Home/*`

- [x] **P1-08 · Checkout form hardening** — priority: medium
  - BD phone format, email format and length limits are not validated (client or server).
  - Add Zod schemas shared by the form and the server action.
  - **Acceptance:** invalid phone/email are rejected server-side with clear messages.
  - **Files:** `src/app/(shop)/checkout/page.jsx`, `src/app/actions/createOrder.js`, new `src/lib/validation.js`

---

## Phase 2 — Catalog depth

- [x] **P2-01 · Inventory / stock tracking** — priority: high
  - There is no stock column, so overselling is possible.
  - Add `stock` to `products`, decrement on order, block add-to-cart when out of stock, show stock in admin.
  - **Acceptance:** ordering beyond available stock is rejected; stock decrements atomically.
  - **Implementation:** `stock` is **nullable** — `NULL` means "not tracked" (always available), so the migration does not put existing products out of stock. Decrementing happens in `decrement_stock(items jsonb)`, which runs as one transaction and raises on shortage so a partial reservation is impossible; it is revoked from `PUBLIC` so only the service role (the checkout action) can call it. When stock runs out mid-checkout the action deletes the order and returns a message naming the product.
  - **Files:** `supabase/migrations/0002_stock.sql`, `src/app/actions/createOrder.js`, `src/app/actions/createProduct.js`, `updateProduct.js`, admin product form/table, `ProductCard`, `ProductDetail`

- [x] **P2-02 · Product variants (size / color / SKU)** — priority: medium
  - Only one flat price and image per product.
  - Add a `product_variants` table (sku, attributes, price delta, stock) and variant selection on the detail page.
  - **Acceptance:** a product can have multiple selectable variants priced independently.
  - **Implementation:** `product_variants(product_id, attributes jsonb, sku, price, stock)` with RLS mirroring `products` (public read when the parent product is active, admin write). A `NULL` variant price falls back to `products.price`; a product that has variants tracks stock per variant and ignores `products.stock`. Attributes are entered as `Color=Red, Size=M` and rendered as a "Red / M" label. The admin edits variants inline from each product card; the storefront renders one dropdown per attribute and preselects the first in-stock combination. Cart lines are keyed by `id::variantId` so two variants of one product stay separate, `order_items` stores `variant_id` + `variant_label` snapshots, and `decrement_stock(items jsonb)` now decrements a variant when the line carries a `variant_id`.
  - **Files:** `supabase/migrations/0003_variants.sql`, `src/lib/variants.js`, `src/app/actions/createVariant.js`, `updateVariant.js`, `deleteVariant.js`, `src/components/Admin/VariantEditor.jsx`, `ProductItem.jsx`, `src/components/ProductDetail.jsx`, `src/store/cartStore.js`, `src/app/(shop)/cart/page.jsx`, `src/app/actions/createOrder.js`, `src/lib/email.js`
  - **Requires:** run `supabase/migrations/0003_variants.sql` in the Supabase SQL Editor after `0002_stock.sql`.

- [x] **P2-03 · Multiple images / gallery** — priority: medium
  - `products.image` is a single URL.
  - Add `product_images` (ordered) and a gallery with thumbnails.
  - **Acceptance:** products can show a gallery; first image remains the card thumbnail.
  - **Implementation:** `product_images(product_id, url, position)` with a unique `(product_id, url)` index so the same picture cannot be added twice, and RLS mirroring `products`. `products.image` is untouched and stays the card thumbnail — the detail page renders it first, then the gallery ordered by `position`, deduped. The admin gets an `ImageGalleryEditor` under each product card: multi-file upload through the existing `/api/upload` Cloudinary route, appended one at a time so a mid-batch failure keeps the earlier successes, plus per-image removal.
  - **Files:** `supabase/migrations/0004_product_images.sql`, `src/app/actions/createProductImage.js`, `deleteProductImage.js`, `src/components/Admin/ImageGalleryEditor.jsx`, `ProductItem.jsx`, `src/lib/products.js`, `src/components/ProductDetail.jsx`
  - **Requires:** run `supabase/migrations/0004_product_images.sql` in the Supabase SQL Editor after `0003_variants.sql`.

- [x] **P2-04 · Categories as data** — priority: medium
  - `category` is free text, so typos fragment the category list.
  - Add a `categories` table, reference it from products, and drive menu/search from it.
  - **Acceptance:** categories are managed in admin and reused everywhere.
  - **Implementation:** `categories(id, name, slug)` with public read / admin write RLS. `products.category_id` replaces the free-text `category` column; the migration seeds one category per distinct existing value (slugified, collisions suffixed) and backfills `category_id` before dropping the column, so no product loses its category. New `/admin/categories` page (linked in the admin nav) adds, renames and deletes categories — deleting leaves products in place with `category_id = null` (the FK is `on delete set null`). Both admin product forms and the storefront category menu now read from the table, and storefront filtering uses `category_id`.
  - **Files:** `supabase/migrations/0005_categories.sql`, `src/lib/categories.js`, `src/app/actions/createCategory.js`, `updateCategory.js`, `deleteCategory.js`, `src/app/(admin)/admin/categories/page.jsx`, `admin/layout.jsx`, `admin/products/page.jsx`, `src/components/Admin/ProductItem.jsx`, `src/components/Home/CategorySearchBar.jsx`, `src/app/actions/createProduct.js`, `updateProduct.js`, `src/lib/products.js`
  - **Requires:** run `supabase/migrations/0005_categories.sql` in the Supabase SQL Editor after `0004_product_images.sql`.

- [x] **P2-05 · Pagination, filtering & sorting** — priority: medium
  - `/products` loads the entire table; search is capped at 12 results.
  - Add server-side pagination plus category/price/status filters and sort options.
  - **Acceptance:** catalog stays fast with hundreds of products.
  - **Implementation:** `/products` is now a dynamic server component that reads `searchParams` and asks the database for a single page. `getProductPage({ categoryId, minPrice, maxPrice, inStockOnly, sort, page, perPage })` in `src/lib/products.js` builds the query with `count: "exact"` for the total and `.range()` for the slice, filtering by `category_id`, `price >= min`, `price <= max` and `stock.is.null or stock.gt.0` (stock `NULL` still means "not tracked", so untracked items are never hidden). Sorting comes from the exported `PRODUCT_SORTS` map (`newest`, `price-asc`, `price-desc`, `name-asc`) which is also used to validate the URL value. The new client `ProductFilters` bar drives the URL: a category select (by slug), min/max price inputs applied on submit, a sort select, a "Hide out of stock" checkbox and a "Clear filters" reset. Every filter change drops `page`, and the Previous/Next pagination links rebuild the URL from the active filters, so a filtered view survives page navigation. The header shows the active category and "Showing X–Y of Z", and an empty result set renders a clear-filters card.
  - **Files:** `src/lib/products.js`, `src/components/ProductFilters.jsx`, `src/app/(shop)/products/page.jsx`

- [x] **P2-06 · Dedicated search results page** — priority: low
  - Search is a dropdown only.
  - Add `/search?q=` with the full result set and pagination.
  - **Acceptance:** searching returns a shareable, paginated results page.
  - **Implementation:** `/search` is a dynamic server component reading `?q=` and rendering the full, paginated result set — the same `getProductPage()` now takes a `search` term and matches it with `ilike` on the product name (PostgREST query characters are stripped from the input first). The page reuses `ProductFilters` for category/price/sort/stock, so filters and the query combine and every state is shareable in the URL. The search box is a plain `GET` form, so it works without JavaScript and preserves the active filters through hidden inputs. The home page search bar now navigates to `/search?q=` instead of rendering an inline 12-result dropdown, its category buttons link to `/products?category=<slug>`, and the navbar search button links to `/search`. Cleared filters keep the `q` parameter, so resetting a narrowed search lands back on the full query results.
  - **Files:** `src/lib/products.js`, `src/app/(shop)/search/page.jsx`, `src/components/ProductFilters.jsx`, `src/components/Home/CategorySearchBar.jsx`, `src/components/Layout/Navbar.jsx`

- [x] **P2-07 · Restock on cancellation** — priority: medium
  - P2-01 decrements stock when an order is placed, but `updateOrderStatus` does not return it when an order is `cancelled`, so cancelled orders silently lose inventory.
  - Restore stock (the inverse of `decrement_stock`) when an order moves to `cancelled`, and only once per order.
  - **Acceptance:** cancelling an order returns its items to stock; moving an order back out of `cancelled` does not double-count.
  - **Implementation:** `0006_restore_stock.sql` adds `orders.stock_restored` plus a `restore_stock(items jsonb)` function — the exact inverse of `decrement_stock`, adding each line's quantity back to the variant when the line has one and to the product otherwise, skipping `NULL` (untracked) stock so untracked products never become tracked. Like `decrement_stock` it is revoked from `public` and granted only to `service_role`, so `updateOrderStatus` calls it with the admin client. The action now reads the order first and, when moving it to `cancelled` with `stock_restored = false`, claims the restore with a guarded conditional update (`... .eq("stock_restored", false)`) *before* returning the stock — so two admins cancelling at once cannot restock the same order twice. If the restore fails the claim is released so the admin can retry, and because re-cancelling finds the flag already set, moving an order out of `cancelled` and back never double-counts. Lines whose variant was deleted are skipped (the variant row and its stock went with it).
  - **Files:** `supabase/migrations/0006_restore_stock.sql`, `src/app/actions/updateOrderStatus.js`
  - **Requires:** run `supabase/migrations/0006_restore_stock.sql` in the Supabase SQL Editor after `0005_categories.sql`.

---

## Phase 3 — Commerce

- [ ] **P3-01 · Online payment gateway** — priority: high · **BLOCKED: pick provider**
  - Checkout is cash-on-delivery only.
  - Integrate a BD gateway (bKash / Nagad / SSLCommerz) as a second payment method with a webhook to confirm payment.
  - **Acceptance:** paid orders are marked paid automatically; COD still works.
  - **Files:** new `src/app/api/payments/*`, migration for `payment_*` columns, checkout UI

- [x] **P3-02 · Coupons / discount codes** — priority: medium
  - Add a `coupons` table (code, type, value, min order, expiry, usage limit) and apply at checkout.
  - **Acceptance:** a valid code reduces the total; invalid/expired codes are rejected server-side.
  - **Implementation:** `0007_coupons.sql` adds `coupons` (percent or fixed value, minimum order, optional expiry, optional usage limit, active flag) plus `orders.coupon_code` / `orders.discount`. Coupons have **no public read policy** — a customer must not be able to list every code — so lookups use the service-role client in two server-only places: `validateCoupon()` (rate-limited, powers the checkout preview) and `createOrder()`. `src/lib/coupons.js` holds the shared rules (normalise the code to upper case, cap the discount at the subtotal, check active/expiry/limit/minimum order) so the preview and the order always agree. `createOrder` re-prices from the database and ignores the client's claimed total, then redeems the code with the `redeem_coupon()` function, which checks *and* increments `used_count` in a single statement so two orders cannot claim the last use. Redemption runs after the stock is reserved, and if it fails the order is deleted and the stock restored, so a failed checkout never burns a use of the code. New `/admin/coupons` page creates, pauses/resumes and deletes codes and shows redemptions; the discount shows on the checkout summary, the success page, the order email, the admin order list and the invoice.
  - **Files:** `supabase/migrations/0007_coupons.sql`, `src/lib/coupons.js`, `src/app/actions/validateCoupon.js`, `createCoupon.js`, `setCouponActive.js`, `deleteCoupon.js`, `src/app/(admin)/admin/coupons/page.jsx`, `admin/layout.jsx`, `src/app/actions/createOrder.js`, `src/app/(shop)/checkout/page.jsx`, `order-success/page.jsx`, `src/components/InvoiceClient.jsx`, `src/app/(admin)/admin/orders/page.jsx`, `src/lib/email.js`
  - **Requires:** run `supabase/migrations/0007_coupons.sql` in the Supabase SQL Editor after `0006_restore_stock.sql`.
  - **Not included:** editing an existing coupon (pause, delete and recreate instead) — orders already reference the code a coupon handed out.

- [ ] **P3-03 · Shipping zones & rates** — priority: medium
  - Delivery fees are hardcoded (`inside_dhaka: 60`, `outside_dhaka: 120`, `pickup: 0`).
  - Move them to a `shipping_zones` table/config manageable in admin.
  - **Acceptance:** fees are editable without a code change.

- [ ] **P3-04 · Order status notifications** — priority: medium
  - Status changes in admin do not notify the customer.
  - Email the buyer on `confirmed` / `shipped` / `delivered`.
  - **Acceptance:** each status change sends an appropriate email.

- [ ] **P3-05 · Invoice PDF + email attachment** — priority: low
  - Invoices are print-to-PDF only, via `react-to-print`.
  - Generate a PDF server-side and attach it to the confirmation email.
  - **Acceptance:** the buyer receives a PDF invoice.

- [ ] **P3-06 · Tax / VAT handling** — priority: low · **BLOCKED: confirm whether required**
  - Add configurable tax and show it as a line item.

---

## Phase 4 — Customer accounts

- [ ] **P4-01 · Customer signup / login** — priority: high
  - Only admins can authenticate today; checkout is guest-only.
  - Enable customer auth (email/password + optional OTP) and account pages.
  - **Acceptance:** customers can register, log in and log out.
  - **Files:** new `src/app/(account)/*`, update `middleware.js` matcher

- [ ] **P4-02 · Order history** — priority: high
  - Add a "My Orders" page scoped to the signed-in user; link `orders.user_id`.
  - **Acceptance:** customers see only their own orders (enforced by RLS).

- [ ] **P4-03 · Public order tracking** — priority: medium
  - Add `/track` where a guest can look up an order with order ID + phone.
  - **Acceptance:** correct credentials return status; wrong ones return nothing (no enumeration).

- [ ] **P4-04 · Address book** — priority: low
  - Save/select delivery addresses for faster repeat checkout.

- [ ] **P4-05 · Wishlist synced to account** — priority: low
  - Favorites are localStorage-only; persist them per user.

---

## Phase 5 — Admin & operations

- [ ] **P5-01 · Admin user management UI** — priority: medium
  - Admins are currently promoted by hand in SQL. Add an invite/role screen.
- [ ] **P5-02 · Dashboard analytics** — priority: medium
  - Revenue, order counts, top products, low-stock list on `/admin`.
- [ ] **P5-03 · Low-stock alerts** — priority: medium
  - Depends on P2-01. Notify when stock drops below a threshold.
- [ ] **P5-04 · Bulk actions & CSV export** — priority: low
  - Bulk status change and CSV export for orders/products.

---

## Phase 6 — Quality & launch

- [ ] **P6-01 · Automated tests** — priority: high
  - Add Vitest for `src/lib` + server actions and Playwright for the checkout flow.
  - **Acceptance:** `npm test` covers pricing, order creation and auth gating.
- [ ] **P6-02 · Structured data & SEO polish** — priority: medium
  - JSON-LD `Product`/`BreadcrumbList`, canonical URLs, per-page OG images.
- [ ] **P6-03 · Analytics & error monitoring** — priority: medium
  - Add privacy-friendly analytics and an error reporter (e.g. Sentry).
- [ ] **P6-04 · Performance audit** — priority: medium
  - Lighthouse pass on home / listing / product / checkout; fix regressions.
- [ ] **P6-05 · Accessibility audit** — priority: medium
  - Keyboard navigation, focus states, labels, contrast.
- [ ] **P6-06 · Deployment & CI/CD** — priority: high
  - Deploy, set production env vars, run migrations, wire CI to lint + build.
- [ ] **P6-07 · Backups & security review** — priority: high
  - Confirm Supabase backups, re-review RLS for every new table, rotate keys.

---

## Open decisions

These block or shape the phases above — resolve before starting the related phase.

| # | Decision | Blocks | Notes |
| - | -------- | ------ | ----- |
| D1 | Payment provider (bKash / Nagad / SSLCommerz / other) | P3-01 | Affects credentials, webhook design and refund flow. |
| D2 | Are customer accounts in scope, or stay guest-only? | P4-* | **Resolved:** accounts are in scope. Guest checkout stays available. |
| D3 | Is VAT/tax required for your market? | P3-06 | Skip if not applicable. |
| D4 | Production host (Vercel / other) and domain | P1-01, P6-06 | Needed for canonical URLs, sitemap and env config. |
| D5 | Do you need product variants, or is one price per product enough? | P2-02 | **Resolved & done (P2-02):** `product_variants` (sku, attributes, price, stock) is in place. Product-level `stock` stays as the fallback for products without variants. |

## Progress Log

| Date | Task ID | What changed |
| ---- | ------- | ------------ |
| 2026-10-22 | P0-01 … P0-07 | Auth migrated to `@supabase/ssr`, RLS added, `createOrder` rewritten, admin writes via server actions, env template + SQL migration + docs. |
| 2026-10-22 | P1-01 | Added `src/app/robots.js` + dynamic `src/app/sitemap.js`(hourly revalidate); deleted the stale `public/robots.txt` with the `yourstore.com` host. |
| 2026-10-22 | P1-02 | Product page converted to a server component with `generateMetadata` (title, description, canonical, OG/Twitter), `cache()`-deduped fetch, `notFound()`; interactive UI moved to `ProductDetail.jsx`. |
| 2026-10-22 | P1-03 | Added `src/lib/rateLimit.js` (in-memory, per-IP) + honeypot field (`company`) checked in `createOrder`. |
| 2026-10-22 | P1-04 | `sendOrderConfirmation` emails the buyer an itemised receipt; failures are non-blocking (`emailWarning`). |
| 2026-10-22 | P1-05 | Added Privacy, Terms and Refund Policy pages and linked them from the footer. |
| 2026-10-22 | P1-06 | Catalog fetches cached with the `"products"` tag and `revalidateTag("products")` called from product actions, so admin edits show without a rebuild. |
| 2026-10-22 | P1-07 | Migrated 7 `<img>` usages to `next/image` (cards, detail, hero, promo, cart, admin) with `sizes` and empty-image fallbacks; the blob preview stays a plain `<img>`. `coresg-normal.trae.ai` allow-listed. |
| 2026-10-22 | P1-08 | Added `zod` and `src/lib/validation.js` (BD phone, email, length limits) shared by the checkout form (inline field errors) and `createOrder` (server-side rejection). |
| 2026-10-22 | P2-01 | Inventory: nullable `products.stock` (NULL = not tracked) + `0002_stock.sql` with an atomic, service-role-only `decrement_stock()`; `createOrder` pre-checks availability then reserves stock and rolls the order back on shortage; admin gained a Stock field/column; storefront shows out-of-stock and disables add-to-cart. |
| 2026-10-22 | P2-02 | Variants: `0003_variants.sql` adds `product_variants` (+ `order_items.variant_id`/`variant_label`) and makes `decrement_stock()` variant-aware; inline admin `VariantEditor`; `ProductDetail` gained per-attribute dropdowns with per-variant price/stock; cart lines keyed by `id::variantId`; `createOrder` prices, snapshots and reserves per variant. Needs `0003_variants.sql` run in Supabase. |
| 2026-10-22 | P2-03 | Gallery: `0004_product_images.sql` adds `product_images` (position-ordered, unique per url) with `products`-style RLS; new `createProductImage`/`deleteProductImage` actions; admin `ImageGalleryEditor` for multi-file upload and removal; `ProductDetail` renders a main image with thumbnails, keeping `products.image` first so cards are unchanged. Needs `0004_product_images.sql` run in Supabase. |
| 2026-10-22 | P2-04 | Categories as data: `0005_categories.sql` adds `categories` + `products.category_id`, seeds categories from the old free-text values, backfills, then drops `products.category`; new `/admin/categories` CRUD page; admin forms use a category select; storefront category menu and filtering move to `category_id`. Needs `0005_categories.sql` run in Supabase. |
| 2026-10-22 | P2-05 | Pagination/filters/sort: `getProductPage()` queries one page at a time with `count: "exact"` + `.range()`, filtering by category, price range and stock, with `PRODUCT_SORTS` for ordering; `/products` became a dynamic server component reading `searchParams`; new `ProductFilters` bar drives the URL (category, min/max price, sort, hide out-of-stock, clear) and pagination links preserve the active filters. |
| 2026-10-22 | P2-06 | Search results page: `getProductPage()` gained a `search` term (`ilike` on the name), and new dynamic `/search?q=` renders the full paginated result set reusing `ProductFilters`; the box is a no-JS `GET` form that preserves filters; the home search bar and navbar search button now navigate here (home no longer renders an inline 12-result dropdown); "Clear filters" keeps `q`. |
| 2026-10-22 | P2-07 | Restock on cancellation: `0006_restore_stock.sql` adds `orders.stock_restored` and a service-role-only `restore_stock()` (the inverse of `decrement_stock`, variant-aware, skips untracked `NULL` stock); `updateOrderStatus` claims the restore with a guarded update before returning stock, so cancelling is idempotent and moving an order out of `cancelled` and back never double-counts. Needs `0006_restore_stock.sql` run in Supabase. |
| 2026-10-22 | P3-02 | Coupons: `0007_coupons.sql` adds `coupons` (percent/fixed, min order, expiry, usage limit, active) + `orders.coupon_code`/`discount`, with no public read policy and a single-statement `redeem_coupon()` so the last use cannot be claimed twice. Shared rules in `src/lib/coupons.js`; checkout previews a code via the rate-limited `validateCoupon()`, `createOrder` re-prices and redeems it after the stock is reserved (rolling back both on failure); new `/admin/coupons` page; discount surfaced on the checkout, success page, email, admin order list and invoice. Needs `0007_coupons.sql` run in Supabase. |
