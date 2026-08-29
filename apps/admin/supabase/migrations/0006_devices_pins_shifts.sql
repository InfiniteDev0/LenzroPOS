-- Run this in the Supabase SQL editor (Project > SQL Editor > New query).
-- Phase 7: POS devices, employee PINs & shifts.
--
-- Employees are NOT extra Supabase Auth users — profiles.id is a hard FK to
-- auth.users.id, and staff never sign in with email/password on the POS,
-- only the owner does (once, to activate a device). So "employees" is its
-- own table, scoped to the owner's account like items/orders already are,
-- holding PIN + role + contact info as plain attribution data. The owner
-- gets one row here too (role 'Owner', auto-created alongside their
-- profile) so their own sales attribute the same way everyone else's do.

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  full_name text not null,
  email text,
  phone text,
  role text not null default 'Cashier' check (role in ('Owner', 'Administrator', 'Manager', 'Cashier')),
  pos_pin text,
  pos_pin_enabled boolean not null default true,
  status text not null default 'active' check (status in ('active', 'deactivated')),
  created_at timestamptz not null default now()
);

alter table public.employees enable row level security;

drop policy if exists "Account can view own employees" on public.employees;
create policy "Account can view own employees"
  on public.employees for select
  using (account_id = auth.uid());

drop policy if exists "Account can add employees" on public.employees;
create policy "Account can add employees"
  on public.employees for insert
  with check (account_id = auth.uid());

drop policy if exists "Account can update own employees" on public.employees;
create policy "Account can update own employees"
  on public.employees for update
  using (account_id = auth.uid());

drop policy if exists "Account can delete own employees" on public.employees;
create policy "Account can delete own employees"
  on public.employees for delete
  using (account_id = auth.uid());

-- A PIN only has to be unique among an account's currently-active staff —
-- freed up again if that employee is deactivated or the PIN is cleared.
drop index if exists employees_account_pin_key;
create unique index employees_account_pin_key
  on public.employees (account_id, pos_pin)
  where pos_pin is not null and status = 'active';

-- Give the owner their own employee row the moment they sign up, so their
-- own sales attribute the same way an employee's would.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));

  insert into public.employees (account_id, full_name, email, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), new.email, 'Owner');

  return new;
end;
$$;

-- ---------------------------------------------------------------------

create table if not exists public.pos_devices (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  name text not null,
  status text not null default 'not_activated' check (status in ('not_activated', 'activated')),
  activated_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.pos_devices enable row level security;

drop policy if exists "Account can view own pos devices" on public.pos_devices;
create policy "Account can view own pos devices"
  on public.pos_devices for select
  using (account_id = auth.uid());

drop policy if exists "Account can add pos devices" on public.pos_devices;
create policy "Account can add pos devices"
  on public.pos_devices for insert
  with check (account_id = auth.uid());

drop policy if exists "Account can update own pos devices" on public.pos_devices;
create policy "Account can update own pos devices"
  on public.pos_devices for update
  using (account_id = auth.uid());

drop policy if exists "Account can delete own pos devices" on public.pos_devices;
create policy "Account can delete own pos devices"
  on public.pos_devices for delete
  using (account_id = auth.uid());

-- ---------------------------------------------------------------------

create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  employee_id uuid not null references public.employees (id) on delete restrict,
  pos_device_id uuid not null references public.pos_devices (id) on delete restrict,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  opening_float numeric(12, 2) not null default 0,
  closing_cash_counted numeric(12, 2),
  expenses_total numeric(12, 2) not null default 0,
  expected_cash numeric(12, 2),
  discrepancy numeric(12, 2),
  status text not null default 'open' check (status in ('open', 'closed'))
);

alter table public.shifts enable row level security;

drop policy if exists "Account can view own shifts" on public.shifts;
create policy "Account can view own shifts"
  on public.shifts for select
  using (account_id = auth.uid());

drop policy if exists "Account can open shifts" on public.shifts;
create policy "Account can open shifts"
  on public.shifts for insert
  with check (account_id = auth.uid());

-- Closing a shift is the only update this table ever needs (append-only
-- otherwise, same spirit as orders).
drop policy if exists "Account can close own shifts" on public.shifts;
create policy "Account can close own shifts"
  on public.shifts for update
  using (account_id = auth.uid());

-- ---------------------------------------------------------------------

create table if not exists public.shift_expenses (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.shifts (id) on delete cascade,
  amount numeric(12, 2) not null,
  note text,
  created_at timestamptz not null default now()
);

alter table public.shift_expenses enable row level security;

drop policy if exists "Account can view own shift expenses" on public.shift_expenses;
create policy "Account can view own shift expenses"
  on public.shift_expenses for select
  using (
    exists (
      select 1 from public.shifts
      where shifts.id = shift_expenses.shift_id
      and shifts.account_id = auth.uid()
    )
  );

drop policy if exists "Account can log shift expenses" on public.shift_expenses;
create policy "Account can log shift expenses"
  on public.shift_expenses for insert
  with check (
    exists (
      select 1 from public.shifts
      where shifts.id = shift_expenses.shift_id
      and shifts.account_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------

alter table public.orders add column if not exists shift_id uuid references public.shifts (id);
