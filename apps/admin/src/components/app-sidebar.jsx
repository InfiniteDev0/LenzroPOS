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
        <div
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <img className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">Lenzro POS</span>
            <span className="truncate text-xs">Point of sale</span>
          </div>
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
