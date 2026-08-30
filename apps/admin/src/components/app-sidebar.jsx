"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { GalleryVerticalEndIcon, AudioLinesIcon, TerminalIcon, BarChart3Icon, PackageIcon, WarehouseIcon, UsersIcon, ContactIcon, Settings2Icon, FrameIcon, PieChartIcon, MapIcon } from "lucide-react"

// Nav structure only — the signed-in user is loaded for real by NavUser
// itself, which is why there's no `user` here any more.
const data = {
  teams: [
    {
      name: "Acme Inc",
      logo: (
        <GalleryVerticalEndIcon />
      ),
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: (
        <AudioLinesIcon />
      ),
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: (
        <TerminalIcon />
      ),
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Reports",
      url: "#",
      icon: (
        <BarChart3Icon />
      ),
      items: [
        {
          title: "All sales",
          url: "/admin",
        },
        {
          title: "Receipts",
          url: "/admin/receipts",
        },
        {
          title: "Expenses",
          url: "/admin/expenses",
        },
        {
          title: "Shifts",
          url: "/admin/shifts",
        },
        {
          title: "End of day",
          url: "/admin/end-of-day",
        },
      ],
    },
    {
      title: "Item",
      url: "#",
      icon: (
        <PackageIcon />
      ),
      items: [
        {
          title: "All items",
          url: "/admin/items",
        },
        {
          title: "All categories",
          url: "/admin/items/categories",
        },
      ],
    },
    {
      title: "Inventory",
      url: "/admin/inventory",
      icon: (
        <WarehouseIcon />
      ),
    },
    {
      // A single destination — no submenu, since "Employees > Employee
      // list" was one collapsible wrapping one link.
      title: "Employees",
      url: "/admin/employees",
      icon: (
        <UsersIcon />
      ),
    },
    {
      title: "Open Tabs",
      url: "/admin/customers",
      icon: (
        <ContactIcon />
      ),
    },
    {
      title: "Settings",
      url: "/admin/settings",
      icon: (
        <Settings2Icon />
      ),
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: (
        <FrameIcon />
      ),
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: (
        <PieChartIcon />
      ),
    },
    {
      name: "Travel",
      url: "#",
      icon: (
        <MapIcon />
      ),
    },
  ],
}

export function AppSidebar({
  ...props
}) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {/* Collapsed, this has to read as one more icon in the rail: the
            wordmark hides, and the dark plaque and padding go with it so
            the logo lines up with the nav icons below instead of sitting
            in an oversized box of its own. */}
        <div className="flex items-center gap-2 overflow-hidden rounded-md bg-foreground p-2 text-white group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0 dark:bg-background dark:group-data-[collapsible=icon]:bg-transparent">
          <img
            src="/logo.png"
            className="size-10 shrink-0 rounded-xl group-data-[collapsible=icon]:size-8"
            alt="" />
          <p className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate">Lenzro POS</span>
            <span className="truncate text-xs text-zinc-400">point of sale</span>
          </p>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
