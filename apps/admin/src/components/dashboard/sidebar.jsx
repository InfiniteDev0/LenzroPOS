"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ClipboardList,
  Table2,
  ChefHat,
  Wallet,
  Settings,
  HelpCircle,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { LogoutButton } from "@/components/logout-button"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/order-line", label: "Order Line", icon: ClipboardList },
  { href: "/dashboard/manage-table", label: "Manage Table", icon: Table2 },
  { href: "/dashboard/manage-dishes", label: "Manage Dishes", icon: ChefHat },
  { href: "/dashboard/finance", label: "Finance", icon: Wallet },
]

const bottomNavItems = [
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/help-center", label: "Help Center", icon: HelpCircle },
]

function NavLink({ href, label, icon: Icon, active }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="size-4.5" />
      {label}
    </Link>
  )
}

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-64 shrink-0 flex-col overflow-y-auto border-r border-border bg-background p-4 md:flex">
      <div className="flex items-center gap-2 px-2 py-2">
        <div className="flex size-9 items-center justify-center rounded-xl bg-teal-600 text-white">
          <img src="/logo.png" className="rounded-md" alt="" />
        </div>
        <div className="leading-tight">
          <h1 className="text-base font-semibold">Lenzro</h1>
          <p className="text-xs text-muted-foreground">POS</p>
        </div>
      </div>

      <nav className="mt-6 flex flex-1 flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            {...item}
            active={
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href)
            }
          />
        ))}
      </nav>

      <div className="flex flex-col gap-1 border-t border-border pt-3">
        {bottomNavItems.map((item) => (
          <NavLink key={item.href} {...item} active={pathname.startsWith(item.href)} />
        ))}
        <LogoutButton className="h-auto w-full gap-3 rounded-lg px-3 py-2 text-sm font-medium" />
      </div>
    </aside>
  )
}
