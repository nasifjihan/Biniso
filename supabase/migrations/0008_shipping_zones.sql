-- Biniso: delivery zones and their fees
-- Run once in the Supabase SQL Editor after 0007_coupons.sql.

create table if not exists public.shipping_zones (
  id         uuid primary key default gen_random_uuid(),
  -- Derived from the name. Orders store this code when the option is chosen.
  code       text not null unique,
  name       text not null,
  fee        numeric(12,2) not null default 0 check (fee >= 0),
  -- Display order of the options at checkout.
  position   integer not null default 0,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

-- The three options that used to be hardcoded in the code and the checkout page.
insert into public.shipping_zones (code, name, fee, position)
values
  ('inside-dhaka', 'Inside Dhaka', 60, 1),
  ('outside-dhaka', 'Outside Dhaka', 120, 2),
  ('pickup', 'Store pickup', 0, 3)
on conflict (code) do nothing;

-- Orders used to store one of three fixed method names, but they now store
-- whatever code a zone has. Drop that old list so the new codes are accepted.
do $$
declare c text;
begin
  select conname into c
  from pg_constraint
  where conrelid = 'public.orders'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%delivery_method%';

  if c is not null then
    execute format('alter table public.orders drop constraint %I', c);
  end if;
end $$;

alter table public.shipping_zones enable row level security;

-- Customers pick a delivery option at checkout, so any active zone is readable.
-- Paused zones stay readable only to admins.
drop policy if exists "shipping zones public read" on public.shipping_zones;
create policy "shipping zones public read"
  on public.shipping_zones for select
  using (active);

drop policy if exists "shipping zones admin write" on public.shipping_zones;
create policy "shipping zones admin write"
  on public.shipping_zones for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
