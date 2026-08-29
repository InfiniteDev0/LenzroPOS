import { FeaturesSettings } from "@/components/settings/features-settings"

// Features needs a URL of its own for the mobile drill-down to push to.
// /admin/settings also renders it on wide screens — see that page for why.
export default function Page() {
  return <FeaturesSettings />;
}
