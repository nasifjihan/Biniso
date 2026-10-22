-- Biniso: saved delivery addresses for signed-in customers
-- Run once in the Supabase SQL Editor after 0009_order_user.sql.

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text,
  name text not null,
  phone text not null,
  address text not null,
  city text,
  created_at timestamptz not null default now()
);

create index if not exists addresses_user_idx
  on public.addresses (user_id, created_at desc);

alter table public.addresses enable row level security;

-- An address belongs to exactly one customer, so every policy is the same
-- `user_id = auth.uid()` check and nothing is readable by guests.
drop policy if exists "addresses own read" on public.addresses;
create policy "addresses own read"
  on public.addresses for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "addresses own insert" on public.addresses;
create policy "addresses own insert"
  on public.addresses for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "addresses own update" on public.addresses;
create policy "addresses own update"
  on public.addresses for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "addresses own delete" on public.addresses;
create policy "addresses own delete"
  on public.addresses for delete
  to authenticated
  using (user_id = auth.uid());
