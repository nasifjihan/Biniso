-- Biniso: inventory / stock tracking
-- Run once in the Supabase SQL Editor after 0001_init.sql.

alter table public.products
  add column if not exists stock integer;

-- NULL means "stock is not tracked" for this product (treated as always available).
-- Existing rows stay NULL so the storefront does not go out of stock on migration.
alter table public.products
  drop constraint if exists products_stock_non_negative;
alter table public.products
  add constraint products_stock_non_negative check (stock is null or stock >= 0);

-- Atomically decrement stock for a set of ordered line items.
-- `items` is a jsonb array of { "product_id": uuid, "quantity": int }.
-- Products with a NULL stock are skipped (not tracked).
-- Raises an exception if any tracked product has insufficient stock, which rolls
-- back every change made by this call, so an order either reserves all of its
-- stock or none of it.
create or replace function public.decrement_stock(items jsonb)
returns void
language plpgsql
as $$
declare
  item    jsonb;
  pid     uuid;
  qty     integer;
  updated integer;
begin
  for item in select * from jsonb_array_elements(items)
  loop
    pid := (item ->> 'product_id')::uuid;
    qty := coalesce((item ->> 'quantity')::integer, 0);

    if pid is null or qty <= 0 then
      continue;
    end if;

    update public.products
       set stock = stock - qty
     where id = pid
       and stock is not null
       and stock >= qty;
    get diagnostics updated = row_count;

    if updated = 0 and exists (
      select 1
        from public.products
       where id = pid
         and stock is not null
         and stock < qty
    ) then
      raise exception 'insufficient_stock:%', pid;
    end if;
  end loop;
end;
$$;

-- Only the checkout server action (service role) may call this. Revoking from
-- PUBLIC stops the storefront from reaching it through PostgREST's /rpc endpoint.
revoke all on function public.decrement_stock(jsonb) from public;
grant execute on function public.decrement_stock(jsonb) to service_role;
