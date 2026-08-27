@AGENTS.md

# Lenzro POS — Build Roadmap

## Current state
- Single Next.js 16 app in `web/` (JavaScript, not TypeScript — `jsconfig.json`)
- Supabase wired for auth only (`@supabase/ssr`), no other tables yet
- `supabase/` folder already present in `web/` — Supabase CLI already initialized locally
- `/admin` — new admin UI, fully built visually, **no persistence beyond auth** (everything is mock arrays / local state)
- `/dashboard` — original POS terminal UI reference. **Not being reused** — POS PWA UI/logic will be rebuilt fresh (see Phase 3)
- `AGENTS.md` / `CLAUDE.md` already exist at the `web/` root — keep these current as the repo splits into a monorepo, so each app has the right context for Claude Code

## Decisions locked in
- **Monorepo**: pnpm workspaces + Turborepo
- **Backend**: Supabase (Postgres + auth + realtime) — no separate API server to host
- **POS offline sync**: PowerSync, using its native Supabase integration
- **POS desktop**: Electron wrapper around the same Next.js POS app (one codebase, PWA in browser/tablet, packaged via Electron for a dedicated terminal)
- **Foundational entity**: Items & Categories — inventory, orders/receipts, and customer tickets all reference it, so it's built and made real before anything downstream

## Target repo shape
```
lenzro/
├── apps/
│   ├── admin/       # current web/ app, moved here as-is
│   ├── pos/          # new — extracted from web/src/app/dashboard
│   └── electron/      # Electron shell wrapping apps/pos
├── packages/
│   ├── supabase/      # shared client + generated types
│   ├── ui/             # shared design system components
│   └── types/           # shared entity types (Item, Category, Order, etc.)
```

---

## Phase 0 — Monorepo restructuring
**Goal:** current app runs exactly as it does today, just relocated, with workspace tooling in place. No feature work.

Tasks:
- Init a pnpm workspace + Turborepo config at the repo root
- Move `web/` → `apps/admin/`, confirm it still builds and runs unchanged
- Delete `package-lock.json`, reinstall with pnpm
- Create empty `packages/supabase`, `packages/ui`, `packages/types` scaffolds
- Move the existing Supabase client init into `packages/supabase`, import it from `apps/admin`

**Done when:** `pnpm dev --filter admin` runs the exact same admin app as before — nothing regressed, nothing looks different.

---

## Phase 1 — Items & Categories schema
**Goal:** real Postgres tables behind the empty-state pages, replacing mock arrays.

Tasks:
- Create `categories` and `items` tables via a migration in `supabase/migrations` (name, price, category_id, optional sku/barcode, active flag)
- Row-level security scoped to the authenticated account
- Generate/write shared types into `packages/types`

**Done when:** tables exist in local Supabase, migrations apply cleanly, types are generated and importable.

---

## Phase 2 — Wire the Admin item pages to real data
**Goal:** `/admin/items` and `/admin/items/categories` go from empty-state buttons to real CRUD.

Tasks:
- Replace the inert "Add item" / "Add category" buttons with real create/edit forms
- List views read from Supabase instead of the fixed catalog baked into `mock-transactions.js`
- Keep the existing plain shadcn `Table` pattern here — don't introduce the ReUI DataGrid yet, that's still an open decision (see Phase 7)

**Done when:** you can add, edit, and delete a real item or category, and it survives a page refresh.

---

## Phase 3 — POS PWA, online-only MVP
**Goal:** a working order-taking app against real data. No offline handling yet — that's Phase 4.

Tasks:
- New `apps/pos`, built fresh (not extracted from `/dashboard` — that UI/logic is being redesigned)
- Reads items/categories live from Supabase
- Order-building UI → writes a real order to new `orders` / `order_items` tables on checkout
- Reuse `packages/ui` where POS and admin visuals genuinely overlap; POS-specific components (large touch targets, terminal-oriented layout) stay local to `apps/pos`

**Done when:** you can ring up a full order on the POS app against real menu data while online, and it lands in Supabase.

---

## Phase 4 — Offline-first
**Goal:** the POS app keeps working with no connection, and catches up once it's back.

Tasks:
- Add the PowerSync client to `apps/pos`, pointed at the Supabase project
- Local store (SQLite/IndexedDB via PowerSync) caches items/categories and queues order writes
- All order writes go local-first; sync happens in the background
- Manual test: disconnect mid-order, keep working, reconnect, confirm the order lands in Supabase

**Done when:** an order taken fully offline shows up in Supabase after reconnecting, with no data loss or duplication.

---

## Phase 5 — Electron desktop + hardware
**Goal:** POS runs as an installable app on a real terminal or PC, not just a browser tab.

Tasks:
- `apps/electron` wraps `apps/pos`, packaged with electron-builder
- Thermal printer integration (ESC/POS) for receipts
- Cash drawer trigger via the printer
- Barcode scanner support (usually keyboard-wedge, likely needs no special code beyond input handling)

**Done when:** a packaged build runs on a Windows/Linux terminal and prints an actual receipt.

---

## Phase 6 — Remaining admin verticals, now backed by real data
**Goal:** close out the "deliberately excluded" list from the project overview, in dependency order.

Tasks:
- **Inventory** — point at real `items` instead of `mock-inventory.js`
- **Employees** — creation flow + POS PIN setup (this has to exist before POS login matters)
- **POS login** on `apps/pos` using employee PINs
- **Customers** — the debt ledger: tickets that reference real items, partial payments, "Clear"
- **Settings** — persist Features / Payment types / Receipt config to Supabase instead of local state

**Done when:** refreshing any admin page no longer loses data.

---

## Phase 7 — Deferred / later
Not blocking the core product — revisit once Phases 0–6 are solid:
- Multi-store support (touches nearly every table with a `store_id`)
- Billing & subscriptions
- Loyalty, Taxes
- Access rights permission matrix
- Standardizing shadcn `Table` vs. ReUI `DataGrid` across all list pages

---

## How to use this with Claude Code
Each phase is scoped as a single, self-contained instruction block — paste one phase at a time into Claude Code, verify its "Done when" line, then move to the next. Don't hand over multiple phases at once: Phase 3 genuinely needs Phase 1–2 to be real first, or the POS app just ends up pointed at another mock array.