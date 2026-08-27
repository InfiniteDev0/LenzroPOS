"use client"

import { useEffect, useState } from "react"

import { EMPLOYEE_ROLES } from "@/lib/employees"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function EmployeeDialog({ employee, open, onOpenChange, onSave }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "Cashier" })

  useEffect(() => {
    if (employee) {
      setForm({
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        role: employee.role,
      })
    }
  }, [employee])

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
                  {EMPLOYEE_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
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
