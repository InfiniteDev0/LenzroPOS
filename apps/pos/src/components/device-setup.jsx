"use client"

import { useEffect, useRef, useState } from "react"
import { MonitorSmartphoneIcon, TriangleAlertIcon } from "lucide-react"

import { createClient } from "@lenzro/supabase/client"
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
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true

    let active = true

    // Deliberately talks to Supabase directly rather than going through
    // PowerSync's local database and upload queue.
    //
    // Activation is inherently an online, one-time act — the owner has
    // just signed in — so it gains nothing from being offline-capable,
    // and routing it through the queue was actively harmful. The local
    // table is only as good as what has synced down; when it hadn't, the
    // till concluded there was no device and queued a second one, which
    // the one-per-account index rejects with a 409 forever. Worse, the
    // rejected row then gets reconciled away by the next sync, so the
    // till decides there's no device again and queues another — an
    // endless create/reject/erase loop.
    //
    // Asking the server is authoritative and settles it in one round trip.
    async function activate() {
      const supabase = createClient()

      const { data: existing, error: selectError } = await supabase
        .from("pos_devices")
        .select("id, status")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle()
      if (selectError) throw selectError;

      if (existing) {
        if (existing.status !== "activated") {
          const { error: updateError } = await supabase
            .from("pos_devices")
            .update({ status: "activated", activated_at: new Date().toISOString() })
            .eq("id", existing.id)
          if (updateError) throw updateError;
        }
        setDeviceId(existing.id)
        return
      }

      const { data: created, error: insertError } = await supabase
        .from("pos_devices")
        .insert({
          name: DEFAULT_DEVICE_NAME,
          status: "activated",
          activated_at: new Date().toISOString(),
        })
        .select("id")
        .single()

      // Another machine claimed the account's one device in between —
      // fetch and use that one instead of failing.
      if (insertError?.code === "23505") {
        const { data: raced } = await supabase.from("pos_devices").select("id").limit(1).maybeSingle()
        if (raced) {
          setDeviceId(raced.id)
          return
        }
      }
      if (insertError) throw insertError;

      setDeviceId(created.id)
    }

    activate().catch((err) => {
      if (!active) return
      startedRef.current = false
      setError(err)
    })

    return () => {
      active = false
    };
  }, [attempt])

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
                Linking this machine to your account…
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
