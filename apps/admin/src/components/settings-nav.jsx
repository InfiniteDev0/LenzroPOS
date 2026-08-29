"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRightIcon, SettingsIcon, StoreIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

export const SETTINGS_LINKS = [
  { href: "/admin/settings/features", label: "Features" },
  { href: "/admin/settings/billing", label: "Billing & subscriptions" },
  { href: "/admin/settings/payment-types", label: "Payment types" },
  { href: "/admin/settings/discounts", label: "Discounts" },
  { href: "/admin/settings/receipt", label: "Receipt" },
]

export const STORE_LINKS = [
  { href: "/admin/settings/stores", label: "Stores" },
  { href: "/admin/settings/pos-devices", label: "POS devices" },
]

export const ALL_SETTINGS_LINKS = [...SETTINGS_LINKS, ...STORE_LINKS]

// /admin/settings still renders Features on desktop (it's the section's
// landing page), so both URLs have to highlight the same nav row.
export function isActiveSettingsLink(pathname, href) {
  if (href === "/admin/settings/features") {
    return pathname === "/admin/settings/features" || pathname === "/admin/settings";
  }
  return pathname === href;
}

export function settingsLabelFor(pathname) {
  return ALL_SETTINGS_LINKS.find((link) => isActiveSettingsLink(pathname, link.href))?.label ?? "Settings";
}

function GroupHeading({ icon, iconBg, title, description }) {
  return (
    <div className="flex items-center gap-3 px-2 pb-2">
      <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-full text-white", iconBg)}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function NavGroup({ icon, iconBg, title, description, links, pathname }) {
  return (
    <div>
      <GroupHeading icon={icon} iconBg={iconBg} title={title} description={description} />
      <nav className="flex flex-col gap-0.5">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm",
              isActiveSettingsLink(pathname, link.href)
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:bg-muted/50"
            )}>
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

// The persistent sidebar, desktop only. On a phone there isn't room for
// a sidebar and a settings page at once, so small screens get the
// two-level menu below instead.
export function SettingsNav() {
  const pathname = usePathname()

  return (
    <Card className="hidden w-64 shrink-0 gap-6  p-4 sm:flex">
      <NavGroup
        icon={<SettingsIcon className="size-4" />}
        iconBg="bg-muted-foreground"
        title="Settings"
        description="System settings"
        links={SETTINGS_LINKS}
        pathname={pathname} />
      <NavGroup
        icon={<StoreIcon className="size-4" />}
        iconBg="bg-indigo-500"
        title="Stores"
        description="Store & POS settings"
        links={STORE_LINKS}
        pathname={pathname} />
    </Card>
  );
}

function MenuGroup({ icon, iconBg, title, description, links }) {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="border-b p-4">
        <GroupHeading icon={icon} iconBg={iconBg} title={title} description={description} />
      </div>
      <div className="divide-y">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex min-h-14 items-center justify-between gap-3 px-4 py-3 active:bg-muted">
            <span className="min-w-0 truncate text-base">{link.label}</span>
            <ChevronRightIcon className="size-5 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </Card>
  );
}

// The first of the two mobile pages: a list of destinations. Tapping one
// pushes its page in from the right, with a back arrow to come home.
export function SettingsMenu() {
  return (
    <div className="flex flex-col gap-4">
      <MenuGroup
        icon={<SettingsIcon className="size-4" />}
        iconBg="bg-muted-foreground"
        title="Settings"
        description="System settings"
        links={SETTINGS_LINKS} />
      <MenuGroup
        icon={<StoreIcon className="size-4" />}
        iconBg="bg-indigo-500"
        title="Stores"
        description="Store & POS settings"
        links={STORE_LINKS} />
    </div>
  );
}
