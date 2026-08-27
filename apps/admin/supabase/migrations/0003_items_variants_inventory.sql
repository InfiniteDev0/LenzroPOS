-- Run this in the Supabase SQL editor (Project > SQL Editor > New query).
-- Every statement here is idempotent (if-not-exists / if-exists guards) so
-- it's safe to re-run in full even if a previous attempt partially applied.
--
-- Phase 1/2 roadmap revision: adds cost + sold_by + available_for_sale +
-- track_stock to items (replacing the old single `active` flag), item
-- variants (options like Size: Small/Medium/Large), and the simplified
-- inventory model (a running quantity per item, moved by "add stock" /
-- "adjust count" actions — no recipe/composite deduction).

alter table public.items
  add column if not exists cost numeric(10, 2) check (cost is null or cost >= 0),
  add column if not exists sold_by text not null default 'each' check (sold_by in ('each', 'weight')),
  add column if not exists available_for_sale boolean not null default true,
  add column if not exists track_stock boolean not null default false;

-- Replaces the old single `active` flag with two independent ones:
-- available_for_sale (shows as a button on the POS sales screen) and
-- track_stock (shows as a row in Inventory). A made-to-order item like
-- Cappuccino is sale:true/track:false; a raw material like sugar is
-- sale:false/track:true. Safe to run whether `active` still exists,
-- already got migrated, or never existed on this database at all.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'items' and column_name = 'active'
  ) then
    update public.items set available_for_sale = active;
    alter table public.items drop column active;
  end if;
end $$;

-- Item variants (e.g. option "Size" with values Small/Medium/Large).
-- No account_id column of their own — scoped via the parent item's account.
create table if not exists public.item_variants (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items (id) on delete cascade,
  option_name text not null,
  created_at timestamptz not null default now()
);

create index if not exists item_variants_item_id_idx on public.item_variants (item_id);

alter table public.item_variants enable row level security;

drop policy if exists "Account can view own item variants" on public.item_variants;
create policy "Account can view own item variants"
  on public.item_variants for select
  using (exists (
    select 1 from public.items where items.id = item_variants.item_id and items.account_id = auth.uid()
  ));

drop policy if exists "Account can insert own item variants" on public.item_variants;
create policy "Account can insert own item variants"
  on public.item_variants for insert
  with check (exists (
    select 1 from public.items where items.id = item_variants.item_id and items.account_id = auth.uid()
  ));

drop policy if exists "Account can update own item variants" on public.item_variants;
create policy "Account can update own item variants"
  on public.item_variants for update
  using (exists (
    select 1 from public.items where items.id = item_variants.item_id and items.account_id = auth.uid()
  ));

drop policy if exists "Account can delete own item variants" on public.item_variants;
create policy "Account can delete own item variants"
  on public.item_variants for delete
  using (exists (
    select 1 from public.items where items.id = item_variants.item_id and items.account_id = auth.uid()
  ));

-- Values for a variant option (e.g. "Small", "Medium", "Large"), with an
-- optional per-value price override.
create table if not exists public.item_variant_values (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.item_variants (id) on delete cascade,
  value text not null,
  price_override numeric(10, 2) check (price_override is null or price_override >= 0),
  created_at timestamptz not null default now()
);

create index if not exists item_variant_values_variant_id_idx on public.item_variant_values (variant_id);

alter table public.item_variant_values enable row level security;

drop policy if exists "Account can view own item variant values" on public.item_variant_values;
create policy "Account can view own item variant values"
  on public.item_variant_values for select
  using (exists (
    select 1 from public.item_variants
    join public.items on items.id = item_variants.item_id
    where item_variants.id = item_variant_values.variant_id and items.account_id = auth.uid()
  ));

drop policy if exists "Account can insert own item variant values" on public.item_variant_values;
create policy "Account can insert own item variant values"
  on public.item_variant_values for insert
  with check (exists (
    select 1 from public.item_variants
    join public.items on items.id = item_variants.item_id
    where item_variants.id = item_variant_values.variant_id and items.account_id = auth.uid()
  ));

drop policy if exists "Account can update own item variant values" on public.item_variant_values;
create policy "Account can update own item variant values"
  on public.item_variant_values for update
  using (exists (
    select 1 from public.item_variants
    join public.items on items.id = item_variants.item_id
    where item_variants.id = item_variant_values.variant_id and items.account_id = auth.uid()
  ));

drop policy if exists "Account can delete own item variant values" on public.item_variant_values;
create policy "Account can delete own item variant values"
  on public.item_variant_values for delete
  using (exists (
    select 1 from public.item_variants
    join public.items on items.id = item_variants.item_id
    where item_variants.id = item_variant_values.variant_id and items.account_id = auth.uid()
  ));

-- Current stock level, one row per item (1:1 — item_id is the primary key).
create table if not exists public.stock_levels (
  item_id uuid primary key references public.items (id) on delete cascade,
  quantity numeric(10, 2) not null default 0,
  low_stock_threshold numeric(10, 2) check (low_stock_threshold is null or low_stock_threshold >= 0),
  updated_at timestamptz not null default now()
);

alter table public.stock_levels enable row level security;

drop policy if exists "Account can view own stock levels" on public.stock_levels;
create policy "Account can view own stock levels"
  on public.stock_levels for select
  using (exists (
    select 1 from public.items where items.id = stock_levels.item_id and items.account_id = auth.uid()
  ));

drop policy if exists "Account can update own stock levels" on public.stock_levels;
create policy "Account can update own stock levels"
  on public.stock_levels for update
  using (exists (
    select 1 from public.items where items.id = stock_levels.item_id and items.account_id = auth.uid()
  ));

-- No insert/delete policy for stock_levels: rows are only ever created by
-- the trigger below (on item insert) and removed via cascade (on item
-- delete), never directly by a client.

-- Every new item automatically gets a stock_levels row starting at 0 — the
-- Inventory page always has something to show, and "add stock"/"adjust
-- count" always have a row to act on.
create or replace function public.create_stock_level_for_item()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.stock_levels (item_id, quantity) values (new.id, 0);
  return new;
end;
$$;

drop trigger if exists items_create_stock_level on public.items;
create trigger items_create_stock_level
  after insert on public.items
  for each row execute procedure public.create_stock_level_for_item();

-- Backfill: the trigger above only fires on future inserts, so any items
-- created before this migration need a stock_levels row too.
insert into public.stock_levels (item_id, quantity)
select id, 0 from public.items
on conflict (item_id) do nothing;

-- Audit log of every stock change. type='add' means "received N more units"
-- (adds to the running quantity); type='adjust' means "the actual count is
-- N right now" (sets the quantity outright) — e.g. an end-of-day recount or
-- marking something out of stock.
create table if not exists public.stock_adjustments (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items (id) on delete cascade,
  type text not null check (type in ('add', 'adjust')),
  quantity numeric(10, 2) not null check (quantity >= 0),
  note text,
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now()
);

create index if not exists stock_adjustments_item_id_idx on public.stock_adjustments (item_id);

alter table public.stock_adjustments enable row level security;

drop policy if exists "Account can view own stock adjustments" on public.stock_adjustments;
create policy "Account can view own stock adjustments"
  on public.stock_adjustments for select
  using (exists (
    select 1 from public.items where items.id = stock_adjustments.item_id and items.account_id = auth.uid()
  ));

drop policy if exists "Account can insert own stock adjustments" on public.stock_adjustments;
create policy "Account can insert own stock adjustments"
  on public.stock_adjustments for insert
  with check (exists (
    select 1 from public.items where items.id = stock_adjustments.item_id and items.account_id = auth.uid()
  ));

-- Applying a stock_adjustments row updates the cached stock_levels.quantity
-- so reads stay a simple, fast single-row lookup instead of a running SUM.
create or replace function public.apply_stock_adjustment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.type = 'add' then
    update public.stock_levels
      set quantity = quantity + new.quantity, updated_at = now()
      where item_id = new.item_id;
  else
    update public.stock_levels
      set quantity = new.quantity, updated_at = now()
      where item_id = new.item_id;
  end if;
  return new;
end;
$$;

drop trigger if exists stock_adjustments_apply on public.stock_adjustments;
create trigger stock_adjustments_apply
  after insert on public.stock_adjustments
  for each row execute procedure public.apply_stock_adjustment();
