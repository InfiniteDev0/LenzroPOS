-- Run this in the Supabase SQL editor (Project > SQL Editor > New query).
-- Every statement here is idempotent, safe to re-run in full.
--
-- Phase 3: orders rung up on the POS app. Append-only sales log — no
-- update/delete policies, since editing a rung-up order should go through
-- a void/refund flow later (Phase 4+), not silently mutating history.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  status text not null default 'completed' check (status in ('completed', 'voided')),
  subtotal numeric(10, 2) not null default 0 check (subtotal >= 0),
  tax numeric(10, 2) not null default 0 check (tax >= 0),
  total numeric(10, 2) not null default 0 check (total >= 0),
  payment_method text not null default 'cash' check (payment_method in ('cash', 'card', 'mobile')),
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now()
);

create index if not exists orders_account_id_idx on public.orders (account_id);

alter table public.orders enable row level security;

drop policy if exists "Account can view own orders" on public.orders;
create policy "Account can view own orders"
  on public.orders for select
  using (auth.uid() = account_id);

drop policy if exists "Account can insert own orders" on public.orders;
create policy "Account can insert own orders"
  on public.orders for insert
  with check (auth.uid() = account_id);

-- Line items. Snapshots `name`/`variant_label`/`unit_price` at sale time so
-- the receipt stays accurate even if the item is later renamed or
-- repriced. No account_id of its own — scoped via the parent order's.
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  item_id uuid not null references public.items (id) on delete restrict,
  variant_value_id uuid references public.item_variant_values (id) on delete set null,
  name text not null,
  variant_label text,
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  quantity numeric(10, 2) not null check (quantity > 0),
  line_total numeric(10, 2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists order_items_item_id_idx on public.order_items (item_id);

alter table public.order_items enable row level security;

drop policy if exists "Account can view own order items" on public.order_items;
create policy "Account can view own order items"
  on public.order_items for select
  using (exists (
    select 1 from public.orders where orders.id = order_items.order_id and orders.account_id = auth.uid()
  ));

drop policy if exists "Account can insert own order items" on public.order_items;
create policy "Account can insert own order items"
  on public.order_items for insert
  with check (exists (
    select 1 from public.orders where orders.id = order_items.order_id and orders.account_id = auth.uid()
  ));
