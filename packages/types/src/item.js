/**
 * An item row as returned by Supabase (`public.items`).
 * Field names are snake_case to match the DB/`supabase-js` shape exactly —
 * no camelCase mapping layer exists (yet).
 *
 * @typedef {Object} Item
 * @property {string} id
 * @property {string} account_id
 * @property {string} category_id
 * @property {string} name
 * @property {number} price
 * @property {string | null} sku
 * @property {string | null} barcode
 * @property {boolean} active
 * @property {string} created_at
 */

/** Default shape for a new, unsaved item — e.g. to seed a create form. */
export const emptyItem = {
  name: "",
  category_id: "",
  price: 0,
  sku: "",
  barcode: "",
  active: true,
};
