"use client"

import { useMemo } from "react"
import { PowerSyncContext } from "@powersync/react"
import { PowerSyncDatabase } from "@powersync/web"

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
  dbInstance.connect(new BackendConnector())

  return dbInstance
}

export function PowerSyncProvider({ children }) {
  const db = useMemo(() => getDB(), [])

  return <PowerSyncContext.Provider value={db}>{children}</PowerSyncContext.Provider>
}
