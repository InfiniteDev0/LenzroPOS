/**
 * An order rung up on the POS, as returned by Supabase (`public.orders`).
 *
 * @typedef {Object} Order
 * @property {string} id
 * @property {string} account_id
 * @property {"completed" | "voided"} status
 * @property {number} subtotal
 * @property {number} tax
 * @property {number} total
 * @property {"cash" | "card" | "mobile"} payment_method
 * @property {string} created_by
 * @property {string} created_at
 */

/**
 * A line item on an order (`public.order_items`). `name`/`variant_label`/
 * `unit_price` are snapshots taken at sale time, independent of the current
 * item/variant record.
 *
 * @typedef {Object} OrderItem
 * @property {string} id
 * @property {string} order_id
 * @property {string} item_id
 * @property {string | null} variant_value_id
 * @property {string} name
 * @property {string | null} variant_label
 * @property {number} unit_price
 * @property {number} quantity
 * @property {number} line_total
 * @property {string} created_at
 */

export {};
