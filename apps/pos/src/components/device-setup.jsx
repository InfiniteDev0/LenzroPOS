"use client"

import { useState } from "react"
import { usePowerSync, useQuery, useStatus } from "@powersync/react"
import { MonitorSmartphoneIcon } from "lucide-react"

import { notifyError } from "@/lib/errors"
import { setDeviceId } from "@/lib/pos-session"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// Shown once, right after the owner signs in on a device that hasn't
// been bound to a pos_devices row yet. Either claim one of the account's
// not-yet-activated devices (created ahead of time from Settings > POS
// devices) or activate this device under a brand new name on the spot.
export function DeviceSetup({ onActivated }) {
  const powersync = usePowerSync()
  const status = useStatus()
  const [newName, setNewName] = useState("")
  const [busy, setBusy] = useState(false)

  const { data: pendingDevices } = useQuery(
    "SELECT * FROM pos_devices WHERE status = 'not_activated' ORDER BY created_at DESC"
  )

  async function activateExisting(device) {
    setBusy(true)
    try {
      await powersync.execute(
        "UPDATE pos_devices SET status = 'activated', activated_at = ? WHERE id = ?",
        [new Date().toISOString(), device.id]
      )
      setDeviceId(device.id)
      onActivated(device.id)
    } catch (error) {
      notifyError(error, "Couldn't activate this device")
    } finally {
      setBusy(false)
    }
  }

  async function activateNew(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setBusy(true)
    try {
      const id = crypto.randomUUID()
      await powersync.execute(
        "INSERT INTO pos_devices (id, name, status, activated_at) VALUES (?, ?, 'activated', ?)",
        [id, newName.trim(), new Date().toISOString()]
      )
      setDeviceId(id)
      onActivated(id)
    } catch (error) {
      notifyError(error, "Couldn't activate this device")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex h-svh items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40">
            <MonitorSmartphoneIcon className="size-7" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Activate this device</h1>
            <p className="text-sm text-muted-foreground">
              This only happens once. After this, staff sign in with a PIN, not a login screen.
            </p>
          </div>
        </div>

        {!status.hasSynced ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading your devices…</p>
        ) : (
          <>
            {pendingDevices?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Use one already added from the back office
                </p>
                {pendingDevices.map((device) => (
                  <Button
                    key={device.id}
                    variant="outline"
                    disabled={busy}
                    className="h-12 w-full justify-start"
                    onClick={() => activateExisting(device)}
                  >
                    {device.name}
                  </Button>
                ))}
              </div>
            )}

            <form onSubmit={activateNew} className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                {pendingDevices?.length > 0 ? "Or activate this as a new device" : "Name this device"}
              </p>
              <div className="flex gap-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Front counter"
                  disabled={busy}
                />
                <Button
                  type="submit"
                  disabled={busy || !newName.trim()}
                  className="bg-emerald-600 hover:bg-emerald-600/90"
                >
                  Activate
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
