-- Run this in the Supabase SQL editor (Project > SQL Editor > New query).
--
-- A till can only have one drawer open at a time.
--
-- The open shift used to live only in the browser's localStorage, so a
-- second browser on the same till — the owner opening the PWA on their
-- phone while a cashier is mid-shift on the laptop — had no idea a shift
-- was already running. It would ask who's working and how much is in the
-- drawer, and open a second shift against the same device.
--
-- That's not a cosmetic glitch: cash sales, expenses and the closing
-- count would be split across two shifts covering the same drawer and
-- the same period, so neither reconciles and the discrepancy on both is
-- meaningless.
--
-- The app now reads the open shift from synced data rather than
-- localStorage, so any device sharing the till adopts the shift that's
-- already running. This index is the guarantee underneath that: even if
-- two clients race, the database only ever accepts one.
--
-- Mirrors business_days_one_open_per_device from migration 0013.

-- Close any duplicate open shifts before adding the constraint, keeping
-- the most recently opened one per device. Without this the index can't
-- be created on an account that already hit the bug.
with ranked as (
  select
    id,
    row_number() over (partition by pos_device_id order by opened_at desc) as rn
  from public.shifts
  where status = 'open'
)
update public.shifts
   set status = 'closed',
       closed_at = coalesce(closed_at, now())
 where id in (select id from ranked where rn > 1);

create unique index if not exists shifts_one_open_per_device
  on public.shifts (pos_device_id)
  where status = 'open';

notify pgrst, 'reload schema';
