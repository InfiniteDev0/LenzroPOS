# Lenzro POS — Improvising Log

`ROADMAP.md` is the stable plan — phases, schema, "done when" criteria. It doesn't get rewritten for every judgment call made during actual implementation. This file is where those calls get recorded instead: skipped items, simplifications, gotchas that are easy to get wrong, or a decision made on the fly that wasn't explicitly spelled out in the roadmap.

## How to use this
When Claude Code (or you) has to make a call that isn't explicitly covered by the roadmap — skips something, simplifies something, picks between two reasonable options, or there's a detail worth flagging so it's not rebuilt wrong later — log it here: what happened, why, and whether it needs revisiting.

---

## Log

### Phase 7 — POS devices, PINs & shifts (build note, ahead of implementation)
**Device activation is one-time; PIN login is everything after.**
A POS device is activated exactly once, by signing into `apps/pos` with a real email/password login (the owner's account). Once that device is activated, that login is never asked for again on it — every session after that starts directly at "pick employee → enter PIN," not a login screen. This is the actual mechanism, not a fallback or a simplification — worth stating plainly here so Claude Code doesn't build a "log in every time" flow by default and someone has to catch it later.

### Phase 7 — employees is its own table, not extended `profiles`
The roadmap originally said `profiles` would "double as the Employees table." That doesn't actually work: `profiles.id` is a hard foreign key to `auth.users.id` (one row per real Supabase Auth login), and staff never get a real login at all under the Phase 7 model above — only the owner does, once, to activate a device. Everyone else is PIN-only. So employees are a standalone `employees` table (account_id, full_name, role, pos_pin, ...) scoped to the owner's account like items/orders already are, not another `profiles` row. The owner still gets one row in `employees` too (role 'Owner', auto-created alongside their `profiles` row on signup) purely so their own sales attribute the same way an employee's would — it's not their auth identity, just their attribution row. `ROADMAP.md`'s decisions list and Phase 7 section were updated to match.

**Shift cash reconciliation only counts `cash` orders toward the drawer.** Expected cash at close = opening float + this shift's `cash`-payment_method orders − logged expenses. Card and mobile-money sales never touch the physical drawer, so they're correctly excluded from the discrepancy math even though they still count as sales.

**Lock screen only appears for employees with a PIN.** If an employee has `pos_pin_enabled = false` or no PIN set (the solo-owner case), the Lock button doesn't render for their shift at all — locking them out with no way to unlock would strand the till. They can still End shift normally.

### Phase 7 — POS needed order history + software printing to feel like a real product
Phase 7 as originally scoped only covered device/PIN/shift mechanics — it didn't include anything for the cashier to *see* what they'd already sold, or print anything. Added on top, same phase: a Tickets view (this shift's orders, tap for line-item detail) and an Expenses view in `apps/pos`, plus a software-only browser-print receipt (`lib/print-ticket.js`, `window.print()` — same pattern as admin's `print-receipts.js`). This is explicitly **not** the thermal/ESC-POS hardware path — that's still deferred per the Phase 6 decision to keep `apps/pos` hardware-free for now. A plain print-to-whatever-default-printer dialog needs none of that.

This forced one schema addition: local `orders.created_at` is now set client-side at insert time (like `id` already was) instead of left for Postgres's `default now()`, so the Tickets view has a real, sortable timestamp immediately after checkout rather than waiting on a round-trip through Supabase. `orders`/`order_items` also needed their first PowerSync stream entries — they'd never needed one before since `apps/pos` only ever wrote them, never read them back.

### Phase 8 — pulled forward, and simplified from the original sketch
Customer tabs got pulled forward into the same working session as Phase 7 (owner wanted checkout to support "pay now" vs "add to customer's tab" right away, not later). Built simpler than ROADMAP.md's original Phase 8 sketch: no separate `tickets`/`ticket_items` tables — an order IS the tab entry (`orders.payment_method = 'tab'`, `orders.customer_id` set). `customer_payments` logs payments against a customer's running balance rather than settling individual tickets. So: **Owed = sum(orders.total where customer_id = X and payment_method = 'tab') − sum(customer_payments.amount where customer_id = X)**, computed at read time, not stored. This trades away per-ticket partial settlement (Phase 8's original "Clear this ticket" idea) for something much simpler to build and reason about — a running account balance, paid down by logging payments. Revisit only if a real need for per-ticket settlement shows up.

**Logging a tab payment isn't admin-only.** Both `apps/pos` (the cashier, when a returning tab customer pays something down) and the admin Customers page (the owner) can insert into `customer_payments` — same table, same math either way, since a payment is a payment regardless of who took it. Each side also has a one-tap "Clear tab" that just logs a payment for the exact current `owed` amount, instead of the cashier/owner having to type it in.

A walk-in with no account still works: `orders.customer_name` is a free-text field for that case, completely separate from `orders.customer_id` (only set for a real customer record). Only a real `customer_id` unlocks the "Add to tab" payment option at checkout — you can't put a walk-in's order on credit with nothing to bill it to.

**Shift and expense records lock the instant they're final.** The `shifts` UPDATE policy now requires `status = 'open'` — once closed, nobody (owner or cashier, same shared account session either way) can edit its numbers again via any client. `shift_expenses` INSERT requires the parent shift still be open too, so an expense can't be backdated onto an already-reconciled shift. This was an explicit fairness request: neither side should be able to quietly alter a shift after the fact.

**Fixed a real, pre-existing bug: every order's "employee" was the owner, always.** `real-sales-data.js` (built in Phase 4, before Phase 7's employees/shifts existed) attributed each order via `orders.created_by`, joined to `profiles`. But `created_by` always defaults to `auth.uid()` — the single shared owner session every device runs under — regardless of which cashier's PIN actually rang it up. So the Sales Report's "by employee" breakdown, and every receipt's "Employee" column, has silently shown the owner's name for every single sale since Phase 4. Fixed to attribute via `orders.shift_id → shifts.employee_id → employees.full_name` (the real Phase 7 chain) instead. Found while reusing this same pipeline for the customer tab-orders table below — not something the owner reported, worth knowing this was wrong in the Sales Report/Receipts pages this whole time until now.

**PIN storage is intentionally plain, not hashed.** The 4-digit `pos_pin` is a local shift-attribution convenience, not a security-equivalent credential to the owner's real account password (which stays a normal Supabase Auth password, never stored by us at all). It has to be checked entirely offline against PowerSync's local mirror, so it's synced down in plain text like any other attribute — same tradeoff every till-side PIN system like this makes. Don't "fix" this into a hash+compare scheme later without a real reason; it'd break offline PIN checks for no real security gain at 4 digits of entropy.

### Marketing landing page — design approved, code deferred
A public marketing landing page (root domain, "Get started" → admin signup, "Download the POS app" → apps/pos install) was designed as a Claude Design canvas mockup — not built in code yet, on purpose (owner chose to do Phase 7 first). Direction, for whenever it does get built: emerald accent (matches the real admin/pos apps, not a new brand color), Outfit + Albert Sans fonts, warm-cream-free neutral background, real card shadows/elevation (flat bordered cards were explicitly rejected), native `<details>/<summary>` FAQ accordion. Copy covers offline-first sync, real inventory, PIN/shift flow, and "no hardware needed" — no fabricated pricing or testimonials since neither billing nor real customers exist yet. Explicitly did NOT copy the Behance "KimiPOS" case study's actual palette/layout the owner referenced — that's another designer's specifically branded work, not a generic style; only the general SaaS-landing structure (hero → proof strip → features → how-it-works → FAQ → CTA) was reused. Likely lands as a new `apps/www` in the monorepo, owning the root route, when it's eventually built.

### Phase 9 â€” Settings stopped being decoration (and two toggles were deleted, not wired)
Settings > Features and Settings > Payment types were both pure UI: `useState`, a Save button that called `toast.success()`, and no table behind either. Nothing in `apps/pos` read either one â€” the till had its own hardcoded `PAYMENT_METHODS = [cash, card, mobile]` array, so an owner adding a payment type in the back office changed precisely nothing at the counter. Migration `0013` adds `account_settings` (one row per account) and `payment_types`, both synced down to the POS read-only.

**Two of the five Features toggles were removed rather than made real.** "Time clock" duplicates what shifts already record (`shifts.opened_at`/`closed_at` per employee already *is* clock in/out â€” a second, parallel hours-tracking system would drift out of agreement with the first). "Low stock notifications" promised a *daily email*, which needs mail delivery and a scheduler that don't exist in this stack. A toggle that lies is worse than no toggle, so both are gone from the screen. The three that stayed all change real behaviour, and a fourth was added for the low-stock badges the POS already had but couldn't be turned off:

- `shifts_enabled` â€” off means no shift screen, no drawer count, no End shift, no business day. The till sells immediately after PIN sign-in and `orders.shift_id` is left null (the column has always been nullable). Expenses and the Expenses tab hide too, since `shift_expenses.shift_id` is `not null` â€” an expense with no shift to belong to has nowhere to go. Tickets falls back to *today's* orders instead of *this shift's*.
- `open_tickets_enabled` â€” declared, defaults off, not yet consumed. The only toggle currently ahead of its feature; parking orders is still to build.
- `low_stock_alerts_enabled` / `negative_stock_alerts_enabled` â€” the badges, and a "sell anyway?" confirm when adding an item that's already at zero. The confirm never *blocks* a sale, it just makes it deliberate: a queue is not the moment to argue with the cashier about inventory.

**Payment methods are the owner's list now, and `orders.payment_method` stores the label, not a code.** The old `orders_payment_method_check` constraint hardcoded `cash/card/mobile/tab`, which means an owner adding "Bank transfer" would have had every sale on it rejected by Postgres. Dropped it. `payment_method` now stores the configured name ("M-Pesa") so receipts and reports read correctly with no join, and `payment_type_id` carries the real reference. **Drawer reconciliation follows `payment_types.kind = 'cash'`, not the literal string `'cash'`** â€” otherwise renaming Cash to "Cash (KSh)" would silently drop every cash sale out of the expected-drawer math. The literal `'cash'` is still accepted alongside it so pre-migration sales still count.

### Phase 9 â€” the business day, which didn't exist at all
There was no day-level concept anywhere: `shifts` is per-employee-per-device, and nothing sat above it. So "end of day" had no meaning, and an owner asking "what did we make today" was really asking about a set of shifts nobody had grouped. `business_days` (migration 0013) is that group.

**Opened implicitly, closed explicitly.** The first shift started when no day is open opens one; making someone tap "start the day" before "start my shift" is two screens for a single intention. Closing is the deliberate act, because closing is where the money is counted â€” it produces a Z-report and **snapshots the totals onto the row**, so the day's numbers can't drift later as tabs get paid off or data syncs in. Same reasoning as `shifts` storing its own `discrepancy` instead of recomputing it, and the same RLS trick as migration 0008: a day can only be updated while `status = 'open'`, so closing is one-way and un-editable.

**Tab sales are reported on the day report but excluded from its takings**, consistent with the revenue-recognition rule Phase 8 established â€” an order on credit isn't money until it's paid off. The report shows it as its own line so the numbers aren't mysterious, not so they can be added up.

### Phase 9 â€” one POS device per account
Multi-till was never actually supported end to end. Shifts, business days and drawer counts are all scoped per device with nothing reconciling across them, so a second till would have quietly kept a second set of books that no screen ever added together. Migration `0014` enforces one device per account with a unique index (in the database, not just the admin UI, so the POS's own activation path can't create a second one either). Device setup on a fresh install now *claims the account's existing device* rather than offering to make another. Multi-store/multi-till stays a Phase 10 concern â€” it needs a `store_id` on nearly every table anyway.

### Phase 9 â€” PIN is the daily credential; the logout button is gone
The ROADMAP said "day-to-day staff use PIN + shift start, never a full login again," but `handleLogout` in the POS header called `supabase.auth.signOut()`, which killed the session cookie and dumped the next person onto an email/password screen â€” the exact thing the design said would never happen. Restructured into three separate ideas that used to be tangled into one "shift session":

- **Device** â€” activated once with a real Supabase login. The session is never signed out and refreshes itself.
- **Staff** â€” who is at the till right now, proven by PIN. This is the daily credential, owner included.
- **Shift** â€” a counted drawer, and only when `shifts_enabled`.

Splitting staff from shift is what lets Shifts be a genuine toggle without losing attribution: with shifts off there's still a signed-in employee on every sale. The header's logout is now a **hand-over** (clear the staff session, back to the PIN screen), blocked while a shift is open. A true sign-out still exists â€” it has to, or a stolen device is permanent â€” but it's a small link on the sign-in screen, confirms first, wipes the device activation, and is blocked while a shift is open.

`lib/pos-session.js` became a subscribable store (`useSyncExternalStore`) instead of values copied into `useState` on mount. localStorage genuinely is an external system, several components write to it, and every reader needs to see the writes â€” the old copy-on-mount approach also tripped React's `set-state-in-effect` rule.

**A stored shift is verified against the synced data before it's trusted.** After a sales-data reset (or a shift closed from elsewhere), localStorage can point at a shift row that no longer exists. The POS now treats a vanished or closed shift as no shift â€” but only once `status.hasSynced`, or a cold start would throw away a perfectly good shift before its row has arrived.

### Sync Streams config is version-controlled now
The PowerSync Sync Streams YAML lived only in the PowerSync dashboard, which is why it kept drifting out of agreement with `AppSchema.js` and why several "table doesn't exist" bugs took a round trip to diagnose. It's now at `apps/pos/powersync/sync-streams.yaml` as the source of truth â€” not read at runtime, but the whole file gets pasted into the dashboard on every change. Two gotchas are documented in it: PowerSync requires an `id` column, so `stock_levels` (PK `item_id`) and `account_settings` (PK `account_id`) both alias their PK to `id`; and once any column in a `SELECT` is aliased, `table.*` is rejected, so those two streams list every column explicitly.

### A destructive reset script exists, deliberately outside `migrations/`
`supabase/scripts/reset-sales-data.sql` clears orders, order items, shifts, shift expenses, business days and the whole tab ledger, keeping the menu, staff, customers, discounts, payment types and settings. It lives outside `migrations/` on purpose so it can never run as part of a normal migration pass â€” it has to be pasted in by hand. It was needed because orders written before payment types were real carry the old hardcoded `cash`/`card`/`mobile` values and no `payment_type_id`, so leaving them in place would mean every report mixes two incompatible shapes of data.

### Marketing landing page â€” built, in `apps/admin`, not a new app
Built at the admin app's root route (`/`) rather than as the separate `apps/www` the earlier note guessed at. `/` was already public (the proxy only guards `/admin` and `/dashboard`) and was doing nothing but redirecting, so a fourth app would have bought a deployment target and nothing else. It renders a "Back office" CTA instead of "Sign in" when the visitor already has a session.

Copy claims only what ships today â€” offline selling, shifts and drawer counts, open tabs, stock badges, reports, receipts and end-of-day. No pricing, no testimonials, no logos: billing doesn't exist and neither do customers, and inventing either would be a lie a real visitor could catch. Screenshots are the actual app (`/item.png`, `/customer.png`), not mockups. Design direction is the one approved in the earlier canvas mockup â€” emerald accent, real elevation, native `<details>` FAQ â€” and still deliberately not a copy of the referenced Behance case study's palette or layout.


### Phase 9 — Receipt settings were the last localStorage holdout
Settings > Receipt wrote to `lenzro:receipt-settings` in the admin browser's own localStorage. So the header, footer and logo were invisible to any other machine the owner opened the back office on, and — the part that actually mattered — completely invisible to the POS, which printed a hardcoded `<h2>Lenzro POS</h2>` on every receipt it handed a customer no matter what was configured.

Folded into `account_settings` (migration 0015) rather than given its own table: it's already one row per account and already synced down to the till, so this needed no new table, no new sync stream and no new schema entry. The logo is a URL into the same `PosImages` bucket item photos use, **not** the data URI the old version stored — an inlined image would be copied onto the synced row and bloat every till's local database for nothing.

**The receipt "language" selector was removed, not persisted.** It offered English/Swahili and nothing translated anything. Same rule as the Features toggles: a setting that does nothing is worse than no setting.

**`printReceipts()` now takes settings as an argument instead of loading them itself.** They live in Supabase now, and awaiting a fetch between the click and `window.open()` is exactly what popup blockers kill. Both callers load them once on mount and hand them over.

### Phase 9.5 — "End business day" had to live on the shift-start screen
First build put End business day in the POS header, next to End shift. That made it unreachable: you can only close the day once no shift is open, but closing a shift immediately returns the cashier to the shift-start screen — so the button vanished at exactly the moment it became usable. It now lives on the shift-start screen, under the opening-float form, which is the only screen where "the day is over" is actually true.

The owner can review closed days at `/admin/end-of-day`, expandable to the shifts that made up each one (who worked, and whose drawer was over or short). **Those totals are read off the `business_days` row, never recomputed** — they were snapshotted at close, and recomputing would quietly disagree with the report that was printed and signed off at the time.

### Sidebar was showing shadcn's sample user
`app-sidebar.jsx` carried the stock shadcn `data.user` block (`shadcn` / `m@example.com` / a missing avatar path), passed straight into `NavUser`. Now loaded for real from `profiles.full_name` plus the auth user's email, with generated initials instead of a broken image. "Upgrade to Pro", "Billing" and "Notifications" came off that menu — billing is Phase 10 and notifications don't exist, so all three were dead items. Same rule being applied to the Features toggles and the receipt language selector: ship the control or remove it, don't fake it.

### "Unknown" in the employee filter — orders had no direct link to a person
The Sales Report's employee breakdown reached an employee only through the shift (`orders.shift_id -> shifts.employee_id`), so any order without a shift had no employee and rendered as "Unknown". Two ways that happens: orders taken before Phase 7 shifts existed, and — newly, and much worse — every order taken with Shifts switched off in Settings > Features, where `shift_id` is null by design.

Someone is always signed in at the till: the PIN screen is mandatory whether or not shifts are on. The employee was always known at the moment of sale, it just had nowhere to be recorded. Migration `0016` adds `orders.employee_id`, written by the POS from the staff session on every checkout, and backfills existing rows from the shift chain. Readers prefer `orders.employee_id` and fall back to the shift chain for older rows.

The remaining fallback label is now "Unattributed" rather than "Unknown" — it only applies to orders that genuinely predate employee tracking, and it should say the data is missing rather than imply some mystery person rang them up.

### "Console TypeError: network error" was my own offline check being too narrow
`BackendConnector.uploadData` deliberately swallows transport failures — being offline is the normal case for a till, and Next's dev overlay turns every `console.error` into a full-screen panel. The check was `error instanceof TypeError && /fetch/i.test(error.message)`, which assumed the message always mentions "fetch". Browsers word it differently: Chrome says "Failed to fetch", Firefox "NetworkError when attempting to fetch resource", Safari "Load failed", and some environments just "network error" — that last one sailed past the regex and got reported as a crash.

Now keyed on the type alone: supabase-js reports real API failures as `PostgrestError`, never a `TypeError`, so any `TypeError` reaching that handler is the transport giving up rather than the server rejecting the write. The queued transaction is still left uncompleted either way, so the order retries — the bug was only in what got logged, never in whether data survived.

### A deleted POS device used to strand the till
`reset-sales-data.sql` originally kept `pos_devices`, on the theory that the device registration was worth preserving. Wrong for the actual use case it exists for: going live after testing means starting the books over on a clean device, not inheriting the test till's identity. It now deletes the device too (after shifts and business days, which point at it).

That exposed the matching client bug: the POS trusted the device id in localStorage unconditionally, so with the row deleted it would sail past activation and then have every shift it opened rejected by the foreign key on upload. It now validates the stored id against the synced `pos_devices` table — same guard, and same "only once `status.hasSynced`" caveat, as the stale-shift check.

### Sync Streams: one table per stream, and `config.edition: 3`
Two rounds of dashboard rejections, both worth recording so the next change doesn't repeat them.

**`config.edition` is mandatory.** Without it PowerSync assumes the alpha Sync Streams syntax and rejects *every* stream in the file — 18 identical "Sync streams require edition 2 or later" errors from one missing declaration, which reads like 18 broken streams rather than one missing line. It must be `3`: edition 2 still triggers the "using an alpha version" warning, and edition 3 is what supports the subquery filtering below.

**A stream SELECTs from exactly one table.** The original file scoped child tables by joining up to whichever table has `account_id` (`SELECT order_items.* FROM order_items INNER JOIN orders ...`). Sync Streams rejects that outright with "Must SELECT from a single table" — selecting from one table *through* a join still counts as multiple tables. The supported form is a subquery in the WHERE, and it nests, which is how `item_variant_values` reaches `items` two levels up:

```
SELECT * FROM item_variant_values
WHERE variant_id IN (
  SELECT id FROM item_variants WHERE item_id IN (
    SELECT id FROM items WHERE account_id = auth.user_id()
  )
)
```

Dropping the joins also removed the older "Invalid unqualified reference" trap: with a single table in play, columns no longer need qualifying, so `stock_levels` and `account_settings` alias their PK to `id` with plain column names.

**On CVE-2026-30870** (`config.edition: 3` on service-core 1.20.0, fixed in 1.20.1): it affected subqueries used *only* to decide whether a table syncs at all, without partitioning the data. Every subquery here partitions by `account_id`, so this config isn't in that shape — but keep it that way, and don't write a stream whose subquery is a bare existence check.

### PowerSync workers were missing in production ("Failed to fetch a worker script")
`apps/pos/public/@powersync/` holds PowerSync's SQLite worker and wasm bundles. It's gitignored — correctly, it's generated output — and was regenerated only by a `postinstall` script (`powersync-web copy-assets -o public`). That works locally, where install always runs, but nothing guarantees a workspace package's `postinstall` fires in a hosted build. On Vercel it didn't, so the deployed till served no worker: the app rendered, then died at "Loading your device…" with `Failed to fetch a worker script` and `[PowerSync]: Error in database or sync worker`.

The copy is now part of `build` as well as `postinstall`:

```
"build": "powersync-web copy-assets -o public && next build"
```

Verified by deleting the directory outright and running a clean build — all 25 files come back before `next build` collects `public/`. `postinstall` stays so a fresh `pnpm install` still sets up dev.

**This depends on the host running the package's `build` script rather than a bare `next build`.** If a deployment ever loses its workers again, check the platform's build command first — that's the thing that silently skips the copy step.
