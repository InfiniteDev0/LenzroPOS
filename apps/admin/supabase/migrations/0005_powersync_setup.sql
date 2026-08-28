-- Run this in the Supabase SQL editor (Project > SQL Editor > New query).
-- Sets up the replication role + publication PowerSync needs to read from
-- this database. This does NOT touch RLS or existing grants for your
-- normal app roles — it's a separate, additive role scoped to replication.
--
-- Deliberately does NOT set a password here — this role has REPLICATION +
-- BYPASSRLS, meaning it can read every row in every table regardless of
-- RLS, so it must never carry a password that exists in a file, a chat
-- log, or git history. Run this file as-is, then set the password
-- YOURSELF as a separate step (see bottom of this file) using a value you
-- generate locally and never paste anywhere else.

create role powersync_role with replication bypassrls login;

grant select on all tables in schema public to powersync_role;
alter default privileges in schema public grant select on tables to powersync_role;

-- Publication name must be exactly "powersync" — PowerSync looks for it
-- by that name. FOR ALL TABLES is the standard/recommended default: Sync
-- Streams (not this publication) is what actually controls which rows
-- reach which client, so including extra tables here doesn't leak data —
-- it just means future tables don't need this step repeated.
create publication powersync for all tables;

-- ---------------------------------------------------------------------
-- SEPARATE STEP — do not run as part of the block above.
-- Generate a password locally (e.g. `openssl rand -base64 24` in your own
-- terminal — not through an AI assistant, not copy-pasted from anywhere
-- that logs it), then run just this one line by itself, filling it in:
--
--   alter role powersync_role with password 'paste-your-own-generated-password-here';
--
-- Paste that same password into PowerSync's "Connect to Source Database"
-- screen as the password for user powersync_role. Don't leave a copy of
-- it in this file or commit it anywhere.
-- ---------------------------------------------------------------------
