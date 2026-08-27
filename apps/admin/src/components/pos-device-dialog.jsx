"use client"

import { useEffect, useState } from "react"
import { SmartphoneIcon, TrashIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function PosDeviceDialog({ device, open, onOpenChange, onSave, onDelete }) {
  const [name, setName] = useState("")

  useEffect(() => {
    if (open) setName(device?.name ?? "")
  }, [device, open])

  function handleSubmit(e) {
    e.preventDefault()
    onSave({ ...device, name })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader className="items-center text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-indigo-500 text-white">
              <SmartphoneIcon className="size-8" />
            </div>
            <DialogTitle className="sr-only">POS device</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <Field>
              <FieldLabel htmlFor="pos-device-name">Name</FieldLabel>
              <Input
                id="pos-device-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required />
            </Field>
            {device && (
              <div className="flex flex-col gap-1 border-t pt-4">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className="font-medium text-amber-600">{device.status}</span>
                <span className="text-sm text-muted-foreground">
                  Sign in to the Lenzro POS app to activate this device.
                </span>
              </div>
            )}
          </div>
          <DialogFooter className="sm:justify-between">
            {device && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => {
                  onDelete(device)
                  onOpenChange(false)
                }}>
                <TrashIcon className="size-4" />
              </Button>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-600/90">
                Save
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
