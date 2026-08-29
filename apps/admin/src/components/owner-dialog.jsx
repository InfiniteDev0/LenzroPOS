"use client"

import { useEffect, useState } from "react"
import { UserIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PinInput } from "@/components/pin-input"

export function OwnerDialog({ employee, open, onOpenChange, onSave }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", pin: "", pinEnabled: true })

  useEffect(() => {
    if (employee && open) {
      setForm({
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        pin: employee.pin ?? "",
        pinEnabled: employee.pinEnabled ?? true,
      })
    }
  }, [employee, open])

  function handleSubmit(e) {
    e.preventDefault()
    onSave({ ...employee, ...form })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader className="items-center text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-teal-600 text-white">
              <UserIcon className="size-8" />
            </div>
            <DialogTitle>{form.name || "Owner"}</DialogTitle>
          </DialogHeader>
          <FieldGroup className="py-4">
            <Field>
              <FieldLabel htmlFor="owner-name">Name</FieldLabel>
              <Input
                id="owner-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required />
            </Field>
            <Field>
              <FieldLabel htmlFor="owner-email">Email</FieldLabel>
              <Input
                id="owner-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </Field>
            <Field>
              <FieldLabel htmlFor="owner-phone">Phone</FieldLabel>
              <Input
                id="owner-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </Field>
            <Field>
              <FieldLabel>Role</FieldLabel>
              <p className="text-sm text-muted-foreground">Owner</p>
            </Field>
            <div className="flex items-end justify-between gap-4 border-t pt-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-sm text-muted-foreground">POS PIN</span>
                {form.pinEnabled ? (
                  <PinInput pin={form.pin} onChange={(pin) => setForm((f) => ({ ...f, pin }))} />
                ) : (
                  <p className="text-sm text-muted-foreground">PIN disabled</p>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setForm((f) => ({ ...f, pinEnabled: !f.pinEnabled }))}>
                {form.pinEnabled ? "Disable PIN code" : "Enable PIN code"}
              </Button>
            </div>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-600/90">
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
