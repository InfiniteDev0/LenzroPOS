// Stopgap shared store for Settings > Receipt config, so the settings page
// and printReceipts() actually read/write the same data instead of each
// holding their own disconnected local state. localStorage rather than a
// backend — real persistence lands in ROADMAP.md Phase 9, at which point
// these two functions get swapped for Supabase calls without the callers
// needing to change.

const STORAGE_KEY = "lenzro:receipt-settings";

export const defaultReceiptSettings = {
  header: "Lenzro POS\n123 Main Street\nNairobi, Kenya",
  footer: "Thank you for your business!",
  showCustomerInfo: false,
  language: "English",
  printedLogo: null,
};

export function loadReceiptSettings() {
  if (typeof window === "undefined") return defaultReceiptSettings;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultReceiptSettings, ...JSON.parse(raw) } : defaultReceiptSettings;
  } catch {
    return defaultReceiptSettings;
  }
}

export function saveReceiptSettings(settings) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage full/unavailable — settings just won't persist this time.
  }
}
