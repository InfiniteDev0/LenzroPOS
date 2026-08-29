// The Settings > Features toggles, read and written against
// `account_settings` (one row per account, created by migration 0013).
//
// These defaults have to match the column defaults in that migration:
// they're what a brand-new account gets, and what the app falls back to
// if the row somehow isn't there yet.

export const DEFAULT_SETTINGS = {
  shifts_enabled: true,
  open_tickets_enabled: false,
  low_stock_alerts_enabled: true,
  negative_stock_alerts_enabled: true,
}

const KEYS = Object.keys(DEFAULT_SETTINGS)

function normalize(row) {
  if (!row) return { ...DEFAULT_SETTINGS };
  return KEYS.reduce(
    (acc, key) => ({ ...acc, [key]: row[key] ?? DEFAULT_SETTINGS[key] }),
    {}
  );
}

export async function fetchAccountSettings(supabase) {
  const { data, error } = await supabase.from("account_settings").select("*").maybeSingle()
  if (error) throw error;
  return normalize(data);
}

// Upsert rather than update: an account created before migration 0013 ran
// gets its row backfilled by that migration, but an account created by a
// path that skips it would otherwise have nothing to update.
export async function saveAccountSettings(supabase, settings) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not signed in");

  const payload = KEYS.reduce(
    (acc, key) => ({ ...acc, [key]: Boolean(settings[key]) }),
    { account_id: user.id, updated_at: new Date().toISOString() }
  )

  const { error } = await supabase
    .from("account_settings")
    .upsert(payload, { onConflict: "account_id" })
  if (error) throw error;
}
