-- Run this in the Supabase SQL editor (Project > SQL Editor > New query).
-- Tracks exactly how each customer_payments row was split across the
-- specific orders it paid off — needed so the Sales Report can recognize
-- a tab order's revenue on the day it's actually paid, not the day it
-- was placed. See IMPROVISING_LOG.md for the full reasoning.

create table if not exists public.customer_payment_allocations (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.customer_payments (id) on delete cascade,
  order_id uuid not null references public.orders (id) on delete restrict,
  amount numeric(10, 2) not null check (amount > 0),
  created_at timestamptz not null default now()
);

create index if not exists customer_payment_allocations_order_id_idx
  on public.customer_payment_allocations (order_id);

alter table public.customer_payment_allocations enable row level security;

drop policy if exists "Account can view own payment allocations" on public.customer_payment_allocations;
create policy "Account can view own payment allocations"
  on public.customer_payment_allocations for select
  using (
    exists (
      select 1 from public.customer_payments
      where customer_payments.id = customer_payment_allocations.payment_id
      and customer_payments.account_id = auth.uid()
    )
  );

drop policy if exists "Account can log payment allocations" on public.customer_payment_allocations;
create policy "Account can log payment allocations"
  on public.customer_payment_allocations for insert
  with check (
    exists (
      select 1 from public.customer_payments
      where customer_payments.id = customer_payment_allocations.payment_id
      and customer_payments.account_id = auth.uid()
    )
  );
