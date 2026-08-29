-- Run this in the Supabase SQL editor (Project > SQL Editor > New query).
--
-- Receipt settings were the last Settings screen still writing to the
-- admin browser's own localStorage: invisible to every other device, and
-- invisible to the POS, which printed a hardcoded "Lenzro POS" header on
-- every receipt no matter what the owner typed here.
--
-- Folded into account_settings rather than given their own table — it's
-- already one row per account and already synced down to the till, so
-- this needs no new table, no new sync stream and no new schema entry.
--
-- The receipt "language" selector is deliberately NOT persisted here: it
-- offered English/Swahili but nothing translated anything, and a setting
-- that does nothing is worse than no setting. See IMPROVISING_LOG.md.

alter table public.account_settings
  add column if not exists receipt_header text,
  add column if not exists receipt_footer text,
  add column if not exists receipt_show_customer boolean not null default false,
  -- A URL into the same storage bucket item photos use, not a data URI:
  -- an inlined logo would be copied onto every synced row and bloat the
  -- till's local database for no reason.
  add column if not exists receipt_logo_url text;

notify pgrst, 'reload schema';
