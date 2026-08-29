"use client"

import { useEffect, useState } from "react"
import { ClockIcon, PackageIcon, ShoppingBagIcon, TicketIcon } from "lucide-react"
import { toast } from "sonner"

import { createClient } from "@lenzro/supabase/client"
import { notifyError } from "@/lib/errors"
import { DEFAULT_SETTINGS, fetchAccountSettings, saveAccountSettings } from "@/lib/account-settings"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"

// Every toggle here changes what the till actually does — the effect is
// spelled out under each one so it's obvious what turning it off costs.
// Two toggles that used to sit on this screen (Time clock, Low stock
// email notifications) were removed rather than left as decoration; see
// IMPROVISING_LOG.md.
const FEATURES = [
  {
    key: "shifts_enabled",
    icon: ClockIcon,
    title: "Shifts",
    description: "Track cash in and out of the drawer.",
    effect:
      "On: cashiers open a shift with their PIN, count the drawer at close, and you get an end-of-day report. Off: the till sells straight away with no drawer tracking.",
  },
  {
    key: "open_tickets_enabled",
    icon: TicketIcon,
    title: "Open tickets",
    description: "Let cashiers park an order and come back to it.",
    effect:
      "On: a Park button saves the current order under a name (a table or customer) so the till is free for the next person. Off: one order at a time.",
  },
  {
    key: "low_stock_alerts_enabled",
    icon: PackageIcon,
    title: "Low stock badges",
    description: "Flag items running low on the till.",
    effect:
      "On: items at or below their low-stock threshold show a badge on the POS, and the category card warns that something needs restocking.",
  },
  {
    key: "negative_stock_alerts_enabled",
    icon: ShoppingBagIcon,
    title: "Negative stock alerts",
    description: "Warn cashiers selling more than you have in stock.",
    effect:
      "On: adding a tracked item that's already at zero asks the cashier to confirm. It never blocks the sale — the queue keeps moving.",
  },
]

export function FeaturesSettings() {
  const [supabase] = useState(() => createClient())
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [saved, setSaved] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    fetchAccountSettings(supabase)
      .then((data) => {
        if (!active) return
        setSettings(data)
        setSaved(data)
      })
      .catch((error) => notifyError(error, "Couldn't load your feature settings"))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [supabase])

  const dirty = FEATURES.some((f) => settings[f.key] !== saved[f.key])

  function toggle(key, value) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await saveAccountSettings(supabase, settings)
      setSaved(settings)
      toast.success("Feature settings saved", {
        description: "Tills pick this up as soon as they sync.",
      })
    } catch (error) {
      notifyError(error, "Couldn't save your feature settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="gap-0 py-0">
      <div className="border-b p-4">
        <h2 className="text-lg font-medium">Features</h2>
        <p className="text-sm text-muted-foreground">
          Turn parts of the till on or off. Changes reach every POS device on this account.
        </p>
      </div>
      <CardContent className="divide-y p-0">
        {loading
          ? FEATURES.map((feature) => (
              <div key={feature.key} className="flex items-center gap-4 p-4">
                <Skeleton className="size-9 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
                <Skeleton className="h-5 w-9 rounded-full" />
              </div>
            ))
          : FEATURES.map((feature) => (
              <div key={feature.key} className="flex items-start gap-4 p-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <feature.icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{feature.title}</p>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{feature.effect}</p>
                </div>
                <Switch
                  checked={Boolean(settings[feature.key])}
                  onCheckedChange={(value) => toggle(feature.key, value)} />
              </div>
            ))}
      </CardContent>
      <div className="flex justify-end gap-2 border-t bg-muted/50 p-4">
        <Button variant="outline" disabled={!dirty || saving} onClick={() => setSettings(saved)}>
          Cancel
        </Button>
        <Button
          className="bg-emerald-600 hover:bg-emerald-600/90"
          disabled={!dirty || saving}
          onClick={handleSave}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </Card>
  );
}
