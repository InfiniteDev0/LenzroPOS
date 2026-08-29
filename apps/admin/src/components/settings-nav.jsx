"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { SettingsIcon, StoreIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

const SETTINGS_LINKS = [
  { href: "/admin/settings", label: "Features" },
  { href: "/admin/settings/billing", label: "Billing & subscriptions" },
  { href: "/admin/settings/payment-types", label: "Payment types" },
  { href: "/admin/settings/discounts", label: "Discounts" },
  { href: "/admin/settings/receipt", label: "Receipt" },
]

const STORE_LINKS = [
  { href: "/admin/settings/stores", label: "Stores" },
  { href: "/admin/settings/pos-devices", label: "POS devices" },
]

function NavGroup({ icon, iconBg, title, description, links, pathname }) {
  return (
    <div>
      <div className="flex items-center gap-3 px-2 pb-2">
        <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-full text-white", iconBg)}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <nav className="flex flex-col gap-0.5">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm",
              pathname === link.href
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
