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
  orders,
  order_items,
});
