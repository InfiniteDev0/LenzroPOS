"use client"

import { useEffect, useState } from "react"
import { ImageIcon, Loader2Icon } from "lucide-react"
import { toast } from "sonner"

import { createClient } from "@lenzro/supabase/client"
import { notifyError } from "@/lib/errors"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  defaultReceiptSettings,
  fetchReceiptSettings,
  saveReceiptSettings,
  uploadReceiptLogo,
} from "@/lib/receipt-settings"

const MAX_LENGTH = 500

function LogoUpload({ value, onChange, disabled }) {
  const [uploading, setUploading] = useState(false)
  const [supabase] = useState(() => createClient())

  async function handleChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const { url, error } = await uploadReceiptLogo(supabase, file)
    setUploading(false)
    if (error) {
      notifyError(error, "Couldn't upload the logo")
      return
    }
    onChange(url)
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-muted-foreground">Printed receipt logo</span>
      <div className="flex items-center gap-3">
        <label className="relative flex size-24 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed bg-muted/50 hover:bg-muted">
          {uploading ? (
            <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
          ) : value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Receipt logo" className="size-full object-contain p-1" />
          ) : (
            <ImageIcon className="size-6 text-muted-foreground" />
          )}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={disabled || uploading}
            onChange={handleChange} />
        </label>
        {value && (
          <Button variant="outline" size="sm" onClick={() => onChange(null)}>
            Remove
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Prints at the top of every receipt. Keep it small and high-contrast — receipts print in
        black and white.
      </p>
    </div>
  );
}

export default function Page() {
  const [supabase] = useState(() => createClient())
  const [settings, setSettings] = useState(defaultReceiptSettings)
  const [saved, setSaved] = useState(defaultReceiptSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    fetchReceiptSettings(supabase)
      .then((data) => {
        if (!active) return
        setSettings(data)
        setSaved(data)
      })
      .catch((error) => notifyError(error, "Couldn't load your receipt settings"))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    };
  }, [supabase])

  function update(patch) {
    setSettings((prev) => ({ ...prev, ...patch }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await saveReceiptSettings(supabase, settings)
      setSaved(settings)
      toast.success("Receipt settings saved", {
        description: "Tills pick this up as soon as they sync.",
      })
    } catch (error) {
      notifyError(error, "Couldn't save your receipt settings")
    } finally {
      setSaving(false)
    }
  }

  const dirty = JSON.stringify(settings) !== JSON.stringify(saved)

  if (loading) {
    return (
      <Card className="gap-0 py-0">
        <div className="border-b p-4">
          <h2 className="text-lg font-medium">Receipt settings</h2>
        </div>
        <CardContent className="flex flex-col gap-6 p-4">
          <Skeleton className="size-24 rounded-md" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gap-0 py-0">
      <div className="border-b p-4">
        <h2 className="text-lg font-medium">Receipt settings</h2>
        <p className="text-sm text-muted-foreground">
          What prints on every receipt the till hands a customer.
        </p>
      </div>
      <CardContent className="flex flex-col gap-6 p-4">
        <LogoUpload
          value={settings.receipt_logo_url}
          onChange={(receipt_logo_url) => update({ receipt_logo_url })} />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="receipt-header" className="text-sm text-muted-foreground">
            Header
          </label>
          <Textarea
            id="receipt-header"
            placeholder={"Your shop's name\nStreet address\nPhone number"}
            value={settings.receipt_header ?? ""}
            maxLength={MAX_LENGTH}
            onChange={(e) => update({ receipt_header: e.target.value })} />
          <span className="self-end text-xs text-muted-foreground">
            {(settings.receipt_header ?? "").length} / {MAX_LENGTH}
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="receipt-footer" className="text-sm text-muted-foreground">
            Footer
          </label>
          <Textarea
            id="receipt-footer"
            placeholder="Thank you for your business!"
            value={settings.receipt_footer ?? ""}
            maxLength={MAX_LENGTH}
            onChange={(e) => update({ receipt_footer: e.target.value })} />
          <span className="self-end text-xs text-muted-foreground">
            {(settings.receipt_footer ?? "").length} / {MAX_LENGTH}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm">Show customer name</p>
            <p className="text-xs text-muted-foreground">
              Prints the customer or tab name on receipts that have one.
            </p>
          </div>
          <Switch
            checked={settings.receipt_show_customer}
            onCheckedChange={(receipt_show_customer) => update({ receipt_show_customer })} />
        </div>
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
