-- Biniso: account-synced wishlist (favorites)
-- Run once in the Supabase SQL Editor after 0010_addresses.sql.

create table if not exists public.favorites (
  user_id    uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  -- One row per customer per product, so starring twice cannot duplicate.
  primary key (user_id, product_id)
);

create index if not exists favorites_user_idx
  on public.favorites (user_id, created_at desc);

alter table public.favorites enable row level security;

-- A favorite belongs to exactly one customer, so all three policies are the
-- same `user_id = auth.uid()` check and nothing is readable by guests.
drop policy if exists "favorites own read" on public.favorites;
create policy "favorites own read"
  on public.favorites for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "favorites own insert" on public.favorites;
create policy "favorites own insert"
  on public.favorites for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "favorites own delete" on public.favorites;
create policy "favorites own delete"
  on public.favorites for delete
  to authenticated
  using (user_id = auth.uid());
