"use client"

import { useMemo } from "react"
import { useQuery } from "@powersync/react"

// The owner's Settings > Features toggles and Settings > Payment types,
// synced down read-only. Both used to be ignored entirely by this app —
// features didn't exist as data at all, and the payment buttons were a
// hardcoded cash/card/mobile array that contradicted whatever the owner
// had actually configured.

// Must match DEFAULT_SETTINGS in apps/admin/src/lib/account-settings.js
// and the column defaults in migration 0013. Used until the settings row
// syncs down, so the till is never dead in the water waiting on it.
export const DEFAULT_SETTINGS = {
  shifts_enabled: true,
  open_tickets_enabled: false,
  low_stock_alerts_enabled: true,
  negative_stock_alerts_enabled: true,
}

// What prints on a receipt. Separate from the toggles above because these
// are text, not booleans, and are passed straight through to the printer.
export const DEFAULT_RECEIPT = {
  receipt_header: "",
  receipt_footer: "",
  receipt_show_customer: false,
  receipt_logo_url: null,
}

export function useAccountSettings() {
  const { data, isLoading } = useQuery("SELECT * FROM account_settings LIMIT 1")

  const row = data?.[0]

  const settings = useMemo(() => {
    if (!row) return DEFAULT_SETTINGS;
    // SQLite has no boolean type — PowerSync stores these as 0/1.
    return Object.keys(DEFAULT_SETTINGS).reduce(
      (acc, key) => ({
        ...acc,
        [key]: row[key] == null ? DEFAULT_SETTINGS[key] : Boolean(row[key]),
      }),
      {}
    );
  }, [row])

  const receipt = useMemo(() => {
    if (!row) return DEFAULT_RECEIPT;
    return {
      receipt_header: row.receipt_header ?? "",
      receipt_footer: row.receipt_footer ?? "",
      receipt_show_customer: Boolean(row.receipt_show_customer),
      receipt_logo_url: row.receipt_logo_url ?? null,
    };
  }, [row])

  return { settings, receipt, isLoading };
}

export function usePaymentTypes() {
  const { data, isLoading } = useQuery(
    "SELECT * FROM payment_types WHERE active = 1 ORDER BY sort_order, name"
  )
  return { paymentTypes: data ?? [], isLoading };
}
