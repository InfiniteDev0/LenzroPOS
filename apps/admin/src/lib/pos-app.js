// Where the POS app is deployed. It's a separate deployment from the
// back office, so this address isn't derivable — the default is the
// current production till, and NEXT_PUBLIC_POS_URL overrides it for a
// preview build or a custom domain.
//
// Shared by the landing page and Settings > POS devices, which are the
// two places someone goes looking for the till.
export const POS_URL = process.env.NEXT_PUBLIC_POS_URL ?? "https://lenzro-pos-system.vercel.app"
