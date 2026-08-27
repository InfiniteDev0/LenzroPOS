"use client"

import { useState } from "react"
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

const MAX_LENGTH = 500

function LogoUpload({ label }) {
  const [preview, setPreview] = useState(null)

  function handleChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result)
    reader.readAsDataURL(file)
  }

  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="relative flex size-24 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed bg-muted/50 hover:bg-muted">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={label} className="size-full object-cover" />
        ) : (
          <ImageIcon className="size-6 text-muted-foreground" />
        )}
        <input type="file" accept="image/*" className="sr-only" onChange={handleChange} />
      </span>
    </label>
  );
}

export default function Page() {
  const [header, setHeader] = useState("")
  const [footer, setFooter] = useState("")
  const [showCustomerInfo, setShowCustomerInfo] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [language, setLanguage] = useState("English")

  function handleSave() {
    toast.success("Receipt settings saved")
  }

  return (
    <Card className="gap-0 py-0">
      <div className="border-b p-4">
        <h2 className="text-lg font-medium">Receipt settings</h2>
      </div>
      <CardContent className="flex flex-col gap-6 p-4">
        <div className="flex gap-6">
          <LogoUpload label="Emailed receipt" />
          <LogoUpload label="Printed receipt" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="receipt-header" className="text-sm text-muted-foreground">
            Header
          </label>
          <Textarea
            id="receipt-header"
            value={header}
            maxLength={MAX_LENGTH}
            onChange={(e) => setHeader(e.target.value)} />
          <span className="self-end text-xs text-muted-foreground">
            {header.length} / {MAX_LENGTH}
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="receipt-footer" className="text-sm text-muted-foreground">
            Footer
          </label>
          <Textarea
            id="receipt-footer"
            value={footer}
            maxLength={MAX_LENGTH}
            onChange={(e) => setFooter(e.target.value)} />
          <span className="self-end text-xs text-muted-foreground">
            {footer.length} / {MAX_LENGTH}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Show customer info</span>
          <Switch checked={showCustomerInfo} onCheckedChange={setShowCustomerInfo} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Show comments</span>
          <Switch checked={showComments} onCheckedChange={setShowComments} />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-muted-foreground">Receipt language</span>
          <Select value={language} onValueChange={setLanguage}>
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
        <Button variant="outline">Cancel</Button>
        <Button className="bg-emerald-600 hover:bg-emerald-600/90" onClick={handleSave}>
          Save
        </Button>
      </div>
    </Card>
  );
}
