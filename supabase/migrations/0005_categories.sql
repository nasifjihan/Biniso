-- Biniso: categories as first-class data
-- Run once in the Supabase SQL Editor after 0004_product_images.sql.

create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  created_at timestamptz not null default now()
);

-- Seed from the free-text products.category column so existing values survive.
with raw as (
  select distinct trim(category) as name
    from public.products
   where category is not null
     and trim(category) <> ''
),
slugged as (
  select name,
         coalesce(
           nullif(
             trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')),
             ''
           ),
           'category'
         ) as base
    from raw
),
numbered as (
  select name,
         base,
         row_number() over (partition by base order by name) as rn
    from slugged
)
insert into public.categories (name, slug)
select name,
       case when rn = 1 then base else base || '-' || rn end
  from numbered
on conflict (slug) do nothing;

alter table public.products
  add column if not exists category_id uuid
    references public.categories (id) on delete set null;

update public.products p
   set category_id = c.id
  from public.categories c
 where p.category_id is null
   and lower(c.name) = lower(trim(p.category));

create index if not exists products_category_id_idx
  on public.products (category_id);

-- The reference above replaces the free-text column.
alter table public.products drop column if exists category;

alter table public.categories enable row level security;

-- Categories are public reference data; only admins may change them.
drop policy if exists "categories public read" on public.categories;
create policy "categories public read"
  on public.categories for select
  to anon, authenticated
  using (true);

drop policy if exists "categories admin write" on public.categories;
create policy "categories admin write"
  on public.categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
