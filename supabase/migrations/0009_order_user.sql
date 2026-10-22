-- Biniso: link orders to the customer account that placed them
-- Run once in the Supabase SQL Editor after 0008_shipping_zones.sql.

alter table public.orders
  add column if not exists user_id uuid references auth.users (id) on delete set null;

create index if not exists orders_user_id_idx on public.orders (user_id);

-- Customers read their own orders. Orders placed as a guest have no user_id, so
-- they stay admin-only and are still reachable through the emailed order id.
drop policy if exists "orders own read" on public.orders;
create policy "orders own read"
  on public.orders for select
  to authenticated
  using (user_id = auth.uid());

-- The items of those orders, reached through the parent order. The subquery also
-- runs under the policy above, so it can only see the customer's own orders.
drop policy if exists "order_items own read" on public.order_items;
create policy "order_items own read"
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1
      from public.orders o
      where o.id = order_items.order_id
        and o.user_id = auth.uid()
    )
  );
