"use client"

import { useEffect, useRef, useState } from "react"
import { usePowerSync, useStatus } from "@powersync/react"
import { MonitorSmartphoneIcon, TriangleAlertIcon } from "lucide-react"

import { setDeviceId } from "@/lib/pos-session"
import { Button } from "@/components/ui/button"

// Binds this browser install to the account's POS device. It asks the
// person nothing.
//
// An account has exactly one till (migration 0014 enforces it in the
// database), so "which device is this?" has no meaningful answer to give
// — and the owner has usually already named it in Settings > POS devices.
// Asking them to name it again here was just a second name for the same
// thing. Naming and renaming live in the back office; this screen only
// links the machine.
//
// If a device row exists it's claimed. If none does — the owner went
// straight to the till without touching the back office — one is created
// with a placeholder name they can change later.
const DEFAULT_DEVICE_NAME = "Front counter"

export function DeviceSetup() {
  const powersync = usePowerSync()
  const status = useStatus()
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)
  const startedRef = useRef(false)

  useEffect(() => {
    // Waiting for the initial sync is not optional: acting on an empty
    // pos_devices table before it has arrived would create a second
    // device, which the unique index then rejects on upload — leaving a
    // write stuck retrying forever against a constraint it can't satisfy.
    if (!status.hasSynced || startedRef.current) return;
    startedRef.current = true

    let active = true

    async function activate() {
      const existing = await powersync.getOptional(
        "SELECT * FROM pos_devices ORDER BY created_at LIMIT 1"
      )

      if (existing) {
        if (existing.status !== "activated") {
          await powersync.execute(
            "UPDATE pos_devices SET status = 'activated', activated_at = ? WHERE id = ?",
            [new Date().toISOString(), existing.id]
          )
        }
        setDeviceId(existing.id)
        return
      }

      const id = crypto.randomUUID()
      await powersync.execute(
        "INSERT INTO pos_devices (id, name, status, activated_at) VALUES (?, ?, 'activated', ?)",
        [id, DEFAULT_DEVICE_NAME, new Date().toISOString()]
      )
      setDeviceId(id)
    }

    activate().catch((err) => {
      if (!active) return
      startedRef.current = false
      setError(err)
    })

    return () => {
      active = false
    };
  }, [status.hasSynced, powersync, attempt])

  return (
    <div className="flex h-svh items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <div
            className={`flex size-14 items-center justify-center rounded-full ${
              error
                ? "bg-destructive/10 text-destructive"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40"
            }`}
          >
            {error ? (
              <TriangleAlertIcon className="size-7" />
            ) : (
              <MonitorSmartphoneIcon className="size-7" />
            )}
          </div>

          {error ? (
            <div className="space-y-2">
              <h1 className="text-xl font-semibold">Couldn&apos;t set up this till</h1>
              <p className="text-base text-muted-foreground">
                Check the connection and try again. Nothing has been lost.
              </p>
              {/* The actual reason, not just a friendly summary. This
                  screen is hit during setup, often by whoever is standing
                  at the counter — "it says try again" is not something
                  anyone can act on or report usefully. */}
              {error.message && (
                <p className="rounded-lg bg-muted p-3 text-left font-mono text-xs wrap-break-word text-muted-foreground">
                  {error.message}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <h1 className="text-xl font-semibold">Setting up this till</h1>
              <p className="text-base text-muted-foreground">
                {status.hasSynced
                  ? "Linking this machine to your account…"
                  : "Getting your menu and staff…"}
              </p>
            </div>
          )}
        </div>

        {error ? (
          <Button
            className="h-12 w-full bg-emerald-600 text-base hover:bg-emerald-600/90"
            onClick={() => {
              setError(null)
              setAttempt((n) => n + 1)
            }}
          >
            Try again
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            This happens once. After this, staff sign in with a PIN.
          </p>
        )}
      </div>
    </div>
  );
}
