import { SettingsMenu } from "@/components/settings-nav"
import { FeaturesSettings } from "@/components/settings/features-settings"

// The section's landing page, and it means two different things by screen
// size. Narrow: the menu — the first of the two pages, since a phone has
// no room for a sidebar. Wide: Features itself, because the sidebar is
// already there and an empty pane next to it would be pointless.
//
// Both are rendered and one is hidden by CSS rather than branching on a
// media query in JS, so neither flashes on load.
export default function Page() {
  return (
    <>
      <div className="sm:hidden">
        <SettingsMenu />
      </div>
      <div className="hidden sm:block">
        <FeaturesSettings />
      </div>
    </>
  );
}
