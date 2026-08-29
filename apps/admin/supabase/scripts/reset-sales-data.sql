-- ⚠️  DESTRUCTIVE — THIS DELETES ALL SALES HISTORY. THERE IS NO UNDO.
--
-- Deliberately NOT in supabase/migrations/ so it can never run as part of
-- a normal migration pass. Paste it into the Supabase SQL editor by hand,
-- on purpose, when you want a clean slate.
--
-- Written for going live: the till was used for testing, and the test
-- orders carry the old hardcoded 'cash'/'card'/'mobile' payment_method
-- values from before payment types were real, with no payment_type_id
-- and no employee_id. Leaving them in place would mean every report
-- mixes two incompatible shapes of data.
--
-- WHAT IT CLEARS
--   · every order and its line items
--   · every shift and the expenses logged against them
--   · every business day
--   · the whole tab ledger (customer payments + their allocations)
--   · the registered POS device, so you activate a fresh one
--
-- WHAT IT KEEPS
--   · your menu (categories, items, variants, stock levels)
--   · your staff and their PINs
--   · your customers
--   · your discount types, payment types and all Settings
--
-- AFTER RUNNING THIS: open the POS app and it will show the "Activate
-- this device" screen again by itself — it notices the device row is
-- gone and stops trusting the one saved in the browser. Give the till a
-- name and you're on a clean set of books. You do NOT need to clear the
-- browser's storage by hand.

begin;

-- Order matters — children before parents, or the foreign keys reject
-- the delete. Shifts and business days have to go before the device
-- they point at.
delete from public.customer_payment_allocations;
delete from public.customer_payments;

delete from public.order_items;
delete from public.orders;

delete from public.shift_expenses;
delete from public.shifts;

delete from public.business_days;

delete from public.pos_devices;

commit;

-- Sanity check: every one of these should come back 0.
select
  (select count(*) from public.orders) as orders,
  (select count(*) from public.order_items) as order_items,
  (select count(*) from public.shifts) as shifts,
  (select count(*) from public.shift_expenses) as shift_expenses,
  (select count(*) from public.business_days) as business_days,
  (select count(*) from public.customer_payments) as customer_payments,
  (select count(*) from public.customer_payment_allocations) as allocations,
  (select count(*) from public.pos_devices) as pos_devices;

-- And a look at what survived, which should all be non-zero if you had
-- it configured before.
select
  (select count(*) from public.items) as items,
  (select count(*) from public.categories) as categories,
  (select count(*) from public.employees) as employees,
  (select count(*) from public.customers) as customers,
  (select count(*) from public.payment_types) as payment_types;
