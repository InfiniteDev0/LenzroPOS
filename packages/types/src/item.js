/**
 * An item row as returned by Supabase (`public.items`).
 * Field names are snake_case to match the DB/`supabase-js` shape exactly —
 * no camelCase mapping layer exists (yet).
 *
 * `available_for_sale` and `track_stock` are independent: a made-to-order
 * item (e.g. a cappuccino) is sale:true/track:false, a raw material (e.g.
 * sugar) is sale:false/track:true, a bottled soda is both true.
 *
 * @typedef {Object} Item
 * @property {string} id
 * @property {string} account_id
 * @property {string} category_id
 * @property {string} name
 * @property {number} price
 * @property {number | null} cost
 * @property {"each" | "weight"} sold_by
 * @property {boolean} available_for_sale
 * @property {boolean} track_stock
 * @property {string | null} sku
 * @property {string | null} barcode
 * @property {string} created_at
 */

/** Default shape for a new, unsaved item — e.g. to seed a create form. */
export const emptyItem = {
  name: "",
  category_id: "",
  price: 0,
  cost: "",
  sold_by: "each",
  sku: "",
  barcode: "",
  available_for_sale: true,
  track_stock: false,
};
