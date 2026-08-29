"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { createClient } from "@lenzro/supabase/client"
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronsUpDownIcon, BadgeCheckIcon, LogOutIcon } from "lucide-react"

function initialsFor(name, email) {
  const source = (name || email || "").trim()
  if (!source) return "?";
  const parts = source.split(/[\s@.]+/).filter(Boolean)
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

// The real signed-in owner, not the shadcn placeholder this shipped with.
// Name comes from `profiles.full_name` (set by the signup trigger); the
// email only exists on the auth user, so both are needed.
export function NavUser() {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function load() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()
      if (!active || !authUser) {
        if (active) setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", authUser.id)
        .maybeSingle()

      if (!active) return
      setUser({
        name: profile?.full_name?.trim() || authUser.email?.split("@")[0] || "Owner",
        email: authUser.email ?? "",
      })
      setLoading(false)
    }

    load()
    return () => {
      active = false
    };
  }, [supabase])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/auth")
    router.refresh()
  }

  if (loading || !user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex items-center gap-2 p-2">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <div className="grid flex-1 gap-1.5 group-data-[collapsible=icon]:hidden">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  const initials = initialsFor(user.name, user.email)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton size="lg" className="bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer hover:text-white" />
            }>
            <Avatar>
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs">{user.email}</span>
            </div>
            <ChevronsUpDownIcon className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-fit"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar>
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {/* Upgrade/Billing/Notifications removed — billing doesn't
                exist (Phase 10) and notifications aren't built yet. A
                menu item that does nothing is worse than no menu item. */}
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push("/admin/employees")}>
                <BadgeCheckIcon />
                Account
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOutIcon />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
