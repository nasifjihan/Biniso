-- Biniso: product variants (size / colour / SKU)
-- Run once in the Supabase SQL Editor after 0002_stock.sql.

create table if not exists public.product_variants (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  -- e.g. {"Color": "Red", "Size": "M"}
  attributes jsonb not null default '{}'::jsonb,
  sku        text,
  -- NULL price falls back to products.price.
  price      numeric(12,2) check (price is null or price >= 0),
  -- NULL stock means "not tracked". A product that has variants tracks stock
  -- per variant and ignores products.stock.
  stock      integer check (stock is null or stock >= 0),
  created_at timestamptz not null default now()
);

create index if not exists product_variants_product_id_idx
  on public.product_variants (product_id);

create unique index if not exists product_variants_product_sku_idx
  on public.product_variants (product_id, sku)
  where sku is not null;

-- order_items keeps a snapshot of the variant that was bought.
alter table public.order_items
  add column if not exists variant_id uuid
    references public.product_variants (id) on delete set null;
alter table public.order_items
  add column if not exists variant_label text;

alter table public.product_variants enable row level security;

-- Same shape as products: visible when the parent product is public.
drop policy if exists "product_variants public read" on public.product_variants;
create policy "product_variants public read"
  on public.product_variants for select
  to anon, authenticated
  using (
    exists (
      select 1
        from public.products p
       where p.id = product_id
         and (p.status = 'active' or public.is_admin())
    )
  );

drop policy if exists "product_variants admin write" on public.product_variants;
create policy "product_variants admin write"
  on public.product_variants for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- decrement_stock now understands variant lines. A line with a variant_id
-- decrements that variant, otherwise the product.
create or replace function public.decrement_stock(items jsonb)
returns void
language plpgsql
as $$
declare
  item    jsonb;
  pid     uuid;
  vid     uuid;
  qty     integer;
  updated integer;
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
         set stock = stock - qty
       where id = vid
         and stock is not null
         and stock >= qty;
      get diagnostics updated = row_count;

      if updated = 0 and exists (
        select 1
          from public.product_variants
         where id = vid
           and stock is not null
           and stock < qty
      ) then
        raise exception 'insufficient_stock:%', coalesce(vid, pid);
      end if;
    elsif pid is not null then
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
    end if;
  end loop;
end;
$$;

revoke all on function public.decrement_stock(jsonb) from public;
grant execute on function public.decrement_stock(jsonb) to service_role;
