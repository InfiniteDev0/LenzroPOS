# Lenzro POS — Project Overview & Game-Plan Doc

Generated as a snapshot for planning purposes. This describes what exists in the codebase right now, what's real vs. mock, and what was deliberately left out (and why). Use it to decide what to build next.

## The big picture

This is a Next.js 16 app (App Router, Turbopack, `@base-ui/react` + a customized shadcn-style design system) for a Kenyan restaurant/retail POS, "Lenzro POS." Currency throughout is KSh. There are **two separate, parallel UIs** living in the same codebase:

1. **`/dashboard`** — the original POS terminal UI (order-taking, tables, dishes, finance). This was the starting point of the project and has been **deliberately left untouched** through this entire build — it's a visual reference for "what the POS looks like," not something being actively developed right now.
2. **`/admin`** — a brand new admin/back-office section, built from scratch over this whole session. This is where nearly all the work described below lives.

Both sit behind the same Supabase-backed auth. After login, users land on `/admin`, not `/dashboard`.

## Auth

- `/auth` — a single page that toggles between `LoginForm` and `SignupForm` (both real, wired to Supabase `signInWithPassword` / `signUp`).
- `src/proxy.js` (this Next.js version renamed `middleware.js` → `proxy.js`) protects `/dashboard/*` and `/admin/*`, redirecting unauthenticated users to `/auth`, and redirects already-authenticated users away from `/auth` to `/admin`.
- Logout: there are **two** logout entry points now. `LogoutButton` (used in the old `/dashboard` sidebar) had a confirmation dialog and worked already. `NavUser` (the account menu in the new `/admin` sidebar) did **not** actually log out until just now — its "Log out" item was decorative. It's now wired to the same `supabase.auth.signOut()` → redirect flow.
- **No real user/session data beyond auth.** The "Owner" employee, customers, inventory, etc. are not tied to the logged-in Supabase user — they're separate mock data. See "Data architecture" below.

## The Admin section, page by page

Sidebar nav (top to bottom): **Reports** (group) → **Item** (group) → **Inventory** → **Employees** (group) → **Customers** → **Settings**.

### Reports → All Sales (`/admin`)
The post-login landing page. A toolbar of connected filters — **Date range** (with presets: Today/Yesterday/This week/Last week/This month/Last month/Last 7 days/Last 30 days, switching between a single-day and a two-month range calendar), **Time-of-day** (All day / Custom hour range), **Employee** (multi-select) — all feed into one shared query (`sales-query.js`) run against `mock-transactions.js`, a seeded (deterministic, ~180 days, no `Math.random()` to avoid hydration mismatches) list of individual mock orders, each with an employee, item, category, payment method, and amounts.

A **Sales filter** dropdown switches which *view* renders below the toolbar:
- **Sales summary** — the default: 5 stat tabs (Gross sales / Refunds / Discounts / Net sales / Gross profit, each with a real change-vs-previous-period %), and a chart (Area/Line toggle) whose granularity **adapts automatically**: hourly points for a single-day filter, daily points for a range, with a Days/Weeks/Months re-bucket selector for ranges.
- **Sales by item** — top 5 items list + a net-sales trend chart.
- **Sales by category**, **Sales by employee**, **Sales by payment type**, **Discounts** — each a plain aggregate table computed from the same filtered transaction set.
- **Download sales report** button exists but is **visual only** — no export wired up yet (this is different from Receipts' CSV export, see below).

### Reports → Receipts (`/admin/receipts`)
The actual **transaction log** (individual orders, not aggregated), deliberately kept separate from the Sales report per your instruction ("the sales table is different bc we are generating reports"). Filters: Date, Time, Employee, Category, Item, Payment method (all multi-select where applicable), plus free-text search. Full data table: checkbox selection, pagination (rows-per-page + page nav), per-row print icon.

- **Print is real**: opens a formatted receipt in a new window and calls the browser print dialog — works for one row or a bulk-selected group (page-break between receipts).
- **Export CSV is real**: builds an actual CSV client-side and triggers a browser download (works because it runs in the real browser, not a sandboxed preview).

### Item → All items / All categories (`/admin/items`, `/admin/items/categories`)
Both are currently **empty states** (illustration + heading + description + an "Add item"/"Add category" button). The buttons don't do anything yet — no item/category creation flow has been built. This is intentionally the *last* unbuilt piece of the "Item" area; menu items themselves are only referenced today as mock data baked into `mock-transactions.js` (a fixed catalog of 10 dishes/drinks across 4 categories), not as user-editable records.

### Inventory (`/admin/inventory`)
A real stock-tracking page: Category/Item filters + search, a red alert banner when items are critically low, and a table with a color-coded stock-level bar (red/amber/green) per item plus a status badge. Restocking is real (in-memory): a per-row restock button and bulk "Restock selected"/"Restock all," both confirmed via toast.

### Employees (`/admin/employees`, `/admin/employees/access-rights`)
- **Employee list** — a full ReUI/`@tanstack/react-table` v9 data grid (checkbox selection, sortable, resizable/pinnable columns) over the 4 mock employees (`lib/employees.js`). Columns: Name (avatar), Email, Phone, Role. Click a row (or the pencil icon) to edit; a kebab menu offers Reset PIN / Deactivate (toast-only) and Delete (with a real confirmation dialog). **The Owner row is special**: always pinned to the top regardless of sort, highlighted light emerald, can't be deleted, and clicking it opens a *different* dialog (`OwnerDialog`) with a 4-digit POS PIN editor and a Disable/Enable PIN toggle, instead of the normal role-editable dialog.
- **Access rights** — a **blank stub** (just the page shell). This was explicit: you said "access rights is blank" for now, even though you shared a reference screenshot (Owner/Administrator/Manager/Cashier roles table with permission toggles) for *later*.
- "Add employee" button exists but doesn't open anything yet — no employee-creation flow, and critically **no PIN-setup step**, which you flagged as needing to exist before employee creation is built ("we create a pos pin where cashier login too before even creating an employee").

### Customers (`/admin/customers`)
Empty state → "Add customer" dialog (Name/Email/Phone/Address/City/Country/ID number — trimmed down from a reference screenshot per your request, dropping Postal code/Region/Note/Customer code) → once you add one, the page switches to a real list with a **Table/Card view toggle**. Each customer shows Taken / Paid / Owed, currently always **0/0/0** for everyone.

**This is the biggest deliberately-incomplete piece.** You described this as a debt-book: customers take goods on credit, you record "tickets" (individual debt entries), can record partial payments against a ticket, or "Clear" a ticket in one action. None of that ledger exists yet — only the customer *record* (contact info) does. Taken/Paid/Owed are just static zeros with nowhere to write to. This was a deliberate staging decision (yours, not just mine) — you said "first add the add new customer... thingy" before getting into tickets.

### Settings (`/admin/settings/*`)
Its own internal two-panel shell (`SettingsNav` + content), separate from the main app sidebar:
- **Features** — 9 real toggles (Shifts, Time clock, Open tickets, Kitchen printers, Customer displays, Dining options, Low stock notifications, Negative stock alerts, Weight-embedded barcodes), state held locally, "Save" just toasts.
- **Payment types** — Cash/Card list, checkboxes, an "Add payment type" dialog that really appends to the list. Drag-to-reorder handle is **visual only** (no DnD wired).
- **Receipt** — logo upload (real image preview via `FileReader`, not uploaded anywhere), Header/Footer textareas with char counters, Show customer info / Show comments toggles, language select (English/Swahili).
- **Billing & subscriptions**, **Stores** — one-line "coming soon" stubs. Explicitly deferred by you (multi-store support, billing).
- **POS devices** — the one thing under Settings you said to build in full: add/edit/delete devices via a dialog (phone icon, Name, Status + activation instructions), table with checkboxes. No real device-activation flow (that would need an actual POS terminal app to pair with).
- **Loyalty** and **Taxes** — you said you don't need these at all right now, so they're not in the nav and don't exist as routes.

## Data architecture — read this before planning a backend

**Nothing in `/admin` talks to a database.** Every page's data is one of:
- A hand-written or seeded-random mock array in `src/lib/*.js` (`mock-transactions.js`, `mock-inventory.js`, `employees.js`, `mock-sales.js`), imported as a static module-level constant, or
- `useState` seeded from one of those constants, mutated only in the browser tab's memory (refresh the page and every edit — restocks, employee edits, added customers, deleted receipts row selections, feature toggles — is gone).

Supabase is used **only** for authentication (`@supabase/ssr`, `@supabase/supabase-js`). There's no `orders`, `employees`, `customers`, `inventory`, or `settings` table — those concepts exist only as JS objects in the frontend right now.

This matters for game-planning: the natural next phase isn't really "add more admin pages" so much as "decide the real data model and wire persistence," because right now every page would independently need its own backend design.

## Design system notes

- Base: a customized shadcn/ui setup (`style: "base-nova"`) on `@base-ui/react` primitives (not Radix) — Popover/Select/Dialog/DropdownMenu/etc. all use `useRender`/`render` prop composition, not `asChild`.
- Charts: Recharts via the shadcn `chart.jsx` wrapper.
- The heavier data tables (Employees, and available for future use) use a separately-installed **ReUI** `DataGrid` on `@tanstack/react-table` v9 (a different, more complex component than the plain shadcn `Table` used everywhere else — e.g., Receipts/Inventory/Sales-by-* tables). Two table paradigms now coexist in the codebase; worth deciding whether to standardize.
- Brand color is emerald green for primary actions throughout; sidebar dark-mode is currently forced on (`<html class="... dark">`).

## Deliberately excluded / deferred — full list, and why

| What | Why it's not built |
|---|---|
| Any real backend/database beyond auth | Never asked for — every admin feature so far was scoped as "build the UI against mock data first." This was never explicitly stated as the plan, it's an inference from how each feature request arrived (one page/interaction at a time, always answered with mock data + local state). Worth confirming with you before assuming it's still right. |
| Customer debt ledger (tickets, payments, clear) | You explicitly staged this — customer *records* first, ledger next. Not started. |
| Employee creation + POS PIN setup flow | You flagged the PIN needs to exist first; neither exists yet. "Add employee" button is inert. |
| Access rights permissions table | You said "blank for now," despite sharing the target design. |
| Item/Category creation | Only empty-state buttons exist; no forms. |
| Multi-store support, Billing & subscriptions | You explicitly said "later." |
| Loyalty, Taxes settings | You said you don't need them — not even stubbed. |
| Excel/CSV export on the Sales Report page | Only Receipts got a real CSV export; the Sales Report "Download sales report" button is still a no-op. Two different pages, two different export expectations that haven't been reconciled. |
| Real payment-type drag-reorder | Grip icon is decorative. |
| Deactivate / Reset PIN (employees) | Toast-only, no actual state change — an employee "deactivated" this way still shows fully active everywhere else. |
| Receipt logo actually saved/used on printed receipts | The upload preview and the `printReceipts()` function are unconnected — printing doesn't pull the uploaded logo. |
| Any notion of "which store/location" | The whole app implicitly assumes a single store; POS devices/employees aren't scoped to a store id. |

## Suggested questions to think about for the game plan

- Is mock-data-in-memory still the right approach for the *next* feature, or is it time to pick a real backend (Supabase tables, given auth's already there) and start persisting at least one vertical (e.g., Employees or Inventory) end-to-end?
- Customers' debt ledger is the largest half-built concept — is it the next priority, or does Item/Category creation need to land first (since tickets probably need to reference real items, not just a free-text description)?
- The Sales Report page and the Receipts page both want "download," but produce different things (aggregated report vs. raw CSV) — do you want one export system or are they legitimately different features?
- Two data-table systems (plain shadcn `Table` vs. ReUI `DataGrid`) exist side by side — worth standardizing before more list pages get built, or is per-page choice fine?
- The POS PIN concept (Owner has one, cashiers need one to log into a POS terminal) implies a login flow for the *POS side* (`/dashboard`) that doesn't exist yet — is that the next big vertical after Admin settles down?
