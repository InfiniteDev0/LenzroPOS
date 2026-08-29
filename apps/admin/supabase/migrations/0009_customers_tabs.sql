-- Run this in the Supabase SQL editor (Project > SQL Editor > New query).
-- Real customers + the ability to put an order "on the tab" instead of
-- paying immediately. Deliberately simpler than the original Phase 8
-- sketch in ROADMAP.md (no separate tickets/ticket_items table) — see
-- IMPROVISING_LOG.md for why. Owed is computed, not stored:
--   Owed = sum(orders.total where customer_id = X and payment_method = 'tab')
--        - sum(customer_payments.amount where customer_id = X)

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  name text not null,
  email text,
  phone text,
  address text,
  city text,
  country text,
  id_number text,
  created_at timestamptz not null default now()
);

alter table public.customers enable row level security;

drop policy if exists "Account can view own customers" on public.customers;
create policy "Account can view own customers"
  on public.customers for select
  using (account_id = auth.uid());

drop policy if exists "Account can add customers" on public.customers;
create policy "Account can add customers"
  on public.customers for insert
  with check (account_id = auth.uid());

drop policy if exists "Account can update own customers" on public.customers;
create policy "Account can update own customers"
  on public.customers for update
  using (account_id = auth.uid());

drop policy if exists "Account can delete own customers" on public.customers;
create policy "Account can delete own customers"
  on public.customers for delete
  using (account_id = auth.uid());

-- ---------------------------------------------------------------------

create table if not exists public.customer_payments (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  amount numeric(10, 2) not null check (amount > 0),
  created_at timestamptz not null default now()
);

alter table public.customer_payments enable row level security;

drop policy if exists "Account can view own customer payments" on public.customer_payments;
create policy "Account can view own customer payments"
  on public.customer_payments for select
  using (account_id = auth.uid());

drop policy if exists "Account can log customer payments" on public.customer_payments;
create policy "Account can log customer payments"
  on public.customer_payments for insert
  with check (account_id = auth.uid());

-- ---------------------------------------------------------------------

alter table public.orders add column if not exists customer_id uuid references public.customers (id);
alter table public.orders add column if not exists customer_name text;
alter table public.orders add column if not exists order_type text not null default 'dine_in'
  check (order_type in ('dine_in', 'takeaway', 'delivery'));

alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders add constraint orders_payment_method_check
  check (payment_method in ('cash', 'card', 'mobile', 'tab'));
