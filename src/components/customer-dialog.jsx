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

const EMPTY_FORM = { name: "", email: "", phone: "", address: "", city: "", country: "Kenya", idNumber: "" }

export function CustomerDialog({ customer, open, onOpenChange, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    if (open) {
      setForm(customer ? { ...EMPTY_FORM, ...customer } : EMPTY_FORM)
    }
  }, [customer, open])

  function handleSubmit(e) {
    e.preventDefault()
    onSave({ ...customer, ...form })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader className="items-center text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-indigo-500 text-white">
              <UserIcon className="size-8" />
            </div>
            <DialogTitle>{customer ? "Edit customer" : "Add customer"}</DialogTitle>
          </DialogHeader>
          <FieldGroup className="py-4">
            <Field>
              <FieldLabel htmlFor="customer-name">Name</FieldLabel>
              <Input
                id="customer-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required />
            </Field>
            <Field>
              <FieldLabel htmlFor="customer-email">Email</FieldLabel>
              <Input
                id="customer-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </Field>
            <Field>
              <FieldLabel htmlFor="customer-phone">Phone</FieldLabel>
              <Input
                id="customer-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </Field>
            <Field>
              <FieldLabel htmlFor="customer-address">Address</FieldLabel>
              <Input
                id="customer-address"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="customer-city">City</FieldLabel>
                <Input
                  id="customer-city"
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
              </Field>
              <Field>
                <FieldLabel htmlFor="customer-country">Country</FieldLabel>
                <Input
                  id="customer-country"
                  value={form.country}
                  onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="customer-id">ID number</FieldLabel>
              <Input
                id="customer-id"
                value={form.idNumber}
                onChange={(e) => setForm((f) => ({ ...f, idNumber: e.target.value }))} />
            </Field>
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
