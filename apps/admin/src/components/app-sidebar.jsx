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
      title: "Employees",
      url: "#",
      icon: (
        <UsersIcon />
      ),
      items: [
        {
          title: "Employee list",
          url: "/admin/employees",}
      ],
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
        {/* When the sidebar collapses to icons the wordmark has to go with
            it, or it wraps into a column of single words down the rail. */}
        <div className="flex items-center gap-2 overflow-hidden rounded-md bg-foreground p-2 text-white group-data-[collapsible=icon]:p-1 dark:bg-background">
          <img src="/logo.png" className="size-10 shrink-0 rounded-xl group-data-[collapsible=icon]:size-8" alt="" />
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
