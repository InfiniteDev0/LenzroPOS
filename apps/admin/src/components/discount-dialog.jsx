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

const emptyForm = { name: "", kind: "percentage", value: "", apply_to: "order", active: true }

export function DiscountDialog({ discount, open, onOpenChange, onSave }) {
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (discount && open) {
      setForm({
        name: discount.name,
        kind: discount.kind,
        value: String(discount.value),
        apply_to: discount.apply_to,
        active: discount.active,
      })
    } else if (!discount && open) {
      setForm(emptyForm)
    }
  }, [discount, open])

  function handleSubmit(e) {
    e.preventDefault()
    onSave({ ...form, value: Number(form.value) })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{discount ? "Edit discount" : "Add discount"}</DialogTitle>
          </DialogHeader>
          <FieldGroup className="py-4">
            <Field>
              <FieldLabel htmlFor="discount-name">Name</FieldLabel>
              <Input
                id="discount-name"
                placeholder="e.g. Loyalty discount"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="discount-kind">Type</FieldLabel>
                <Select value={form.kind} onValueChange={(kind) => setForm((f) => ({ ...f, kind }))}>
                  <SelectTrigger id="discount-kind" className="w-full">
                    <SelectValue>
                      {(value) => (value === "percentage" ? "Percentage" : "Fixed amount (KSh)")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed_amount">Fixed amount (KSh)</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="discount-value">
                  {form.kind === "percentage" ? "Percent off" : "Amount off (KSh)"}
                </FieldLabel>
                <Input
                  id="discount-value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.value}
                  onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                  required />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="discount-apply-to">Applies to</FieldLabel>
              <Select
                value={form.apply_to}
                onValueChange={(apply_to) => setForm((f) => ({ ...f, apply_to }))}>
                <SelectTrigger id="discount-apply-to" className="w-full">
                  <SelectValue>
                    {(value) => (value === "order" ? "Whole order" : "Every item")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="order">Whole order</SelectItem>
                  <SelectItem value="item">Every item</SelectItem>
                </SelectContent>
              </Select>
              <FieldDescription>
                {form.apply_to === "item"
                  ? "Applied to every line item in the cart, not the order total directly."
                  : "Applied once to the order's subtotal."}
              </FieldDescription>
            </Field>
            <div className="flex items-center justify-between border-t pt-4">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">Cashiers can offer this at checkout.</p>
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
