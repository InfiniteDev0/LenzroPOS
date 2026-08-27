"use client"

import { useEffect, useState } from "react"
import { ImageIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { defaultReceiptSettings, loadReceiptSettings, saveReceiptSettings } from "@/lib/receipt-settings"

const MAX_LENGTH = 500

function LogoUpload({ label, value, onChange }) {
  function handleChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onChange(reader.result)
    reader.readAsDataURL(file)
  }

  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="relative flex size-24 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed bg-muted/50 hover:bg-muted">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={label} className="size-full object-cover" />
        ) : (
          <ImageIcon className="size-6 text-muted-foreground" />
        )}
        <input type="file" accept="image/*" className="sr-only" onChange={handleChange} />
      </span>
    </label>
  );
}

export default function Page() {
  const [settings, setSettings] = useState(defaultReceiptSettings)

  useEffect(() => {
    setSettings(loadReceiptSettings())
  }, [])

  function update(patch) {
    setSettings((prev) => ({ ...prev, ...patch }))
  }

  function handleSave() {
    saveReceiptSettings(settings)
    toast.success("Receipt settings saved")
  }

  return (
    <Card className="gap-0 py-0">
      <div className="border-b p-4">
        <h2 className="text-lg font-medium">Receipt settings</h2>
      </div>
      <CardContent className="flex flex-col gap-6 p-4">
        <LogoUpload
          label="Printed receipt logo"
          value={settings.printedLogo}
          onChange={(printedLogo) => update({ printedLogo })}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="receipt-header" className="text-sm text-muted-foreground">
            Header
          </label>
          <Textarea
            id="receipt-header"
            value={settings.header}
            maxLength={MAX_LENGTH}
            onChange={(e) => update({ header: e.target.value })} />
          <span className="self-end text-xs text-muted-foreground">
            {settings.header.length} / {MAX_LENGTH}
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="receipt-footer" className="text-sm text-muted-foreground">
            Footer
          </label>
          <Textarea
            id="receipt-footer"
            value={settings.footer}
            maxLength={MAX_LENGTH}
            onChange={(e) => update({ footer: e.target.value })} />
          <span className="self-end text-xs text-muted-foreground">
            {settings.footer.length} / {MAX_LENGTH}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Show customer info</span>
          <Switch
            checked={settings.showCustomerInfo}
            onCheckedChange={(showCustomerInfo) => update({ showCustomerInfo })} />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-muted-foreground">Receipt language</span>
          <Select value={settings.language} onValueChange={(language) => update({ language })}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="English">English</SelectItem>
              <SelectItem value="Swahili">Swahili</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <div className="flex justify-end gap-2 border-t bg-muted/50 p-4">
        <Button variant="outline" onClick={() => setSettings(loadReceiptSettings())}>
          Cancel
        </Button>
        <Button className="bg-emerald-600 hover:bg-emerald-600/90" onClick={handleSave}>
          Save
        </Button>
      </div>
    </Card>
  );
}
