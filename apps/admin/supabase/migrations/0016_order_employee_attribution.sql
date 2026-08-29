-- Run this in the Supabase SQL editor (Project > SQL Editor > New query).
--
-- Attribute a sale to the person who rang it up, directly.
--
-- Until now the only link from an order to an employee was through its
-- shift (orders.shift_id -> shifts.employee_id). That breaks in two
-- places: orders taken before shifts existed have no shift at all, and
-- orders taken with Shifts switched off in Settings > Features have a
-- null shift_id by design. Both showed up in the Sales Report and the
-- employee filter as "Unknown".
--
-- Someone is always signed in at the till — the PIN screen is mandatory
-- whether or not shifts are on — so the employee is always known at the
-- moment of sale. It just had nowhere to be recorded.

alter table public.orders
  add column if not exists employee_id uuid references public.employees (id);

-- Backfill from the shift chain, which is the best information the
-- existing rows carry. Anything still null afterwards genuinely predates
-- employee tracking and has no answer to recover.
update public.orders
   set employee_id = shifts.employee_id
  from public.shifts
 where shifts.id = public.orders.shift_id
   and public.orders.employee_id is null;

create index if not exists orders_employee_id_idx on public.orders (employee_id);

notify pgrst, 'reload schema';
