-- Run this in the Supabase SQL editor (Project > SQL Editor > New query).
-- Discount types: admin-defined up front (e.g. "Loyalty discount — 2% off"),
-- applied by the cashier at checkout in apps/pos. Kept deliberately simple
-- for now — see IMPROVISING_LOG.md for what "apply_to: item" actually
-- means in practice (applies to every line in the cart, not a per-line
-- picker).

create table if not exists public.discount_types (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  name text not null,
  kind text not null check (kind in ('percentage', 'fixed_amount')),
  value numeric(10, 2) not null check (value > 0),
  apply_to text not null default 'order' check (apply_to in ('order', 'item')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.discount_types enable row level security;

drop policy if exists "Account can view own discount types" on public.discount_types;
create policy "Account can view own discount types"
  on public.discount_types for select
  using (account_id = auth.uid());

drop policy if exists "Account can add discount types" on public.discount_types;
create policy "Account can add discount types"
  on public.discount_types for insert
  with check (account_id = auth.uid());

drop policy if exists "Account can update own discount types" on public.discount_types;
create policy "Account can update own discount types"
  on public.discount_types for update
  using (account_id = auth.uid());

drop policy if exists "Account can delete own discount types" on public.discount_types;
create policy "Account can delete own discount types"
  on public.discount_types for delete
  using (account_id = auth.uid());

-- ---------------------------------------------------------------------

alter table public.orders add column if not exists discount_type_id uuid references public.discount_types (id);
alter table public.orders add column if not exists discount_amount numeric(10, 2) not null default 0;
