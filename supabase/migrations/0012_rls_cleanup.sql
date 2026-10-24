-- 0012_rls_cleanup.sql
--
-- Removes permissive row-level-security policies that predate the migrations.
-- They were left behind by the original hand-created schema, and because
-- Postgres ORs permissive policies together, a single `using (true)` policy
-- makes every correctly written `is_admin()` policy on the same table useless.
--
-- Before this migration an anonymous visitor could read every order, and any
-- signed-up customer could update any order or rewrite the whole catalogue.
--
-- Every policy created by 0001-0011 is kept. On a database built purely from
-- the migrations this file is a no-op.

-- orders: anon read, anon insert, and any-logged-in-user read/update
drop policy if exists "public can read orders" on public.orders;
drop policy if exists "public can insert orders" on public.orders;
drop policy if exists "auth can read orders" on public.orders;
drop policy if exists "auth can update orders" on public.orders;

-- order_items: anon read, anon insert, and any-logged-in-user read
drop policy if exists "public can read order items" on public.order_items;
drop policy if exists "public can insert order items" on public.order_items;
drop policy if exists "auth can read order_items" on public.order_items;

-- products: any-logged-in-user write of everything, any-logged-in-user read of
-- inactive products, anon insert, and a redundant active-only read policy
-- ("products public read" from 0001 already covers active-only reads).
drop policy if exists "admin manage products" on public.products;
drop policy if exists "auth can read products" on public.products;
drop policy if exists "dev allow anon insert products" on public.products;
drop policy if exists "public read active products" on public.products;

-- What remains, per table:
--   orders         admin read/update/delete + own read        (0001, 0009)
--   order_items    admin all + own read                       (0001, 0009)
--   products       public read (active only) + admin write    (0001)
--   everything else as defined by 0003-0011
--
-- Order creation is unaffected: createOrder uses the service-role client, which
-- bypasses RLS entirely, so no anon INSERT policy is needed.
