"use client"

import { useEffect, useState } from "react"
import { PlusIcon } from "lucide-react"
import { toast } from "sonner"

import { createClient } from "@lenzro/supabase/client"
import { notifyError } from "@/lib/errors"
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
      <Card className="gap-0 overflow-hidden py-0">
        <div className="border-b p-4">
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-600/90" onClick={openAdd}>
            <PlusIcon />
            Add POS
          </Button>
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
