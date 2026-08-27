"use client"

import { useState } from "react"
import { PlusIcon } from "lucide-react"
import { toast } from "sonner"

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
  const [devices, setDevices] = useState([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDevice, setEditingDevice] = useState(null)

  function openAdd() {
    setEditingDevice(null)
    setDialogOpen(true)
  }

  function openEdit(device) {
    setEditingDevice(device)
    setDialogOpen(true)
  }

  function handleSave(form) {
    if (editingDevice) {
      setDevices((prev) => prev.map((d) => (d.id === editingDevice.id ? { ...d, ...form } : d)))
    } else {
      setDevices((prev) => [
        ...prev,
        { id: crypto.randomUUID(), name: form.name, status: "Not activated" },
      ])
    }
  }

  function handleDelete(device) {
    setDevices((prev) => prev.filter((d) => d.id !== device.id))
    toast.success(`${device.name} removed`)
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
              {devices.length === 0 ? (
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
                    <TableCell className="text-amber-600">{device.status}</TableCell>
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
