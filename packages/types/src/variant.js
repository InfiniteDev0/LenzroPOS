/**
 * A variant option on an item (e.g. "Size"), as returned by Supabase
 * (`public.item_variants`).
 *
 * @typedef {Object} ItemVariant
 * @property {string} id
 * @property {string} item_id
 * @property {string} option_name
 * @property {string} created_at
 */

/**
 * A value under a variant option (e.g. "Small"), as returned by Supabase
 * (`public.item_variant_values`).
 *
 * @typedef {Object} ItemVariantValue
 * @property {string} id
 * @property {string} variant_id
 * @property {string} value
 * @property {number | null} price_override
 * @property {string} created_at
 */

export {};
