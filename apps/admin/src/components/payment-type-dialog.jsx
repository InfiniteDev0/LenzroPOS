"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

const KIND_LABELS = {
  cash: "Cash",
  card: "Card",
  mobile: "Mobile money",
  other: "Other",
}

const emptyForm = { name: "", kind: "other", active: true }

export function PaymentTypeDialog({ paymentType, open, onOpenChange, onSave }) {
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (paymentType && open) {
      setForm({ name: paymentType.name, kind: paymentType.kind, active: paymentType.active })
    } else if (!paymentType && open) {
      setForm(emptyForm)
    }
  }, [paymentType, open])

  function handleSubmit(e) {
    e.preventDefault()
    onSave({ ...form, name: form.name.trim() })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{paymentType ? "Edit payment type" : "Add payment type"}</DialogTitle>
          </DialogHeader>
          <FieldGroup className="py-4">
            <Field>
              <FieldLabel htmlFor="payment-type-name">Name</FieldLabel>
              <Input
                id="payment-type-name"
                placeholder="e.g. M-Pesa, Bank transfer"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required />
              <FieldDescription>This is the label on the button the cashier taps.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="payment-type-kind">Kind</FieldLabel>
              <Select value={form.kind} onValueChange={(kind) => setForm((f) => ({ ...f, kind }))}>
                <SelectTrigger id="payment-type-kind" className="w-full">
                  <SelectValue>{(value) => KIND_LABELS[value] ?? "Other"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="mobile">Mobile money</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FieldDescription>
                {form.kind === "cash"
                  ? "Sales on this type count toward the cash drawer at shift close."
                  : "Sales on this type don't affect the cash drawer count."}
              </FieldDescription>
            </Field>
            <div className="flex items-center justify-between border-t pt-4">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">Show this button on the till.</p>
              </div>
              <Switch
                checked={form.active}
                onCheckedChange={(active) => setForm((f) => ({ ...f, active }))} />
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
