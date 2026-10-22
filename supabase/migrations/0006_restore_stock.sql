-- Biniso: return reserved stock to the catalog when an order is cancelled
-- Run once in the Supabase SQL Editor after 0005_categories.sql.

-- Set once per order, the first time its stock is returned. It is what stops a
-- cancelled order from restocking the same items twice (re-cancelling, or
-- moving the order out of "cancelled" and back).
alter table public.orders
  add column if not exists stock_restored boolean not null default false;

-- Inverse of decrement_stock: adds the ordered quantities back. A line whose
-- stock is NULL (not tracked) is left untouched, so untracked products keep
-- their NULL and never become tracked.
create or replace function public.restore_stock(items jsonb)
returns void
language plpgsql
as $$
declare
  item jsonb;
  pid  uuid;
  vid  uuid;
  qty  integer;
begin
  for item in select * from jsonb_array_elements(items)
  loop
    pid := nullif(item ->> 'product_id', '')::uuid;
    vid := nullif(item ->> 'variant_id', '')::uuid;
    qty := coalesce((item ->> 'quantity')::integer, 0);

    if qty <= 0 then
      continue;
    end if;

    if vid is not null then
      update public.product_variants
         set stock = stock + qty
       where id = vid
         and stock is not null;
    elsif pid is not null then
      update public.products
         set stock = stock + qty
       where id = pid
         and stock is not null;
    end if;
  end loop;
end;
$$;

-- Same lockdown as decrement_stock: only the server (service role) may call it.
revoke all on function public.restore_stock(jsonb) from public;
grant execute on function public.restore_stock(jsonb) to service_role;
