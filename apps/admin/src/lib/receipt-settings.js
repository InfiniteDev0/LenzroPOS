// Settings > Receipt config, stored on the account_settings row (added by
// migration 0015) so the POS prints what the owner actually configured.
//
// This used to be localStorage in the admin browser only, which meant the
// till printed a hardcoded "Lenzro POS" header on every receipt no matter
// what was typed here, and the settings vanished if the owner opened the
// back office on a different machine.

export const defaultReceiptSettings = {
  receipt_header: "",
  receipt_footer: "Thank you for your business!",
  receipt_show_customer: false,
  receipt_logo_url: null,
}

const KEYS = Object.keys(defaultReceiptSettings)

export function normalizeReceiptSettings(row) {
  if (!row) return { ...defaultReceiptSettings };
  return KEYS.reduce(
    (acc, key) => ({ ...acc, [key]: row[key] ?? defaultReceiptSettings[key] }),
    {}
  );
}

export async function fetchReceiptSettings(supabase) {
  const { data, error } = await supabase
    .from("account_settings")
    .select("receipt_header, receipt_footer, receipt_show_customer, receipt_logo_url")
    .maybeSingle()
  if (error) throw error;
  return normalizeReceiptSettings(data);
}

export async function saveReceiptSettings(supabase, settings) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not signed in");

  const payload = KEYS.reduce((acc, key) => ({ ...acc, [key]: settings[key] ?? null }), {
    account_id: user.id,
    updated_at: new Date().toISOString(),
  })
  // `receipt_show_customer` is `not null` in Postgres, so it can't ride
  // the ?? null above.
  payload.receipt_show_customer = Boolean(settings.receipt_show_customer)

  const { error } = await supabase
    .from("account_settings")
    .upsert(payload, { onConflict: "account_id" })
  if (error) throw error;
}

// Same bucket and same per-account folder scoping as item photos, and the
// same no-upsert reasoning (see upload-item-image.js).
export async function uploadReceiptLogo(supabase, file) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { url: null, error: new Error("Not signed in") };

  const ext = file.name.split(".").pop()
  const path = `${user.id}/receipt-logo-${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage.from("PosImages").upload(path, file)
  if (uploadError) return { url: null, error: uploadError };

  const { data } = supabase.storage.from("PosImages").getPublicUrl(path)
  return { url: data.publicUrl, error: null };
}
