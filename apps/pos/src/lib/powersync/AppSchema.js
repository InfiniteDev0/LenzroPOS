import { column, Schema, Table } from "@powersync/web";

// Menu data — synced down from Postgres (read-only in practice; this app
// never writes to these locally). Matches the Sync Streams deployed on
// the PowerSync instance: menu_categories, menu_items, menu_item_variants,
// menu_item_variant_values.
const categories = new Table({
  account_id: column.text,
  name: column.text,
  active: column.integer,
});

const items = new Table(
  {
    account_id: column.text,
    category_id: column.text,
    name: column.text,
    price: column.real,
    cost: column.real,
    sold_by: column.text,
    available_for_sale: column.integer,
    track_stock: column.integer,
    sku: column.text,
    barcode: column.text,
    image_url: column.text,
  },
  { indexes: { by_category: ["category_id"] } }
);

const item_variants = new Table(
  {
    item_id: column.text,
    option_name: column.text,
  },
  { indexes: { by_item: ["item_id"] } }
);

const item_variant_values = new Table(
  {
    variant_id: column.text,
    value: column.text,
    price_override: column.real,
  },
  { indexes: { by_variant: ["variant_id"] } }
);

// Read-only here too — lets the sales screen flag "running low"/"out of
// stock" so a cashier knows to tell the owner, using the same numbers
// Inventory (in the admin app) is already tracking. Nothing in this app
// ever adjusts stock; that stays an admin-only action.
//
// stock_levels' Postgres primary key is item_id, not id — PowerSync
// requires a synced `id` column, so the stream selects `item_id as id`
// (see the stock_levels stream in the Sync Streams config).
const stock_levels = new Table(
  {
    item_id: column.text,
    quantity: column.real,
    low_stock_threshold: column.real,
  },
  { indexes: { by_item: ["item_id"] } }
);

// Orders — written locally first (offline-capable), then uploaded via
// BackendConnector.uploadData(). account_id/created_by/status are left
// out here deliberately: Postgres fills them in via column defaults
// (default auth.uid(), default 'completed') on upload, exactly like the
// direct supabase-js insert did before PowerSync existed. Don't add them
// here without also updating the connector.
const orders = new Table({
  subtotal: column.real,
  tax: column.real,
  total: column.real,
  payment_method: column.text,
  shift_id: column.text,
  // Who was signed in at the till. Set independently of the shift so a
  // sale is still attributable with Shifts switched off, where shift_id
  // is null by design.
  employee_id: column.text,
  // Set client-side at insert time (like `id`) rather than left for
  // Postgres's `default now()` — the Tickets view needs to sort/show a
  // real timestamp immediately after checkout, before this row has ever
  // round-tripped through Postgres and synced back down.
  created_at: column.text,
  discount_type_id: column.text,
  discount_amount: column.real,
  customer_id: column.text,
  customer_name: column.text,
  order_type: column.text,
  // payment_method stays the human-readable label ("M-Pesa") so receipts
  // and reports read correctly without a join; payment_type_id is what
  // ties the sale back to the configured type it was taken on.
  payment_type_id: column.text,
});

// Admin-defined, cashier-applied at checkout — read-only here.
const discount_types = new Table({
  name: column.text,
  kind: column.text,
  value: column.real,
  apply_to: column.text,
  active: column.integer,
});

// A real customer (has an account, can carry a tab) vs. a free-text walk-in
// name typed straight onto the order (orders.customer_name) — only a real
// customer_id unlocks the "Add to tab" payment option.
const customers = new Table({
  name: column.text,
  phone: column.text,
});

// Written from here too — a cashier can log a payment against a
// customer's running tab balance without that requiring a new order.
const customer_payments = new Table({
  customer_id: column.text,
  amount: column.real,
  created_at: column.text,
  // Null when logged from the admin app (the owner is the one recording
  // it there) — set to the current shift's employee when logged here.
  recorded_by_employee_id: column.text,
});

// Tracks how each payment was split across specific tab orders — see
// apps/admin's copy of this table/migration for the full reasoning
// (revenue recognition: a tab order only counts as a sale once fully
// allocated, dated when that happened, not when it was placed).
const customer_payment_allocations = new Table({
  payment_id: column.text,
  order_id: column.text,
  amount: column.real,
  created_at: column.text,
});

// Staff + shift data (Phase 7). employees/pos_devices are read-mostly from
// this app (PIN checks, device lookup) — the owner manages both for real
// from the admin app. shifts/shift_items are written from here: opening a
// shift is a local insert, closing one is a local update, same
// write-local-then-upload pattern as orders. account_id is left out of
// all four for the same reason as orders — Postgres fills it in via
// `default auth.uid()` on upload.
const employees = new Table({
  full_name: column.text,
  email: column.text,
  phone: column.text,
  role: column.text,
  pos_pin: column.text,
  pos_pin_enabled: column.integer,
  status: column.text,
});

const pos_devices = new Table({
  name: column.text,
  status: column.text,
  activated_at: column.text,
  // Only the columns listed here exist in the local database, whatever
  // Postgres has. This one was missing while device activation ordered by
  // it, so that query failed with "no such column: created_at" — and
  // because a failed useQuery just yields no rows, activation concluded
  // the account had no device and offered to create one instead.
  created_at: column.text,
});

const shifts = new Table(
  {
    employee_id: column.text,
    pos_device_id: column.text,
    opened_at: column.text,
    closed_at: column.text,
    opening_float: column.real,
    closing_cash_counted: column.real,
    expenses_total: column.real,
    expected_cash: column.real,
    discrepancy: column.real,
    status: column.text,
    business_day_id: column.text,
  },
  { indexes: { by_device: ["pos_device_id"] } }
);

const shift_expenses = new Table(
  {
    shift_id: column.text,
    amount: column.real,
    note: column.text,
    created_at: column.text,
  },
  { indexes: { by_shift: ["shift_id"] } }
);

// A trading day, spanning however many shifts happen between "day begins"
// and "End business day". Scoped per device, same as shifts. Opened
// implicitly by the first shift of the day, closed explicitly — the
// closing totals are snapshotted onto the row so the day's Z-report stays
// stable even if later data changes.
const business_days = new Table(
  {
    pos_device_id: column.text,
    opened_at: column.text,
    closed_at: column.text,
    opened_by_employee_id: column.text,
    closed_by_employee_id: column.text,
    status: column.text,
    gross_sales: column.real,
    cash_sales: column.real,
    non_cash_sales: column.real,
    tab_sales: column.real,
    expenses_total: column.real,
    order_count: column.integer,
    note: column.text,
  },
  { indexes: { by_device: ["pos_device_id"] } }
);

// The Settings > Features toggles, owned by the admin app and read-only
// here. One row per account, so the till just takes the first row it has.
const account_settings = new Table({
  shifts_enabled: column.integer,
  open_tickets_enabled: column.integer,
  low_stock_alerts_enabled: column.integer,
  negative_stock_alerts_enabled: column.integer,
  // What prints on a receipt. Lived in the admin browser's localStorage
  // until migration 0015, which is why the till used to print a
  // hardcoded "Lenzro POS" header no matter what the owner configured.
  receipt_header: column.text,
  receipt_footer: column.text,
  receipt_show_customer: column.integer,
  receipt_logo_url: column.text,
});

// The payment buttons at checkout, defined by the owner in Settings >
// Payment types. Read-only here — this replaced a hardcoded cash/card/
// mobile array that ignored whatever the owner had configured.
const payment_types = new Table({
  name: column.text,
  kind: column.text,
  sort_order: column.integer,
  active: column.integer,
});

const order_items = new Table(
  {
    order_id: column.text,
    item_id: column.text,
    variant_value_id: column.text,
    name: column.text,
    variant_label: column.text,
    unit_price: column.real,
    quantity: column.real,
    line_total: column.real,
  },
  { indexes: { by_order: ["order_id"] } }
);

export const AppSchema = new Schema({
  categories,
  items,
  item_variants,
  item_variant_values,
  stock_levels,
  orders,
  order_items,
  employees,
  pos_devices,
  shifts,
  shift_expenses,
  business_days,
  account_settings,
  payment_types,
  discount_types,
  customers,
  customer_payments,
  customer_payment_allocations,
});
