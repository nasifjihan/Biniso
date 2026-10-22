-- Biniso: coupons / discount codes
-- Run once in the Supabase SQL Editor after 0006_restore_stock.sql.

create table if not exists public.coupons (
  id          uuid primary key default gen_random_uuid(),
  -- Stored upper case; the server normalises whatever the customer types.
  code        text not null unique,
  -- 'percent' takes value % off the subtotal, 'fixed' takes value ৳ off it.
  type        text not null check (type in ('percent', 'fixed')),
  value       numeric(12,2) not null check (value > 0),
  -- Subtotal the order must reach before the code applies.
  min_order   numeric(12,2) not null default 0 check (min_order >= 0),
  -- NULL means the code never expires.
  expires_at  timestamptz,
  -- NULL means unlimited redemptions.
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  used_count  integer not null default 0 check (used_count >= 0),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Orders remember the code they used and how much it took off.
alter table public.orders
  add column if not exists coupon_code text;
alter table public.orders
  add column if not exists discount numeric(12,2) not null default 0;

alter table public.orders
  drop constraint if exists orders_discount_non_negative;
alter table public.orders
  add constraint orders_discount_non_negative check (discount >= 0);

alter table public.coupons enable row level security;

-- Coupons are never publicly readable: a customer must not be able to list
-- every code. The checkout server actions look them up with the service role.
drop policy if exists "coupons admin read" on public.coupons;
create policy "coupons admin read"
  on public.coupons for select
  to authenticated
  using (public.is_admin());

drop policy if exists "coupons admin write" on public.coupons;
create policy "coupons admin write"
  on public.coupons for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Counts one redemption, refusing once the code is expired, switched off or
-- out of uses. Doing the check and the increment in one statement is what
-- stops two orders from claiming the last remaining use at the same time.
create or replace function public.redeem_coupon(coupon_code text)
returns boolean
language plpgsql
as $$
declare
  updated integer;
begin
  update public.coupons
     set used_count = used_count + 1
   where code = coupon_code
     and active
     and (expires_at is null or expires_at > now())
     and (usage_limit is null or used_count < usage_limit);

  get diagnostics updated = row_count;

  return updated > 0;
end;
$$;

-- Only the checkout server action (service role) may redeem a code.
revoke all on function public.redeem_coupon(text) from public;
grant execute on function public.redeem_coupon(text) to service_role;
