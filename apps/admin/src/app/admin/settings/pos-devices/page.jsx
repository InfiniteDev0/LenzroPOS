"use client"

import { useEffect, useState } from "react"
import { CheckIcon, CopyIcon, ExternalLinkIcon, MonitorSmartphoneIcon, PlusIcon } from "lucide-react"
import { toast } from "sonner"

import { createClient } from "@lenzro/supabase/client"
import { notifyError } from "@/lib/errors"
import { POS_URL } from "@/lib/pos-app"
import { toPosDeviceViewModel } from "@/lib/pos-devices"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { PosDeviceDialog } from "@/components/pos-device-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function Page() {
  const [supabase] = useState(() => createClient())
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDevice, setEditingDevice] = useState(null)
  const [copied, setCopied] = useState(false)

  // For sending the link to whoever is setting up the counter machine,
  // which is usually not the person sitting in the back office.
  async function copyPosUrl() {
    try {
      await navigator.clipboard.writeText(POS_URL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Couldn't copy — select the link and copy it by hand")
    }
  }

  useEffect(() => {
    loadDevices()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadDevices() {
    setLoading(true)
    const { data, error } = await supabase
      .from("pos_devices")
      .select("*")
      .order("created_at", { ascending: false })
    if (error) {
      notifyError(error, "Couldn't load POS devices")
    } else {
      setDevices(data.map(toPosDeviceViewModel))
    }
    setLoading(false)
  }

  function openAdd() {
    setEditingDevice(null)
    setDialogOpen(true)
  }

  function openEdit(device) {
    setEditingDevice(device)
    setDialogOpen(true)
  }

  async function handleSave(form) {
    const { error } = editingDevice
      ? await supabase.from("pos_devices").update({ name: form.name }).eq("id", editingDevice.id)
      : await supabase.from("pos_devices").insert({ name: form.name })

    if (error) {
      notifyError(error, "Couldn't save the POS device")
      return
    }

    toast.success(editingDevice ? "Device updated" : "Device added")
    loadDevices()
  }

  async function handleDelete(device) {
    const { error } = await supabase.from("pos_devices").delete().eq("id", device.id)
    if (error) {
      notifyError(error, "Couldn't remove the device")
      return
    }
    toast.success(`${device.name} removed`)
    loadDevices()
  }

  return (
    <>
      {/* Creating a device row here does nothing on its own, and until
          this card existed there was no route from "I made a POS" to
          "…so where is it?" — the only link to the till lived on the
          public landing page, which nobody sees again after signing in. */}
      <Card className="mb-4 gap-0 overflow-hidden border-emerald-600/40 py-0">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-600/10 text-emerald-600">
            <MonitorSmartphoneIcon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-foreground">Open the till on your counter machine</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              There&apos;s nothing to download from an app store. On the laptop, tablet or terminal
              you&apos;ll sell from, open the link below in Chrome or Edge and install it from the
              address bar (&ldquo;Install app&rdquo;, or &ldquo;Add to Home Screen&rdquo; on a
              tablet). Sign in once with this account, pick the device below, and from then on your
              staff only ever use their PINs.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                className="gap-2 bg-emerald-600 hover:bg-emerald-600/90"
                render={<a href={POS_URL} target="_blank" rel="noreferrer" />}>
                <ExternalLinkIcon />
                Open the till
              </Button>
              <code className="rounded-md bg-muted px-2 py-1.5 text-xs text-muted-foreground">
                {POS_URL}
              </code>
              <Button variant="ghost" size="sm" className="gap-1.5" onClick={copyPosUrl}>
                {copied ? <CheckIcon /> : <CopyIcon />}
                {copied ? "Copied" : "Copy link"}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="gap-0 overflow-hidden py-0">
        <div className="border-b p-4">
          {/* One till per account — enforced in the database by migration
              0014. Shifts, business days and the drawer count are all
              scoped per device with nothing reconciling across them, so a
              second till would quietly keep a second set of books. */}
          {devices.length === 0 ? (
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-600/90" onClick={openAdd}>
              <PlusIcon />
              Add POS
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Your account has one till. Tap it to rename it — or activate it on a new machine by
              opening the POS app there and signing in.
            </p>
          )}
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">
                  <Checkbox disabled />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loading && devices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                    No POS devices yet
                  </TableCell>
                </TableRow>
              ) : (
                devices.map((device) => (
                  <TableRow
                    key={device.id}
                    className="cursor-pointer"
                    onClick={() => openEdit(device)}>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox />
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{device.name}</TableCell>
                    <TableCell
                      className={device.status === "Activated" ? "text-emerald-600" : "text-amber-600"}>
                      {device.status}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <PosDeviceDialog
        device={editingDevice}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
        onDelete={handleDelete} />
    </>
  );
}
