"use client"

import { useState } from "react"
import { usePowerSync } from "@powersync/react"
import { toast } from "sonner"

import { notifyError } from "@/lib/errors"
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

export function LogExpenseDialog({ shiftId, open, onOpenChange }) {
  const powersync = usePowerSync()
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const value = Number(amount)
    if (!value || value <= 0) return

    setSaving(true)
    try {
      await powersync.execute(
        "INSERT INTO shift_expenses (id, shift_id, amount, note, created_at) VALUES (?, ?, ?, ?, ?)",
        [crypto.randomUUID(), shiftId, value, note || null, new Date().toISOString()]
      )
      await powersync.execute(
        "UPDATE shifts SET expenses_total = expenses_total + ? WHERE id = ?",
        [value, shiftId]
      )
      toast.success("Expense logged")
      setAmount("")
      setNote("")
      onOpenChange(false)
    } catch (error) {
      notifyError(error, "Couldn't log the expense")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Log an expense</DialogTitle>
          </DialogHeader>
          <FieldGroup className="py-4">
            <Field>
              <FieldLabel htmlFor="expense-amount">Amount</FieldLabel>
              <Input
                id="expense-amount"
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                autoFocus />
            </Field>
            <Field>
              <FieldLabel htmlFor="expense-note">Note</FieldLabel>
              <Input
                id="expense-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Bought more napkins" />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-600/90">
              {saving ? "Saving…" : "Log expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
