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

- [ ] **P2-01 · Inventory / stock tracking** — priority: high
  - There is no stock column, so overselling is possible.
  - Add `stock` to `products`, decrement on order, block add-to-cart when out of stock, show stock in admin.
  - **Acceptance:** ordering beyond available stock is rejected; stock decrements atomically.
  - **Files:** new migration, `src/app/actions/createOrder.js`, admin product form, `ProductCard`

- [ ] **P2-02 · Product variants (size / color / SKU)** — priority: medium
  - Only one flat price and image per product.
  - Add a `product_variants` table (sku, attributes, price delta, stock) and variant selection on the detail page.
  - **Acceptance:** a product can have multiple selectable variants priced independently.

- [ ] **P2-03 · Multiple images / gallery** — priority: medium
  - `products.image` is a single URL.
  - Add `product_images` (ordered) and a gallery with thumbnails.
  - **Acceptance:** products can show a gallery; first image remains the card thumbnail.

- [ ] **P2-04 · Categories as data** — priority: medium
  - `category` is free text, so typos fragment the category list.
  - Add a `categories` table, reference it from products, and drive menu/search from it.
  - **Acceptance:** categories are managed in admin and reused everywhere.

- [ ] **P2-05 · Pagination, filtering & sorting** — priority: medium
  - `/products` loads the entire table; search is capped at 12 results.
  - Add server-side pagination plus category/price/status filters and sort options.
  - **Acceptance:** catalog stays fast with hundreds of products.

- [ ] **P2-06 · Dedicated search results page** — priority: low
  - Search is a dropdown only.
  - Add `/search?q=` with the full result set and pagination.
  - **Acceptance:** searching returns a shareable, paginated results page.

---

## Phase 3 — Commerce

- [ ] **P3-01 · Online payment gateway** — priority: high · **BLOCKED: pick provider**
  - Checkout is cash-on-delivery only.
  - Integrate a BD gateway (bKash / Nagad / SSLCommerz) as a second payment method with a webhook to confirm payment.
  - **Acceptance:** paid orders are marked paid automatically; COD still works.
  - **Files:** new `src/app/api/payments/*`, migration for `payment_*` columns, checkout UI

- [ ] **P3-02 · Coupons / discount codes** — priority: medium
  - Add a `coupons` table (code, type, value, min order, expiry, usage limit) and apply at checkout.
  - **Acceptance:** a valid code reduces the total; invalid/expired codes are rejected server-side.

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
| D2 | Are customer accounts in scope, or stay guest-only? | P4-* | Guest-only is simpler; accounts unlock history and tracking. |
| D3 | Is VAT/tax required for your market? | P3-06 | Skip if not applicable. |
| D4 | Production host (Vercel / other) and domain | P1-01, P6-06 | Needed for canonical URLs, sitemap and env config. |
| D5 | Do you need product variants, or is one price per product enough? | P2-02 | Adds meaningful schema and UI work. |

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
