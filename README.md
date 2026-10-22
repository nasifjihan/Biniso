# Biniso

An e-commerce storefront for Bangladesh (৳ BDT) built with Next.js 16 (App
Router), Supabase, Tailwind CSS and shadcn/ui.

- **Storefront** — home with search & categories, product listing, product
  details, cart, favorites, cash-on-delivery checkout and order confirmation.
- **Admin** — order management with status updates and printable invoices, plus
  product CRUD with Cloudinary image uploads.

## Tech stack

| Area      | Choice                                                        |
| --------- | ------------------------------------------------------------- |
| Framework | Next.js 16 (App Router) + React 19                            |
| Styling   | Tailwind CSS v4 + shadcn/ui                                   |
| Database  | Supabase (Postgres) with Row Level Security                   |
| Auth      | Supabase Auth (email/password) — admins via `app_metadata.role` |
| State     | Zustand (cart & favorites, persisted to localStorage)         |
| Images    | Cloudinary                                                    |
| Email     | Resend                                                        |

## Getting started

1. `npm install`
2. Copy `.env.example` → `.env.local` and fill in the values.
3. Run `supabase/migrations/0001_init.sql` in the Supabase SQL Editor.
4. Create an admin user and set its `app_metadata.role` to `admin` (see the
   comment at the bottom of the migration file).
5. `npm run dev` → http://localhost:3000

Full details, including the environment variable reference, are in
[Step.md](Step.md).

## Security model

- `/admin/*` is guarded by `middleware.js`, which requires an authenticated user
  with `app_metadata.role = 'admin'`.
- Supabase RLS keeps `products` publicly readable (active items only) while all
  writes and all `orders` / `order_items` access are admin-only.
- Guest checkout writes use the service-role key inside a server action, so the
  key never reaches the browser and order prices are always read from the
  database rather than the client cart.
