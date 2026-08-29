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

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
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
        <div className="flex items-center bg-foreground dark:bg-background text-white
         p-2 rounded-md gap-2">
          <img src="/logo.png" className="size-10 rounded-xl" alt="" />
          <p className="flex flex-col">
            Lenzro POS
            <span className="text-xs text-zinc-400">point of sale</span>
          </p>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
