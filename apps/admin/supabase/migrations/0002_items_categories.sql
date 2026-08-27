-- Run this in the Supabase SQL editor (Project > SQL Editor > New query).
-- Phase 1: Items & Categories — the foundational entity that inventory,
-- orders/receipts, and customer tickets will reference in later phases.

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists categories_account_id_idx on public.categories (account_id);

alter table public.categories enable row level security;

drop policy if exists "Account can view own categories" on public.categories;
create policy "Account can view own categories"
  on public.categories for select
  using (auth.uid() = account_id);

drop policy if exists "Account can insert own categories" on public.categories;
create policy "Account can insert own categories"
  on public.categories for insert
  with check (auth.uid() = account_id);

drop policy if exists "Account can update own categories" on public.categories;
create policy "Account can update own categories"
  on public.categories for update
  using (auth.uid() = account_id);

drop policy if exists "Account can delete own categories" on public.categories;
create policy "Account can delete own categories"
  on public.categories for delete
  using (auth.uid() = account_id);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete restrict,
  name text not null,
  price numeric(10, 2) not null default 0 check (price >= 0),
  sku text,
  barcode text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists items_account_id_idx on public.items (account_id);
create index if not exists items_category_id_idx on public.items (category_id);

alter table public.items enable row level security;

drop policy if exists "Account can view own items" on public.items;
create policy "Account can view own items"
  on public.items for select
  using (auth.uid() = account_id);

drop policy if exists "Account can insert own items" on public.items;
create policy "Account can insert own items"
  on public.items for insert
  with check (auth.uid() = account_id);

drop policy if exists "Account can update own items" on public.items;
create policy "Account can update own items"
  on public.items for update
  using (auth.uid() = account_id);

drop policy if exists "Account can delete own items" on public.items;
create policy "Account can delete own items"
  on public.items for delete
  using (auth.uid() = account_id);

-- An item's category must belong to the same account — otherwise the FK
-- alone would let one account point an item at another account's category.
create or replace function public.check_item_category_account()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.categories
    where id = new.category_id and account_id = new.account_id
  ) then
    raise exception 'category_id must belong to the same account';
  end if;
  return new;
end;
$$;

drop trigger if exists items_category_account_check on public.items;
create trigger items_category_account_check
  before insert or update on public.items
  for each row execute procedure public.check_item_category_account();
