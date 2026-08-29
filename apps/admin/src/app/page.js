import { createClient } from "@lenzro/supabase/server";
import { LandingPage } from "@/components/landing/landing-page";

// The public front door. Signed-in owners get a "back office" CTA instead
// of "sign in", so the one link they'd want is the one they see — the app
// itself stays behind /admin either way (the proxy only guards /admin and
// /dashboard, so this route is reachable signed out).
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <LandingPage signedIn={Boolean(user)} />;
}

export const metadata = {
  title: "Lenzro POS — the till that keeps selling when the internet stops",
  description:
    "A point of sale built for Kenyan restaurants and shops. Take orders offline, run shifts and cash drawers, keep customer tabs, and see your sales from anywhere.",
};
