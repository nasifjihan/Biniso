# Biniso — Setup & Runbook

## 1. Install dependencies

```bash
npm install
```

## 2. Configure environment

Copy `.env.example` to `.env.local` and fill in the values.

| Variable                        | Where to get it                                      |
| ------------------------------- | ---------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase → Project Settings → API                    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API                    |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase → Project Settings → API (server-only)       |
| `CLOUDINARY_CLOUD_NAME`         | Cloudinary → Dashboard → API Keys                     |
| `CLOUDINARY_API_KEY`            | Cloudinary → Dashboard → API Keys                     |
| `CLOUDINARY_API_SECRET`         | Cloudinary → Dashboard → API Keys                     |
| `RESEND_API_KEY`                | Resend → API Keys                                     |
| `ORDER_FROM_EMAIL`              | A verified sender in Resend                           |
| `ORDER_RECEIVER_EMAIL`          | Inbox that receives new-order notifications           |
| `NEXT_PUBLIC_STORE_*`           | Store name / address / phone printed on invoices      |

`SUPABASE_SERVICE_ROLE_KEY` is used only by the checkout server action so guests
can place orders without an account. Never expose it to the browser.

## 3. Create the database

Run [supabase/migrations/0001_init.sql](supabase/migrations/0001_init.sql) in the
Supabase SQL Editor. It creates the `products`, `orders` and `order_items` tables
along with the Row Level Security policies.

## 4. Create the admin user

1. Supabase → Authentication → Users → Add user (email + password).
2. Mark that user as admin by running the `update auth.users ...` statement at the
   bottom of the migration file.

Only users whose `app_metadata.role` is `admin` can reach `/admin`.

## 5. Run

```bash
npm run dev
```

- Storefront: http://localhost:3000
- Admin: http://localhost:3000/admin

## Project layout

- `src/app/(shop)` — public storefront
- `src/app/(admin)` — admin dashboard (protected by `src/middleware.js`)
- `src/app/actions` — server actions (orders, products)
- `src/app/api/upload` — Cloudinary image upload endpoint
- `src/lib/supabase` — Supabase clients (browser / server / service-role)
- `src/lib` — data helpers, email, Cloudinary, utils
- `src/store` — Zustand cart & favorites stores

## Original bootstrap commands

```bash
npx create-next-app@latest biniso
npx shadcn@latest init
npm install @supabase/supabase-js @supabase/ssr
npm install zustand
npm i next-cloudinary
npm install resend
npm i axios
npm install react-to-print
```
