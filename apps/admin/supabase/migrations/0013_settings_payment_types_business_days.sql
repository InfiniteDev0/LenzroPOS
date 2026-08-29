-- Run this in the Supabase SQL editor (Project > SQL Editor > New query).
--
-- Three things that were UI-only until now:
--   1. account_settings — the Settings > Features toggles. They rendered
--      and "saved" with a toast, but wrote nothing and no code read them.
--   2. payment_types    — Settings > Payment types was a local array, and
--      the POS had its own separate hardcoded cash/card/mobile list.
--   3. business_days    — there was no day-level concept at all. Shifts
--      are per-employee; a trading day spans however many shifts happen
--      between "day begins" and "end business day".

-- ---------------------------------------------------------------------
-- 1. Feature toggles
-- ---------------------------------------------------------------------
-- One row per account. Only toggles that a real code path honours live
-- here — see IMPROVISING_LOG.md for the two that were dropped from the
-- Features screen rather than left as decoration.

create table if not exists public.account_settings (
  account_id uuid primary key references public.profiles (id) on delete cascade default auth.uid(),
  shifts_enabled boolean not null default true,
  open_tickets_enabled boolean not null default false,
  low_stock_alerts_enabled boolean not null default true,
  negative_stock_alerts_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.account_settings enable row level security;

drop policy if exists "Account can view own settings" on public.account_settings;
create policy "Account can view own settings"
  on public.account_settings for select
  using (account_id = auth.uid());

drop policy if exists "Account can create own settings" on public.account_settings;
create policy "Account can create own settings"
  on public.account_settings for insert
  with check (account_id = auth.uid());

drop policy if exists "Account can update own settings" on public.account_settings;
create policy "Account can update own settings"
  on public.account_settings for update
  using (account_id = auth.uid());

-- Every existing account gets the defaults, so the POS never has to cope
-- with a missing settings row for an account that predates this table.
insert into public.account_settings (account_id)
select id from public.profiles
on conflict (account_id) do nothing;

-- ---------------------------------------------------------------------
-- 2. Payment types
-- ---------------------------------------------------------------------
-- `kind` drives which icon the POS renders and, for 'cash', whether the
-- sale counts toward the drawer at shift close. Custom types the owner
-- adds default to 'other' and are treated as non-cash.

create table if not exists public.payment_types (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  name text not null,
  kind text not null default 'other' check (kind in ('cash', 'card', 'mobile', 'other')),
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.payment_types enable row level security;

drop policy if exists "Account can view own payment types" on public.payment_types;
create policy "Account can view own payment types"
  on public.payment_types for select
  using (account_id = auth.uid());

drop policy if exists "Account can add payment types" on public.payment_types;
create policy "Account can add payment types"
  on public.payment_types for insert
  with check (account_id = auth.uid());

drop policy if exists "Account can update own payment types" on public.payment_types;
create policy "Account can update own payment types"
  on public.payment_types for update
  using (account_id = auth.uid());

drop policy if exists "Account can delete own payment types" on public.payment_types;
create policy "Account can delete own payment types"
  on public.payment_types for delete
  using (account_id = auth.uid());

-- Seed the three the POS used to hardcode, so nothing disappears from
-- the till the moment this migration lands. M-Pesa rather than a generic
-- "Mobile" — this is a Kenyan POS and that's what the button means.
insert into public.payment_types (account_id, name, kind, sort_order)
select p.id, v.name, v.kind, v.sort_order
from public.profiles p
cross join (values
  ('Cash', 'cash', 0),
  ('Card', 'card', 1),
  ('M-Pesa', 'mobile', 2)
) as v (name, kind, sort_order)
where not exists (
  select 1 from public.payment_types pt where pt.account_id = p.id
);

-- The old constraint hardcoded the same three methods, so an owner adding
-- a payment type would have had every sale on it rejected. Payment method
-- is now whatever the owner defined; 'tab' stays reserved for credit.
alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders add column if not exists payment_type_id uuid references public.payment_types (id);

-- ---------------------------------------------------------------------
-- 3. Business days
-- ---------------------------------------------------------------------
-- Scoped per device, matching shifts: each till opens and closes its own
-- trading day. A day opens implicitly when the first shift of the day
-- starts, and closes explicitly from "End business day", which snapshots
-- the totals so the Z-report stays stable even as later data changes.

create table if not exists public.business_days (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  pos_device_id uuid not null references public.pos_devices (id) on delete cascade,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  opened_by_employee_id uuid references public.employees (id),
  closed_by_employee_id uuid references public.employees (id),
  status text not null default 'open' check (status in ('open', 'closed')),
  gross_sales numeric(10, 2),
  cash_sales numeric(10, 2),
  non_cash_sales numeric(10, 2),
  tab_sales numeric(10, 2),
  expenses_total numeric(10, 2),
  order_count integer,
  note text
);

alter table public.business_days enable row level security;

drop policy if exists "Account can view own business days" on public.business_days;
create policy "Account can view own business days"
  on public.business_days for select
  using (account_id = auth.uid());

drop policy if exists "Account can open business days" on public.business_days;
create policy "Account can open business days"
  on public.business_days for insert
  with check (account_id = auth.uid());

-- Same integrity rule as shifts (0008): a closed day is a historical
-- record and can never be reopened or edited.
drop policy if exists "Account can close open business days" on public.business_days;
create policy "Account can close open business days"
  on public.business_days for update
  using (account_id = auth.uid() and status = 'open');

-- Only one day open per device at a time.
create unique index if not exists business_days_one_open_per_device
  on public.business_days (pos_device_id)
  where status = 'open';

alter table public.shifts add column if not exists business_day_id uuid references public.business_days (id);

create index if not exists shifts_business_day_id_idx on public.shifts (business_day_id);

-- PostgREST caches the schema; without this the new tables 404 until the
-- API restarts on its own.
notify pgrst, 'reload schema';
