/**
 * Current stock level for an item — one row per item, as returned by
 * Supabase (`public.stock_levels`).
 *
 * @typedef {Object} StockLevel
 * @property {string} item_id
 * @property {number} quantity
 * @property {number | null} low_stock_threshold
 * @property {string} updated_at
 */

/**
 * A single stock change (`public.stock_adjustments`). "add" adds to the
 * running quantity (e.g. units received); "adjust" sets the quantity
 * outright (e.g. an end-of-day recount).
 *
 * @typedef {Object} StockAdjustment
 * @property {string} id
 * @property {string} item_id
 * @property {"add" | "adjust"} type
 * @property {number} quantity
 * @property {string | null} note
 * @property {string} created_by
 * @property {string} created_at
 */

export {};
