/**
 * A category row as returned by Supabase (`public.categories`).
 * Field names are snake_case to match the DB/`supabase-js` shape exactly —
 * no camelCase mapping layer exists (yet).
 *
 * @typedef {Object} Category
 * @property {string} id
 * @property {string} account_id
 * @property {string} name
 * @property {boolean} active
 * @property {string} created_at
 */

/** Default shape for a new, unsaved category — e.g. to seed a create form. */
export const emptyCategory = {
  name: "",
  active: true,
};
