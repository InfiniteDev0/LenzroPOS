"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronLeftIcon } from "lucide-react"

import { settingsLabelFor } from "@/components/settings-nav"

// Settings behaves as two different things depending on the screen.
//
// Wide: a persistent sidebar next to the current page, so everything is
// one click away and nothing needs a back button.
//
// Narrow: a phone-style drill-down. /admin/settings is a menu, and each
// sub-page slides in over it with a back arrow — because a 64px-wide
// sidebar and a settings form can't share a phone screen, and the old
// `hidden sm:flex` sidebar meant small screens landed on Features with
// no way to reach anything else at all.
export function SettingsShell({ children }) {
  const pathname = usePathname()
  const isIndex = pathname === "/admin/settings"

  if (isIndex) return children;

  return (
    <>
      <Link
        href="/admin/settings"
        className="mb-3 -ml-2 flex items-center gap-1 rounded-md px-2 py-2 text-sm text-muted-foreground active:bg-muted sm:hidden">
        <ChevronLeftIcon className="size-5" />
        Settings
      </Link>
      <h1 className="mb-3 text-xl font-semibold sm:hidden">{settingsLabelFor(pathname)}</h1>
      {/* Keyed on the path so the slide replays on each navigation rather
          than only on first mount. Desktop keeps the sidebar, where a
          slide would be noise, so the animation stops at `sm`. */}
      <div
        key={pathname}
        className="animate-in slide-in-from-right-6 duration-300 sm:animate-none">
        {children}
      </div>
    </>
  );
}
