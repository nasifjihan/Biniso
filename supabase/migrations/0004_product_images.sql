-- Biniso: product image gallery
-- Run once in the Supabase SQL Editor after 0003_variants.sql.

create table if not exists public.product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url        text not null,
  -- Gallery order; products.image stays the card thumbnail.
  position   integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists product_images_product_id_idx
  on public.product_images (product_id, position);

-- Uploading the same picture twice should not create a second row.
create unique index if not exists product_images_product_url_idx
  on public.product_images (product_id, url);

alter table public.product_images enable row level security;

-- Same shape as products: visible when the parent product is public.
drop policy if exists "product_images public read" on public.product_images;
create policy "product_images public read"
  on public.product_images for select
  to anon, authenticated
  using (
    exists (
      select 1
        from public.products p
       where p.id = product_id
         and (p.status = 'active' or public.is_admin())
    )
  );

drop policy if exists "product_images admin write" on public.product_images;
create policy "product_images admin write"
  on public.product_images for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
