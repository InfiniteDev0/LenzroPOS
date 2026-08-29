"use client"

import { useEffect, useMemo, useRef } from "react"
import { PowerSyncContext } from "@powersync/react"
import { PowerSyncDatabase } from "@powersync/web"

import { createClient } from "@lenzro/supabase/client"
import { AppSchema } from "./AppSchema"
import { BackendConnector } from "./BackendConnector"

let dbInstance = null

function getDB() {
  if (dbInstance) return dbInstance

  dbInstance = new PowerSyncDatabase({
    database: { dbFilename: "lenzro-pos.db", worker: "/@powersync/worker.js" },
    schema: AppSchema,
    sync: { worker: "/@powersync/worker.js" },
    // Next.js statically pre-renders this page at build time, where
    // there's no browser/IndexedDB — PowerSync correctly no-ops and
    // returns empty results in that environment. This just quiets the
    // warning about it; real data loads normally once it hydrates.
    flags: { disableSSRWarning: true },
  })

  return dbInstance
}

export function PowerSyncProvider({ children }) {
  const db = useMemo(() => getDB(), [])
  const connectedRef = useRef(false)

  // Connect only once someone is actually signed in. This provider wraps
  // every route including /auth, and connecting there asks for
  // credentials that don't exist yet — which PowerSync reports as a sync
  // error ("Not signed in") rather than treating as a normal state.
  //
  // Following auth state also means the till starts syncing the moment
  // login completes, and stops syncing on sign-out rather than holding a
  // connection open with a token it shouldn't still be using.
  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    async function syncWithAuthState() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (cancelled) return

      if (session && !connectedRef.current) {
        connectedRef.current = true
        db.connect(new BackendConnector())
      } else if (!session && connectedRef.current) {
        connectedRef.current = false
        await db.disconnect()
      }
    }

    syncWithAuthState()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      syncWithAuthState()
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [db])

  return <PowerSyncContext.Provider value={db}>{children}</PowerSyncContext.Provider>
}
