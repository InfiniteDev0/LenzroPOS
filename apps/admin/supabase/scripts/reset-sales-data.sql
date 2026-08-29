-- ⚠️  DESTRUCTIVE — THIS DELETES ALL SALES HISTORY. THERE IS NO UNDO.
--
-- Deliberately NOT in supabase/migrations/ so it can never run as part of
-- a normal migration pass. Paste it into the Supabase SQL editor by hand,
-- on purpose, when you want a clean slate.
--
-- What it clears: every order and its line items, every shift and the
-- expenses logged against them, every business day, and the whole tab
-- ledger (customer payments + their allocations).
--
-- What it KEEPS: your menu (categories, items, variants, stock levels),
-- your staff and their PINs, your customers, your discount types, your
-- payment types, your feature settings, and your POS device registration.
--
-- Written for the payment-logic rebuild: the old orders carry the
-- hardcoded 'cash'/'card'/'mobile' payment_method values from before
-- payment types were real, and no payment_type_id at all, so leaving them
-- around would mean every report mixes two incompatible shapes of data.

begin;

-- Order matters — children before parents, or the FKs reject the delete.
delete from public.customer_payment_allocations;
delete from public.customer_payments;

delete from public.order_items;
delete from public.orders;

delete from public.shift_expenses;
delete from public.shifts;

delete from public.business_days;

commit;

-- Sanity check: every one of these should come back 0.
select
  (select count(*) from public.orders) as orders,
  (select count(*) from public.order_items) as order_items,
  (select count(*) from public.shifts) as shifts,
  (select count(*) from public.shift_expenses) as shift_expenses,
  (select count(*) from public.business_days) as business_days,
  (select count(*) from public.customer_payments) as customer_payments,
  (select count(*) from public.customer_payment_allocations) as allocations;
