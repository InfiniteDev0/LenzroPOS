"use client"

import { useEffect, useState } from "react"

import { ASSIGNABLE_EMPLOYEE_ROLES } from "@/lib/employees"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function EmployeeDialog({ employee, open, onOpenChange, onSave }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "Cashier",
    pin: "",
    pinEnabled: true,
  })

  useEffect(() => {
    if (employee && open) {
      setForm({
        name: employee.name,
        email: employee.email ?? "",
        phone: employee.phone ?? "",
        role: employee.role,
        pin: employee.pin ?? "",
        pinEnabled: employee.pinEnabled ?? true,
      })
    } else if (!employee && open) {
      setForm({ name: "", email: "", phone: "", role: "Cashier", pin: "", pinEnabled: true })
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
          <DialogHeader>
            <DialogTitle>Employee details</DialogTitle>
          </DialogHeader>
          <FieldGroup className="py-4">
            <Field>
              <FieldLabel htmlFor="employee-name">Name</FieldLabel>
              <Input
                id="employee-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required />
            </Field>
            <Field>
              <FieldLabel htmlFor="employee-email">Email</FieldLabel>
              <Input
                id="employee-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </Field>
            <Field>
              <FieldLabel htmlFor="employee-phone">Phone</FieldLabel>
              <Input
                id="employee-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </Field>
            <Field>
              <FieldLabel htmlFor="employee-role">Role</FieldLabel>
              <Select
                value={form.role}
                onValueChange={(role) => setForm((f) => ({ ...f, role }))}>
                <SelectTrigger id="employee-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNABLE_EMPLOYEE_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
