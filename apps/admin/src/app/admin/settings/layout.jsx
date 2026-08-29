import { AdminPageHeader } from "@/components/admin-page-header"
import { SettingsNav } from "@/components/settings-nav"
import { SettingsShell } from "@/components/settings/settings-shell"

export default function SettingsLayout({ children }) {
  return (
    <>
      <AdminPageHeader crumbs={[{ label: "Settings" }]} />
      <div className="flex flex-1 gap-4 p-4 pt-0">
        <SettingsNav />
        <div className="min-w-0 flex-1">
          <SettingsShell>{children}</SettingsShell>
        </div>
      </div>
    </>
  );
}
