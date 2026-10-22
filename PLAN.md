# Biniso — Roadmap to a Fully Dynamic E-commerce Site

> **Living document.** This is the single source of truth for what is left to do.
> Update the checkbox/status of an item as it is completed and add a line to the
> [Progress Log](#progress-log) at the bottom.

## How to use this file

- Status markers: `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked · `[-]` dropped (out of scope, decided with the owner)
- Each task has an **ID** (e.g. `P1-02`), a **priority**, and **acceptance criteria**.
- Work top-to-bottom: phases are ordered so each one is usable before the next.
- Only one task should be `[~]` at a time.
- When a task changes the database, add a new file in `supabase/migrations/`.

## Current state (baseline)

Already working: storefront browse/search/cart/favorites, COD checkout, admin
order management with status updates, printable invoices, Cloudinary product
uploads, Supabase email/password auth with `app_metadata.role` admin gating,
RLS policies, and a documented env template.

Known gaps: still no automated tests, SEO/JSON-LD polish, monitoring,
performance/accessibility pass, CI or backups (Phase 6). The admin has role
management, a dashboard, low-stock alerts and bulk/CSV operations (Phase 5). A
payment gateway and tax handling are deliberately out of scope (COD only).

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

- [-] **P3-01 · Online payment gateway** — priority: high · **DROPPED: not needed**
  - Checkout is cash-on-delivery only.
  - Integrate a BD gateway (bKash / Nagad / SSLCommerz) as a second payment method with a webhook to confirm payment.
  - **Acceptance:** paid orders are marked paid automatically; COD still works.
  - **Files:** new `src/app/api/payments/*`, migration for `payment_*` columns, checkout UI
  - **Dropped on 2026-10-23:** the store runs on cash on delivery and no gateway is wanted. No `payment_*` columns exist, so nothing has to be removed; if this is ever revived, the checkout only needs a second payment method plus a `payment_status` column.

- [x] **P3-02 · Coupons / discount codes** — priority: medium
  - Add a `coupons` table (code, type, value, min order, expiry, usage limit) and apply at checkout.
  - **Acceptance:** a valid code reduces the total; invalid/expired codes are rejected server-side.
  - **Implementation:** `0007_coupons.sql` adds `coupons` (percent or fixed value, minimum order, optional expiry, optional usage limit, active flag) plus `orders.coupon_code` / `orders.discount`. Coupons have **no public read policy** — a customer must not be able to list every code — so lookups use the service-role client in two server-only places: `validateCoupon()` (rate-limited, powers the checkout preview) and `createOrder()`. `src/lib/coupons.js` holds the shared rules (normalise the code to upper case, cap the discount at the subtotal, check active/expiry/limit/minimum order) so the preview and the order always agree. `createOrder` re-prices from the database and ignores the client's claimed total, then redeems the code with the `redeem_coupon()` function, which checks *and* increments `used_count` in a single statement so two orders cannot claim the last use. Redemption runs after the stock is reserved, and if it fails the order is deleted and the stock restored, so a failed checkout never burns a use of the code. New `/admin/coupons` page creates, pauses/resumes and deletes codes and shows redemptions; the discount shows on the checkout summary, the success page, the order email, the admin order list and the invoice.
  - **Files:** `supabase/migrations/0007_coupons.sql`, `src/lib/coupons.js`, `src/app/actions/validateCoupon.js`, `createCoupon.js`, `setCouponActive.js`, `deleteCoupon.js`, `src/app/(admin)/admin/coupons/page.jsx`, `admin/layout.jsx`, `src/app/actions/createOrder.js`, `src/app/(shop)/checkout/page.jsx`, `order-success/page.jsx`, `src/components/InvoiceClient.jsx`, `src/app/(admin)/admin/orders/page.jsx`, `src/lib/email.js`
  - **Requires:** run `supabase/migrations/0007_coupons.sql` in the Supabase SQL Editor after `0006_restore_stock.sql`.
  - **Not included:** editing an existing coupon (pause, delete and recreate instead) — orders already reference the code a coupon handed out.

- [x] **P3-03 · Shipping zones & rates** — priority: medium
  - Delivery fees are hardcoded (`inside_dhaka: 60`, `outside_dhaka: 120`, `pickup: 0`).
  - Move them to a `shipping_zones` table/config manageable in admin.
  - **Acceptance:** fees are editable without a code change.
  - **Implementation:** `0008_shipping_zones.sql` adds `shipping_zones` (code, name, fee, position, active) and seeds the three options that used to be hardcoded. Customers may read active zones (they need the list to choose from) and admins may read paused ones; only admins may write. The checkout loads the active zones with the browser client, ordered by `position`, preselects the first one, and shows `Name (৳ fee)` from `describeZone()` in `src/lib/shipping.js`. The client-sent choice is now only a code: `createOrder` looks the zone up by code with `active = true` and takes the fee from the row, rejecting any other value — the same rule as product prices. `z.enum(DELIVERY_METHODS)` is gone from `src/lib/validation.js` (zones are data now) in favour of a non-empty string. New `/admin/shipping` page adds options and edits each row's name and fee inline, with pause/resume and delete; the code is derived from the name on creation and never changes, because orders store it. The email and the success page now show the zone's own name (`delivery_name`) instead of prettifying the code.
  - **Files:** `supabase/migrations/0008_shipping_zones.sql`, `src/lib/shipping.js`, `src/lib/validation.js`, `src/app/actions/createOrder.js`, `createShippingZone.js`, `updateShippingZone.js`, `deleteShippingZone.js`, `src/app/(admin)/admin/shipping/page.jsx`, `admin/layout.jsx`, `src/app/(shop)/checkout/page.jsx`, `order-success/page.jsx`, `src/lib/email.js`
  - **Requires:** run `supabase/migrations/0008_shipping_zones.sql` in the Supabase SQL Editor after `0007_coupons.sql`. If no zone is active, checkout has no delivery option to offer. The migration also drops the old `delivery_method` check constraint from `0001_init.sql`, which only allowed `inside_dhaka`/`outside_dhaka`/`pickup` and would reject the new zone codes; if you already ran an earlier copy of `0008`, run that `do $$ … $$` block again on its own.

- [x] **P3-04 · Order status notifications** — priority: medium
  - Status changes in admin do not notify the customer.
  - Email the buyer on `confirmed` / `shipped` / `delivered`.
  - **Acceptance:** each status change sends an appropriate email.
  - **Implementation:** `src/lib/email.js` gained a `STATUS_EMAILS` copy map and `sendOrderStatusEmail(order, status)`, which returns early for any status without copy — so `pending` (already covered by the confirmation email) and unknown values send nothing, and no `RESEND_API_KEY` or customer email means no send. `updateOrderStatus` calls a local, non-exported `notifyCustomer()` helper on both success paths (the cancelled/restock branch and the plain status update); it loads the order (name, email, total) plus its items with the `products ( name )` embed, because the shared `formatItems()` renders `name` / `variant_label` / `quantity` / `price`. The whole helper is wrapped in a try/catch that swallows failures: the status is already saved, so a mail problem must not report the update as failed or make the admin retry it.
  - **Files:** `src/lib/email.js`, `src/app/actions/updateOrderStatus.js`
  - **Notes:** no database change, so no migration is needed. Nothing is sent while `RESEND_API_KEY` is unset.

- [ ] **P3-05 · Invoice PDF + email attachment** — priority: low
  - Invoices are print-to-PDF only, via `react-to-print`.
  - Generate a PDF server-side and attach it to the confirmation email.
  - **Acceptance:** the buyer receives a PDF invoice.

- [-] **P3-06 · Tax / VAT handling** — priority: low · **DROPPED: not needed**
  - Add configurable tax and show it as a line item.
  - **Dropped on 2026-10-23:** no tax/VAT line is required for this store. Prices are charged as listed; `orders` has no tax column, so no migration or checkout change is involved.

---

## Phase 4 — Customer accounts (COMPLETE)

- [x] **P4-01 · Customer signup / login** — priority: high
  - Only admins can authenticate today; checkout is guest-only.
  - Enable customer auth (email/password + optional OTP) and account pages.
  - **Acceptance:** customers can register, log in and log out.
  - **Implementation:** email + password auth through server actions (`signUp`, `signIn`, `signOut`), so the form never talks to Supabase directly and the same Zod rules (`src/lib/auth.js`) run on the server. Sessions are cookie-based via `@supabase/ssr`, so both the middleware and Server Components see the signed-in user. The account pages live **inside the `(shop)` route group** (`/account`, `/account/login`, `/account/register`) instead of a separate group, so they inherit the storefront navbar and footer without a second layout; the navbar's account icon now links to `/account`. `middleware.js` gained `/account/:path*` to its matcher: any matched path that is not `/admin/*` needs a session and is sent to `/account/login?next=…`, while `/admin/*` keeps its separate `app_metadata.role === "admin"` check. Signup and login are rate-limited per IP using the existing `rateLimit()` helper. Because Supabase emails a confirmation link by default, `signUp` returns `needsConfirmation` when no session came back and the form switches to a "confirm your email" panel; the link lands on `/auth/callback`, which exchanges the PKCE code for a session cookie and then continues to a same-site-only `next` path, and an expired link shows a notice on the login page. Login and signup validation errors also map Supabase's raw messages ("Invalid login credentials", "Email not confirmed") to plain English.
  - **Files:** `src/lib/auth.js`, `src/lib/supabase/server.js` (`getUser()`), `src/app/actions/signUp.js`, `signIn.js`, `signOut.js`, `src/app/auth/callback/route.js`, `middleware.js`, `src/app/(shop)/account/page.jsx`, `account/login/page.jsx`, `account/register/page.jsx`, `src/components/Account/LoginForm.jsx`, `RegisterForm.jsx`, `src/components/Layout/Navbar.jsx`
  - **Notes:** no migration and no new table — `auth.users` is already there. No password reset flow yet, and `/checkout` is still guest-only (it does not attach `user_id` to the order; that is P4-02). Optional OTP verification was left out.

- [x] **P4-02 · Order history** — priority: high
  - Add a "My Orders" page scoped to the signed-in user; link `orders.user_id`.
  - **Acceptance:** customers see only their own orders (enforced by RLS).
  - **Implementation:** `0009_order_user.sql` adds `orders.user_id uuid references auth.users (id) on delete set null` plus an index, and two select-only RLS policies: `orders own read` (`user_id = auth.uid()`) and `order_items own read`, whose `exists` subquery reaches the parent order and then runs under the orders policy itself, so the user can only read items of their own orders. `createOrder` now reads the session through `getUser()` and writes `user_id`, so a signed-in order is linked and a guest order stays `null`; the id comes from the cookie and never from the form, and the existing insert keeps using the service-role client. `/account/orders` renders the rows the session client is allowed to see — it uses the normal anon-key server client rather than the service role, which is what makes RLS the enforcement point. `getCustomerOrders(userId)` repeats the `user_id` filter on top of RLS so a policy mistake cannot widen the result, and the shared `orderStatusVariant()` helper replaced the nested badge ternary in the admin list so both lists read the same.
  - **Files:** `supabase/migrations/0009_order_user.sql`, `src/lib/orders.js`, `src/app/(shop)/account/orders/page.jsx`, `src/app/(shop)/account/page.jsx`, `src/app/actions/createOrder.js`, `src/app/(admin)/admin/orders/page.jsx`
  - **Requires:** run `supabase/migrations/0009_order_user.sql` after `0008`. Without it, `orders.user_id` does not exist and both checkout and the orders list fail.
  - **Notes:** orders placed before this (and any guest order) have `user_id = null`, so they never appear under an account. A guest order is not adopted when someone later signs up with the same email, because the email was never verified at checkout — that would leak another person's order. Orders store the zone code, so the page shows it with its hyphens opened up (`inside dhaka`) instead of the zone name, as there is no foreign key to `shipping_zones`.

- [x] **P4-03 · Public order tracking** — priority: medium
  - Add `/track` where a guest can look up an order with order ID + phone.
  - **Acceptance:** correct credentials return status; wrong ones return nothing (no enumeration).
  - **Implementation:** `/track` (dynamic, reads `?id=`) renders `TrackOrderForm`, which posts the order ID and the phone number used at checkout to the `lookupOrder()` server action. Orders are admin-only under RLS, so that action is the one place that uses the service-role client; it validates the UUID shape, requires at least 10 digits of phone, and is rate-limited per IP (10 attempts) so it cannot be used to sweep for order IDs. The phone is compared on the **last ten digits only**, so `+8801…` and `01…` both match, and an unknown ID and a wrong phone return the identical message, so a caller learns nothing from a mismatch. The reply carries only `id`, `status`, `created_at` and `total` — never the address or contact details. `orderStatusVariant()` and a new `STATUS_NOTES` map moved out of `src/lib/orders.js` into the dependency-free `src/lib/orderStatus.js` so this client component can use them without pulling the server-only Supabase client into the browser bundle. `/order-success` gained a "Track this order" button.
  - **Files:** `src/app/actions/lookupOrder.js`, `src/lib/orderStatus.js`, `src/components/TrackOrderForm.jsx`, `src/app/(shop)/track/page.jsx`, `src/app/(shop)/order-success/page.jsx`, `src/lib/orders.js`, `src/app/(admin)/admin/orders/page.jsx`, `src/app/(shop)/account/orders/page.jsx`
  - **Notes:** no migration. Tracking works for guest and account orders alike because it goes by order ID + phone rather than a session.

- [x] **P4-04 · Address book** — priority: low
  - Save/select delivery addresses for faster repeat checkout.
  - **Acceptance:** a signed-in customer can save several addresses, reuse one at checkout and delete the ones they no longer want.
  - **Implementation:** `0010_addresses.sql` adds `public.addresses` (label, name, phone, address, city, `user_id`) with an index and four `user_id = auth.uid()` policies (select/insert/update/delete), so the table is per-customer by construction. Unlike order writes, address writes are done with the **customer's own session client** rather than the service role — RLS decides ownership, and the service role is not needed (`createAddress` never sets another customer's `user_id`; it takes the id from `getUser()`). `src/lib/addresses.js` holds `ADDRESS_COLUMNS`, the shared Zod `parseAddressForm` (same rules as checkout, so a saved address always refills the form without tripping it) and `addressKey()`, which normalises name+phone+address+city so saving the same address twice is a no-op that reports `duplicate: true` instead of inserting a copy. `/account/addresses` renders `AddressBook`, and `/account` gained a "My addresses" button. Checkout now loads the customer's saved addresses on mount (session client), auto-fills the newest one, offers the rest as tapped-to-fill buttons, and — only when signed in — shows a "Save this address to my account" checkbox; the save runs **after** the order is placed and only toasts on failure, so it can never block or fail an order.
  - **Files:** `supabase/migrations/0010_addresses.sql`, `src/lib/addresses.js`, `src/lib/validation.js` (`BD_PHONE` exported), `src/app/actions/createAddress.js`, `deleteAddress.js`, `src/components/Account/AddressBook.jsx`, `src/app/(shop)/account/addresses/page.jsx`, `src/app/(shop)/account/page.jsx`, `src/app/(shop)/checkout/page.jsx`
  - **Requires:** run `supabase/migrations/0010_addresses.sql` after `0009`. The checkout prefill and the address page stay silent-empty until it exists.
  - **Notes:** addresses are never read by the service role and are not shown on orders — an order keeps its own snapshot of the delivery address, so editing or deleting an address never rewrites history. There is no "edit" action: correcting an address means deleting it and re-saving, which keeps the rules to add/delete.

- [x] **P4-05 · Wishlist synced to account** — priority: low
  - Favorites are localStorage-only; persist them per user.
  - **Acceptance:** a signed-in customer sees the same wishlist on any device, and a guest's favorites survive signing in.
  - **Implementation:** `0011_favorites.sql` adds `public.favorites` with a `(user_id, product_id)` primary key (one row per customer per product) and three `user_id = auth.uid()` policies for select/insert/delete; `product_id` cascades on product delete, so a removed product leaves no orphan entries. `loadFavorites()` reads the account list and `pushFavorites(ids)` makes the account match the list the browser is showing — it computes the additions and removals and only touches those rows, so an out-of-date tab can never wipe the wishlist, and `ignoreDuplicates` on the upsert keeps a double save from failing the primary key. `parseFavoriteIds()` (`src/lib/favorites.js`) keeps only unique, well-formed product UUIDs (cap 200) so a tampered or stale local list cannot poison the table. The client-side `favoritesStore` gained `setIds()` and everything else about it — the toggle, the persist key, the guests' behaviour — is unchanged. A new `FavoritesSync` component (mounted once in the `(shop)` layout, renders nothing) does the work: on load it merges the browser's list into the account and adopts the union, then writes every later change back. `LogOutButton` clears the local list on the way out so the next person on a shared device does not see someone else's favorites; they return on the next login.
  - **Files:** `supabase/migrations/0011_favorites.sql`, `src/lib/favorites.js`, `src/app/actions/loadFavorites.js`, `pushFavorites.js`, `src/components/Account/FavoritesSync.jsx`, `LogOutButton.jsx`, `src/store/favoritesStore.js`, `src/app/(shop)/layout.js`, `src/app/(shop)/account/page.jsx`
  - **Requires:** run `supabase/migrations/0011_favorites.sql` after `0010`. Until it exists the sync is skipped with a toast and guests are unaffected.
  - **Notes:** signing in merges rather than replaces, so favorites collected as a guest are not lost, and nothing is written while signed out. The account list is the source of truth while signed in, so removing a favorite on one device removes it everywhere; the local store is only a cache.

---

## Phase 5 — Admin & operations (COMPLETE)

- [x] **P5-01 · Admin user management UI** — priority: medium
  - Admins are currently promoted by hand in SQL. Add an invite/role screen.
  - **Acceptance:** an admin can create another admin and change roles from the UI, without being able to lock the store out of its last admin.
  - **Implementation:** `auth.users` is not reachable over PostgREST, so the list comes from the **Auth admin API** with the service-role client — `listAdminUsers()` in `src/lib/adminUsers.js` pages through `auth.admin.listUsers()` and maps each account to `{ id, email, created_at, last_sign_in_at, confirmed, role }`, sorting admins first. `setUserRole()` writes `app_metadata.role` (never `user_metadata`, which the user can edit themselves) so `middleware.js` and `requireAdmin()` see the change. `createAdminUser()` calls `auth.admin.createUser({ email_confirm: true, app_metadata: { role: "admin" } })` after the shared `parseCredentials()` rules, and maps a duplicate email to "find it in the list and use Make admin". Two protections in the UI: the signed-in admin's own row is locked, and "Make customer" is disabled while only one admin exists, so the store cannot be locked out. `src/lib/roles.js` keeps the role constants free of server imports so the client table can render labels. The new `/admin/users` page is in the admin nav.
  - **Files:** `src/lib/roles.js`, `src/lib/adminUsers.js`, `src/app/actions/setUserRole.js`, `createAdminUser.js`, `src/components/Admin/AdminUsers.jsx`, `src/app/(admin)/admin/users/page.jsx`, `src/app/(admin)/admin/layout.jsx`
  - **Notes:** no migration. Supabase's invite email is deliberately not used: the invitee would land signed in with no password and there is no password-reset flow yet, so the admin sets a password (8–72 characters) instead. Removing an account is still done in the Supabase dashboard.

- [x] **P5-02 · Dashboard analytics** — priority: medium
  - Revenue, order counts, top products, low-stock list on `/admin`.
  - **Acceptance:** `/admin` shows revenue, order counts, best sellers and the low-stock list from live data.
  - **Implementation:** `getDashboardStats()` in `src/lib/analytics.js` reads the orders' `status`/`total`/`created_at` and tallies revenue, order count, average order and a 30-day window in one pass. A **cancelled order counts towards the order tally but never towards revenue**, since that money never came in. Best sellers come from the last 30 days of non-cancelled `order_items` (with the `products ( name )` embed), grouped per product and sliced to five; lines whose product was deleted are skipped. The whole thing is plain JS over two selects rather than a SQL aggregate — fine at this size, and the comment says where the totals belong if the table grows. `/admin` was rewritten around four stat cards, an "Orders by status" badge row, and side-by-side Top products / Low stock tables (a stock of 0 shows a `destructive` badge). `orderStatusVariant()` is reused so the dashboard, admin list and customer pages speak the same colour language.
  - **Files:** `src/lib/inventory.js`, `src/lib/analytics.js`, `src/app/(admin)/admin/page.jsx`
  - **Notes:** no migration. The revenue figure is order value, not settled money — there is no gateway (P3-01 dropped), so "paid" means "not cancelled".

- [x] **P5-03 · Low-stock alerts** — priority: medium
  - Depends on P2-01. Notify when stock drops below a threshold.
  - **Acceptance:** placing an order that leaves a tracked product at or below the threshold emails the owner.
  - **Implementation:** `src/lib/inventory.js` exports `LOW_STOCK_THRESHOLD`, read once from the environment and defaulting to 5 (an unset, non-numeric or non-positive value falls back), plus `isLowStock()`. `sendLowStockEmail(items)` in `src/lib/email.js` sends the owner a two-column table (product, units left) and returns early without a key, a recipient or anything to report. `createOrder` gained a top-level `alertLowStock(supabase, items)` helper called **after** the order, the stock reservation and the coupon redemption have all succeeded, so an alert can only describe a reservation that really happened. It re-reads the lines it sold and keeps those that are tracked (`stock is not null` — an untracked `NULL` line can never run low) and at or below the threshold, covering both products and product variants (a variant is reported as "Product (Red / M)"). The whole helper is wrapped in a try/catch: the order is already placed, so a mail problem only means the owner misses one alert. The dashboard's low-stock card uses the same threshold and the same "untracked" rule.
  - **Files:** `src/lib/inventory.js`, `src/lib/email.js` (`sendLowStockEmail`), `src/app/actions/createOrder.js`, `.env.example`
  - **Requires:** optional `LOW_STOCK_THRESHOLD` environment variable (default 5). No migration.

- [x] **P5-04 · Bulk actions & CSV export** — priority: low
  - Bulk status change and CSV export for orders/products.
  - **Acceptance:** an admin can select many orders or products and change their status in one go, and download either table as CSV.
  - **Implementation:** `src/lib/csv.js` is a small writer that quotes any field containing a comma, quote or newline (and doubles embedded quotes), so a product name or an address cannot break the file; `csvResponse()` prefixes a UTF-8 BOM so Excel reads `৳` correctly, sets the download filename and `no-store`. Two **Route Handlers** export the tables — `/api/admin/export/orders` and `/api/admin/export/products`. The middleware guard only covers `/admin/*`, so each handler calls `requireAdmin()` itself and returns 401 rather than throwing. On the orders side the items are flattened into one `Product (variant) x2 | …` cell, and a product with no stock exports as "not tracked" rather than 0. Bulk actions are two server actions: `bulkUpdateProductStatus(ids, status)` validates against the three allowed statuses and updates with `.in("id", …)` in a single statement; `bulkUpdateOrderStatus(ids, status)` deliberately loops through the existing `updateOrderStatus()` **one order at a time**, so cancelling a batch still returns each order's stock through the claim-flag path and each customer still gets the usual notification — it returns `{ updated, failures }` and reports partial success honestly. Both cap the batch (200 products / 100 orders) and de-duplicate the ids. The UI is a selection bar above each list: the orders page was split into a `AdminOrdersList` client component (the server page still fetches with `getAllOrders()`), and the existing products table gained a checkbox column, a status select and an "Apply to selected" button which refetches after a successful bulk change.
  - **Files:** `src/lib/csv.js`, `src/app/api/admin/export/orders/route.js`, `src/app/api/admin/export/products/route.js`, `src/app/actions/bulkUpdateOrderStatus.js`, `bulkUpdateProductStatus.js`, `src/components/Admin/AdminOrdersList.jsx`, `src/app/(admin)/admin/orders/page.jsx`, `src/app/(admin)/admin/products/page.jsx`
  - **Notes:** no migration. The CSV export streams the whole table (no pagination), which is the point of an export; if a store ever outgrows that it should move to a paginated or streamed download.

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
| D1 | Payment provider (bKash / Nagad / SSLCommerz / other) | ~~P3-01~~ | **Resolved:** no gateway — COD only. P3-01 dropped. |
| D2 | Are customer accounts in scope, or stay guest-only? | P4-* | **Resolved:** accounts are in scope. Guest checkout stays available. |
| D3 | Is VAT/tax required for your market? | ~~P3-06~~ | **Resolved:** not required. P3-06 dropped. |
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
| 2026-10-22 | P3-03 | Shipping zones: `0008_shipping_zones.sql` adds `shipping_zones` (code, name, fee, position, active) seeded with the three previously hardcoded options; the checkout lists active zones and `createOrder` takes the fee from the zone row, so `DELIVERY_FEES` and the fixed `delivery_method` enum are gone; new `/admin/shipping` page edits name/fee inline plus pause/resume/delete; emails and the success page show the zone's name. Needs `0008_shipping_zones.sql` run in Supabase. |
| 2026-10-23 | P3-01, P3-06 | Dropped at the owner's request: no online payment gateway (COD only) and no tax/VAT line. Added a `[-]` dropped marker to the legend and closed decisions D1 and D3. |
| 2026-10-23 | P3-04 | Status notifications: `sendOrderStatusEmail(order, status)` (copy map for confirmed/shipped/delivered/cancelled, silent for `pending`) is called from both success paths of `updateOrderStatus` via a best-effort `notifyCustomer()` helper that loads the order and its items; a mail failure never fails the update. No migration needed. |
| 2026-10-23 | P3-03 (fix) | Found while reading the schema: `orders.delivery_method` still had the `0001_init.sql` check constraint listing `inside_dhaka`/`outside_dhaka`/`pickup`, but `0008_shipping_zones.sql` seeds codes with hyphens, so every order insert would have failed the constraint once that migration ran. `0008` now drops that constraint by name lookup before the RLS policies. |
| 2026-10-23 | P4-01 | Customer accounts: `/account`, `/account/login`, `/account/register` (inside the `(shop)` group so they keep the storefront chrome), email/password auth via the `signUp`/`signIn`/`signOut` server actions with shared Zod rules and per-IP rate limiting, `/auth/callback` to exchange the emailed confirmation code for a session cookie, and `middleware.js` extended to `/account/:path*` so matched pages need a session (`/admin/*` still needs the admin role) plus `getUser()` in `src/lib/supabase/server.js`. No migration needed; guest checkout is untouched. |
| 2026-10-23 | P4-02 | Order history: `0009_order_user.sql` adds `orders.user_id` (references `auth.users`, `on delete set null`) with an index and select-only RLS for `orders` (`user_id = auth.uid()`) and `order_items` (via the parent order); `createOrder` links the signed-in customer from the session cookie; new `/account/orders` reads through the session client so RLS is the enforcement point, with `getCustomerOrders()` adding a belt-and-braces `user_id` filter and a shared `orderStatusVariant()` now used by the admin list too. Needs `0009_order_user.sql` run in Supabase. |
| 2026-10-23 | P4-03 | Public order tracking: new `/track` page + `TrackOrderForm` call `lookupOrder()`, which validates the UUID and phone, is rate-limited per IP (10 tries) and compares the last ten digits so `+880…` and `01…` both match; an unknown ID and a wrong phone return the same message so order IDs cannot be enumerated, and the reply exposes only id/status/date/total (service role used because orders are admin-only under RLS). `orderStatusVariant()` and `STATUS_NOTES` moved to the dependency-free `src/lib/orderStatus.js` so the client form does not import the server-only Supabase client. `/order-success` gained a "Track this order" button. No migration. |
| 2026-10-23 | P4-04 | Address book: `0010_addresses.sql` adds `public.addresses` with four `user_id = auth.uid()` RLS policies; `src/lib/addresses.js` holds the shared Zod rules, `ADDRESS_COLUMNS` and `addressKey()` duplicate detection; `createAddress`/`deleteAddress` write through the customer's own session client (RLS is the enforcement point, no service role); new `/account/addresses` page with `AddressBook`, and checkout now prefills the newest saved address, offers the rest as tap-to-fill buttons and shows a signed-in-only "save this address" checkbox whose write runs after the order is placed and never blocks it. Needs `0010_addresses.sql` run after `0009`. |
| 2026-10-23 | P4-05 | Account wishlist: `0011_favorites.sql` adds `public.favorites` keyed `(user_id, product_id)` with select/insert/delete RLS and a cascade from `products`; `loadFavorites()` reads it and `pushFavorites(ids)` diffs and writes back only the added/removed ids; `parseFavoriteIds()` keeps only valid product UUIDs (cap 200); `favoritesStore` gained `setIds()`; a silent `FavoritesSync` in the `(shop)` layout merges the browser's list into the account on login and mirrors every later change, while `LogOutButton` clears the local list on sign-out. Guests keep the old localStorage behaviour. Needs `0011_favorites.sql` run after `0010`. |
| 2026-10-23 | P5-01 | Admin user management: `listAdminUsers()` reads accounts through the Auth admin API (the only way to see `auth.users`), `setUserRole()` writes `app_metadata.role` so `middleware.js`/`requireAdmin()` see it, and `createAdminUser()` creates a confirmed admin with a set password. New `/admin/users` table locks your own row and refuses to demote the last admin, so the store cannot be locked out of its own dashboard. `src/lib/roles.js` keeps role constants importable from a client component. No migration. |
| 2026-10-23 | P5-02 | Dashboard analytics: `getDashboardStats()` tallies revenue, order counts, average order and a 30-day window from `orders` (cancelled orders count as orders but never as revenue), builds the top-five products from the last 30 days of non-cancelled `order_items`, and lists low stock from `products`; `/admin` rewritten around stat cards, an orders-by-status row and the two tables. No migration. |
| 2026-10-23 | P5-03 | Low-stock alerts: `src/lib/inventory.js` exposes `LOW_STOCK_THRESHOLD` (env, default 5) and `isLowStock()`; `sendLowStockEmail()` mails the owner a product/units table; `createOrder` calls a best-effort `alertLowStock()` after the order, its stock reservation and any coupon redemption have all succeeded, re-reading the sold lines so only genuinely tracked, truly low lines (products or variants) are reported. Optional `LOW_STOCK_THRESHOLD` added to `.env.example`. No migration. |
| 2026-10-23 | P5-04 | Bulk actions & CSV export: new `src/lib/csv.js` (RFC-style quoting plus a UTF-8 BOM so Excel reads `৳`) behind two self-guarding Route Handlers at `/api/admin/export/orders` and `/api/admin/export/products` — the middleware only covers `/admin/*`, so each calls `requireAdmin()` and returns 401; `bulkUpdateProductStatus()` updates many products in one statement, while `bulkUpdateOrderStatus()` loops through the existing `updateOrderStatus()` so a batch cancel still restocks and still notifies, returning `{ updated, failures }`. The orders page moved into a `AdminOrdersList` client component and the products table gained a checkbox column, a status select and an "Apply to selected" button. No migration. |
