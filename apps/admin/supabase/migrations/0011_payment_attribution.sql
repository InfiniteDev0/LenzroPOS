-- Run this in the Supabase SQL editor (Project > SQL Editor > New query).
-- When a cashier logs a payment against a customer's tab (not just the
-- owner from the back office), the owner needs to see who recorded it.
-- Left null for payments logged from the admin app — displayed as
-- "Owner" there since the account itself is the one recording it.

alter table public.customer_payments add column if not exists recorded_by_employee_id uuid
  references public.employees (id);
