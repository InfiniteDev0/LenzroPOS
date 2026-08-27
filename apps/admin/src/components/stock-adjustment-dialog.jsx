"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export function StockAdjustmentDialog({ item, mode, open, onOpenChange, onSave, saving }) {
  const [quantity, setQuantity] = useState("")
  const [note, setNote] = useState("")
  const isAdd = mode === "add"

  useEffect(() => {
    if (!open) return
    setQuantity(isAdd ? "" : String(item?.quantity ?? 0))
    setNote("")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, item])

  function handleSubmit(e) {
    e.preventDefault()
    onSave({ quantity: Number(quantity) || 0, note: note.trim() || null })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isAdd ? "Add stock" : "Adjust count"} — {item?.name}
            </DialogTitle>
            <DialogDescription>
              {isAdd
                ? "How many units did you receive? This adds to the current count."
                : "What's the actual count right now? This replaces the current count."}
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="py-4">
            <Field>
              <FieldLabel htmlFor="adjustment-quantity">
                {isAdd ? "Units received" : "Actual count"}
              </FieldLabel>
              <Input
                id="adjustment-quantity"
                type="number"
                min="0"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                autoFocus
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="adjustment-note">Note</FieldLabel>
              <Textarea
                id="adjustment-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional"
                rows={2}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-600/90" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
