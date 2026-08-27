"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { ChevronRightIcon } from "lucide-react"

function NavMainCollapsibleItem({ item, pathname }) {
  const isActive = item.items.some((subItem) => subItem.url === pathname)
  const [open, setOpen] = useState(isActive)
  const [prevIsActive, setPrevIsActive] = useState(isActive)

  if (isActive !== prevIsActive) {
    setPrevIsActive(isActive)
    if (isActive) setOpen(true)
  }

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="group/collapsible"
      render={<SidebarMenuItem />}>
      <CollapsibleTrigger
        render={
          <SidebarMenuButton
            tooltip={item.title}
            className={cn(isActive && "bg-emerald-200 dark:bg-emerald-500")} />
        }>
        {item.icon}
        <span>{item.title}</span>
        <ChevronRightIcon
          className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenuSub>
          {item.items.map((subItem) => (
            <SidebarMenuSubItem key={subItem.title}>
              <SidebarMenuSubButton
                className={cn(subItem.url === pathname && "bg-zinc-200 dark:bg-zinc-700")}
                render={<Link href={subItem.url} />}>
                <span>{subItem.title}</span>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function NavMain({
  items
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          if (item.items?.length) {
            return <NavMainCollapsibleItem key={item.title} item={item} pathname={pathname} />
          }

          const isActive = item.url === pathname
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                className={cn(isActive && "bg-emerald-200 dark:bg-emerald-500")}
                render={<Link href={item.url} />}>
                {item.icon}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
