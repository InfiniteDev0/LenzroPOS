-- Run this in the Supabase SQL editor (Project > SQL Editor > New query).
--
-- One POS device per account. Multi-till was never actually supported
-- end to end — shifts, business days and the drawer count are all scoped
-- per device, but nothing reconciled across devices, so a second till
-- would have quietly produced a second set of books. Locking it to one
-- makes the model honest; multi-store/multi-till is a Phase 10 concern
-- (it needs a store_id on nearly every table anyway).

-- Enforced in the database, not just the admin UI, so the POS's own
-- device-activation path can't create a second one either.
create unique index if not exists pos_devices_one_per_account
  on public.pos_devices (account_id);

notify pgrst, 'reload schema';
