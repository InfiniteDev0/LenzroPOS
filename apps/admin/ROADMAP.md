# Lenzro POS — Build Roadmap

## Current state
- Single Next.js 16 app in `web/` (JavaScript, not TypeScript — `jsconfig.json`)
- Supabase wired for auth: a `profiles` table (RLS scoped to self) + a trigger that creates a profile row on signup. Working, kept as-is — see note under Phase 7.
- `supabase/` folder already present in `web/` — Supabase CLI already initialized locally
- `/admin` — new admin UI, fully built visually, **no persistence beyond auth** (everything is mock arrays / local state)
- `/dashboard` — original POS terminal UI reference. **Not being reused** — POS PWA UI/logic was built fresh (Phase 3)
- `AGENTS.md` / `CLAUDE.md` already exist at the `web/` root — keep these current as the repo splits into a monorepo, so each app has the right context for Claude Code
- **Phase 0–2 done.** `apps/admin` and `apps/pos` run side by side on ports 3000/3001. Items, Categories (with click-through), Inventory (filtered to `track_stock = true`), and variants are real.
- **Phase 3 done.** `apps/pos` takes real orders against real items, writes to `orders`/`order_items`, respects `available_for_sale` and variant price overrides, and has had its layout redone into a persistent two-pane counter-service screen. Tax is hardcoded to 0 until Settings' tax config is real (see Phase 9).
- **Phase 4 done.** `/admin`'s Sales Report and `/admin/receipts` read real `orders`/`order_items` instead of `mock-transactions.js`, including a real computed gross profit from `items.cost`.
- **Phase 5 done.** `apps/pos` is offline-first via PowerSync: menu data syncs down to a local SQLite database, orders write locally first and upload in the background once connectivity returns. Verified end-to-end (placed an order fully offline, confirmed it landed in Supabase after reconnecting).

## Decisions locked in
- **Monorepo**: pnpm workspaces + Turborepo
- **Backend**: Supabase (Postgres + auth + realtime) — no separate API server to host
- **POS offline sync**: PowerSync, using its native Supabase integration
- **POS desktop**: PWA only, no Electron — installed straight from the browser ("Add to Home Screen" / install prompt) via a web app manifest + service worker, running in a Chromium-based browser (Chrome/Edge/ChromeOS) on the terminal or PC
- **Foundational entity**: Items & Categories — inventory, orders/receipts, and customer tickets all reference it, so it's built and made real before anything downstream
- **Auth**: keep the existing `profiles` table as-is for the owner's own Supabase Auth identity. Employees/staff are a separate `employees` table, not more `profiles` rows — see Phase 7 for why
- **Inventory model**: no composite/recipe items (e.g. a cappuccino auto-deducting sugar/milk on sale) — considered and explicitly rejected as too fragile/complex. Stock is tracked per trackable item directly, moved by two manual actions: "Add stock" (received new units) or "Adjust count" (recount / ran out)
- **Variants**: items can have variant options (e.g. Size: Small/Medium/Large) with an optional per-variant price — a separate concern from inventory, does not drive stock deduction
- **Item flags are independent**: `available_for_sale` (shows as a button on the POS sales screen) and `track_stock` (shows as a row in Inventory) are two separate booleans, not one. Cappuccino → sale: yes, track stock: no (made-to-order, nothing to count). Soda → sale: yes, track stock: yes (sold as-is, bottles counted). Cups/sugar/milk → sale: no, track stock: yes (never on the POS screen, still counted). Inventory only ever lists items where `track_stock` is true — a made-to-order drink should never appear there
- **Orders are append-only** — editing history should go through a void/refund flow later, not silent mutation. No update/delete RLS policies on `orders`/`order_items`.
- **Tax**: hardcoded to 0 on orders until a real tax-rate setting exists (Settings' tax field is currently mock-only) — revisit in Phase 9
- **Device activation vs. daily login are different things**: a POS device is activated once with a real Supabase login; after that, day-to-day staff use PIN + shift start, never a full login again (see Phase 7)

## Target repo shape
```
lenzro/
├── apps/
│   ├── admin/       # current web/ app, moved here as-is
│   └── pos/          # order-taking app, installable as a PWA
├── packages/
│   ├── supabase/      # shared client + generated types
│   ├── ui/             # shared design system components
│   └── types/           # shared entity types (Item, Category, Order, etc.)
```

---

## Phase 0 — Monorepo restructuring ✅
**Goal:** current app runs exactly as it does today, just relocated, with workspace tooling in place. No feature work.

Tasks:
- Init a pnpm workspace + Turborepo config at the repo root
- Move `web/` → `apps/admin/`, confirm it still builds and runs unchanged
- Delete `package-lock.json`, reinstall with pnpm
- Create empty `packages/supabase`, `packages/ui`, `packages/types` scaffolds
- Move the existing Supabase client init into `packages/supabase`, import it from `apps/admin`

**Done when:** `pnpm dev --filter admin` runs the exact same admin app as before — nothing regressed, nothing looks different.

---

## Phase 1 — Items, Categories & Variants schema ✅
**Goal:** real Postgres tables behind the empty-state pages, replacing mock arrays. No composite/recipe items — see decision above.

Tasks:
- Create `categories` and `items` tables via a migration in `supabase/migrations` (name, price, category_id, optional sku/barcode, `available_for_sale` boolean default true, `track_stock` boolean default false, sold_by: each/weight)
- Create `item_variants` (item_id, option_name — e.g. "Size") and `item_variant_values` (variant_id, value — e.g. "Small", optional price_override) for the item's "Create options" dialog
- Row-level security scoped to the authenticated account
- Generate/write shared types into `packages/types`

**Done when:** tables exist in local Supabase, migrations apply cleanly, types are generated and importable.

---

## Phase 2 — Wire Items, Categories, and Inventory to real data ✅
**Goal:** every admin page that depends *only* on items goes from mock/empty-state to real. Inventory belongs here, not later — it needs items, nothing else.

Tasks:
- `/admin/items`: real create/edit form, including the "Create options" dialog for variants (option name + values, e.g. Size: Small/Medium/Large)
- `/admin/items/categories`: real create/edit form; clicking a category row navigates into `/admin/items` filtered to that category, not just a flat list
- Add `stock_levels` (item_id, quantity, low_stock_threshold) and `stock_adjustments` (item_id, type: add/adjust, quantity, note, created_by, created_at) tables via migration
- `/admin/inventory`: point at real `items` + `stock_levels` instead of `mock-inventory.js` — query must filter to `items.track_stock = true` only; a made-to-order item like Cappuccino should never get a row here at all. Status badge (In stock / Low stock / Out of stock) is derived from `quantity` vs `low_stock_threshold`, not hardcoded
- Restock becomes two simple actions instead of the old single "restock" button: **Add stock** (enter units received, adds to current) and **Adjust count** (enter the actual current count — end-of-day recount, or an item running out). Both log a row in `stock_adjustments`
- Keep the existing plain shadcn `Table` pattern here — don't introduce the ReUI DataGrid yet, that's still an open decision (see Phase 10)

**Done when:** you can add/edit/delete a real item (with variants) or category, click into a category to see its items, and restock or adjust a real item's count — all of it survives a page refresh.

---

## Phase 3 — POS PWA, online-only MVP ✅ functionality / UI pass needed
**Goal:** a working order-taking app against real data, writing real orders. No offline handling yet — that's Phase 5.

Tasks:
- New `apps/pos`, built fresh (not extracted from `/dashboard`)
- Reads items/categories live from Supabase, respecting `available_for_sale`
- Order-building UI → writes a real order to `orders` / `order_items` tables on checkout, one row per line item
- Items with variants open a picker before adding, respecting per-value price overrides
- Reuse `packages/ui` where POS and admin visuals genuinely overlap; POS-specific components (large touch targets, terminal-oriented layout) stay local to `apps/pos`
- Reuse the shared `notifyError` friendly-error pattern from admin

**Layout spec (redo pass — current build is functionally correct but too bare):**
- Main area: category tabs at top, then an item grid — real cards with name, price, a quantity stepper or "Choose Size" trigger, sized for touch, not a thin single-column list
- Right panel, persistent (not a collapsing bottom bar): current order's line items (name, qty, line total, remove), a subtotal/tax/total summary, a payment method selector (Cash/Card/Mobile), and a full-width "Place order" button
- Pull buttons, cards, and color (emerald green) from `packages/ui` so this visually matches the admin app instead of looking like a separate, unfinished product
- No table/dine-in workflow — this is counter-service, single running order at a time

**Done when:** you can ring up a full order on the POS app against real menu data while online, it lands in Supabase correctly, and the screen looks like a finished product — not a functional placeholder.

---

## Phase 4 — Wire Reports & Receipts to real orders ✅
**Goal:** the two pages that were reading `mock-transactions.js` now read the real thing. This can only happen after Phase 3, since real orders don't exist until the POS app is writing them.

Tasks:
- `/admin` (Sales report): point the filters, stat tabs, and charts at real `orders`/`order_items` instead of `mock-transactions.js`
- `/admin/receipts`: same swap for the transaction log; keep the existing CSV export and print-to-window logic, just change the data source
- Recheck the "Download sales report" button — decide now whether it becomes a real export or stays deferred

**Done when:** a real order rung up on the POS app shows up correctly in both the Sales report and Receipts within the admin.

---

## Phase 5 — Offline-first ✅
**Goal:** the POS app keeps working with no connection, and catches up once it's back.

Tasks:
- Add the PowerSync client to `apps/pos`, pointed at the Supabase project
- Local store (SQLite/IndexedDB via PowerSync) caches items/categories and queues order writes
- All order writes go local-first; sync happens in the background
- Manual test: disconnect mid-order, keep working, reconnect, confirm the order lands in Supabase

**Done when:** an order taken fully offline shows up in Supabase after reconnecting, with no data loss or duplication.

---

## Phase 6 — Installable PWA
**Goal:** POS runs as an installed app on a terminal or PC — no separate desktop build. No hardware integration in this phase — plain software, installable and that's it. Printer/cash-drawer/scanner work is deferred (see Phase 10) until there's an actual reason to need it.

Tasks:
- Add a web app manifest (name, icons, `display: standalone`, theme color) to `apps/pos` so it's installable via the browser's "Add to Home Screen" / install prompt on Chrome/Edge/ChromeOS/Android/Windows
- Wire up a service worker (`next-pwa`/Workbox) for app-shell caching, on top of the data sync already in place from Phase 5

**Done when:** the POS app can be installed from the browser on a terminal/PC and opens as a standalone app, no browser chrome.

---

## Phase 7 — POS devices, employee PINs & shifts
**Goal:** a device is activated once with a real login; after that, staff open and close shifts with just a PIN, and every sale is attributed to whoever's shift it happened under.

Tasks:
- `pos_devices` table (account_id, name, status: not_activated/activated, activated_at) — backs the existing Settings > POS devices screen. "Activate" happens by signing into `apps/pos` once with a real Supabase login on that device; the device then stays activated (persisted locally) and never needs full login again
- `employees` table (account_id, full_name, email, phone, role: Owner/Administrator/Manager/Cashier, pos_pin, pos_pin_enabled, status) — **not** more `profiles` rows: `profiles.id` is a hard FK to `auth.users.id`, and staff never get a real Supabase Auth login at all, only a PIN checked locally against this table. The owner gets a row here too (role Owner, auto-created alongside their profile on signup) so their own sales attribute the same way. Backs the existing Employees list + Owner/Employee edit dialogs
- `shifts` table: employee_id, pos_device_id, opened_at, closed_at, opening_float, closing_cash_counted, expenses_total, expected_cash, discrepancy, status (open/closed)
- `shift_expenses` table: shift_id, amount, note, created_at — logged any time during the shift, not just at close
- Add `shift_id` to `orders` — every sale is attributed to the shift (and through it, the employee) that rang it up
- **Start shift flow** on `apps/pos` (once device is activated): pick employee name from a list → enter their PIN → on match, prompt for opening float (defaults to whatever the previous shift left behind, or 0 if it was cleared to the safe) → shift opens, selling unlocks
- **Close shift flow**: log any remaining expenses, enter cash counted in the drawer, system computes expected cash (opening float + cash sales − expenses) and shows the discrepancy, confirm to close and record the end time
- Reports/receipts should be filterable by shift, so a worker (or the owner) can see exactly what was sold in a given shift window, regardless of how many people worked that day

**Done when:** a device can be activated once; day-to-day, a worker opens a shift with their PIN, sells under that shift, closes it with a real cash reconciliation, and the next shift correctly inherits the float that was left behind.

**Status: core flow built, not yet migrated/synced.** Schema (`0006_devices_pins_shifts.sql`), real Employees + POS devices admin CRUD, and the full `apps/pos` flow (device activation, employee/PIN picker, opening float, mid-shift expense logging, close-with-discrepancy) are written. Still needed before this is usable: run the migration, add the 4 new tables to the PowerSync Sync Streams config, and — optional, not required by the "Done when" line above — make Sales report/Receipts filterable by shift.

---

## Phase 8 — Customer debt ledger
**Goal:** Taken/Paid/Owed stop being hardcoded zeros and become a real ledger.

Tasks:
- `tickets` table: customer_id, account_id, total_amount, status (open/cleared), created_by (employee), created_at
- `ticket_items` table: ticket_id, item_id, quantity, unit_price, line_total — referencing real items, not free text
- `ticket_payments` table: ticket_id, amount, paid_at, recorded_by — supports partial payments against a ticket
- "Clear" action: one action that settles the remaining balance on a ticket in a single step
- `/admin/customers` list: Taken = sum of ticket totals, Paid = sum of payments, Owed = Taken − Paid, computed from real data instead of hardcoded 0/0/0
- The existing Add/Edit customer dialog (Name, Email, Phone, Address, City, Country, ID number) stays as-is — this phase is about the ledger behind it, not the contact record

**Done when:** recording a ticket against a customer, logging a partial payment, and clearing a ticket all show up correctly in the Taken/Paid/Owed columns, and survive a refresh.

---

## Phase 9 — Settings persistence
**Goal:** Settings stops resetting on refresh.

Tasks:
- **Features**: persist the 9 toggles (Shifts, Time clock,, Low stock notifications, Negative stock alerts, Weight-embedded barcodes) to Supabase
- **Payment types**: persist the list; wire up the drag-to-reorder that's currently visual-only
- **Receipt**: persist logo, header/footer text, toggles, and language; actually connect the uploaded logo to the print flow (currently disconnected)


**Done when:** every Settings sub-page keeps its values after a refresh, and a printed receipt actually uses the uploaded logo.

---

## Phase 10 — Deferred / later
Not blocking the core product — revisit once Phases 0–9 are solid:
- Multi-store support (touches nearly every table with a `store_id`)
- Billing & subscriptions
- Loyalty & discounts, Taxes (rate config lands in Phase 9; this stays deferred). Design sketched ahead of time so it doesn't get rebuilt wrong later: discounts apply at the order level (not per line item); the admin defines discount types up front (e.g. "Employee discount," "Promo code," a loyalty-points discount) each with an amount/percentage to subtract from the order total; a loyalty-type discount is tied to a customer record (ties into Phase 8's customer ledger) so it can factor in their points/history, while other discount types don't need a customer attached at all. `orders` will need a `discount_type_id` + `discount_amount` (or similar) once this is built — no such columns exist yet.
- Access rights permission matrix
- Standardizing shadcn `Table` vs. ReUI `DataGrid` across all list pages
- Hardware integration for `apps/pos` — not needed for a plain software POS, revisit only if a real terminal setup calls for it: thermal printer via WebUSB/Web Serial (ESC/POS commands, no driver install, reliable on Linux/Mac/ChromeOS) with a Windows fallback of the plain browser print dialog + kiosk mode silent printing (Windows' own driver usually claims the USB device before WebUSB can); cash drawer triggered via the printer's kick-drawer command; barcode scanner needs no work at all since it's just keyboard input in any browser

---

## How to use this with Claude Code
Each phase is scoped as a single, self-contained instruction block — paste one phase at a time into Claude Code, verify its "Done when" line, then move to the next. Don't hand over multiple phases at once: Phase 4 genuinely needs Phase 3's real orders to exist, Phase 7's shifts need Phase 3's orders table to add a `shift_id` to, and so on down the list.
