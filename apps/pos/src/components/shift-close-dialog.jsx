"use client"

import { useMemo, useState } from "react"
import { usePowerSync, useQuery } from "@powersync/react"
import { toast } from "sonner"

import { formatCurrency } from "@/lib/currency"
import { notifyError } from "@/lib/errors"
import { clearShiftSession } from "@/lib/pos-session"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function ShiftCloseDialog({ shiftId, open, onOpenChange, onClosed }) {
  const powersync = usePowerSync()
  const [counted, setCounted] = useState("")
  const [saving, setSaving] = useState(false)

  const { data: shiftRows } = useQuery(
    "SELECT opening_float, expenses_total FROM shifts WHERE id = ?",
    [shiftId]
  )
  // "Cash" is whichever payment types the owner marked as cash, not the
  // literal string — they can rename it or add a second drawer-money type.
  // The literal 'cash' stays in the check so sales rung up before payment
  // types were configurable still count toward the drawer.
  const { data: cashRows } = useQuery(
    `SELECT COALESCE(SUM(total), 0) as cash_total FROM orders
     WHERE shift_id = ?
       AND (lower(payment_method) = 'cash'
            OR lower(payment_method) IN (
              SELECT lower(name) FROM payment_types WHERE kind = 'cash'
            ))`,
    [shiftId]
  )

  const openingFloat = shiftRows?.[0]?.opening_float ?? 0
  const expensesTotal = shiftRows?.[0]?.expenses_total ?? 0
  const cashSales = cashRows?.[0]?.cash_total ?? 0
  const expectedCash = openingFloat + cashSales - expensesTotal

  const discrepancy = useMemo(() => {
    if (counted === "") return null
    return Number(counted) - expectedCash
  }, [counted, expectedCash])

  async function handleConfirm() {
    if (counted === "") return
    setSaving(true)
    try {
      await powersync.execute(
        `UPDATE shifts
         SET status = 'closed', closed_at = ?, closing_cash_counted = ?, expected_cash = ?, discrepancy = ?
         WHERE id = ?`,
        [new Date().toISOString(), Number(counted), expectedCash, discrepancy, shiftId]
      )
      clearShiftSession()
      toast.success("Shift closed")
      onClosed()
    } catch (error) {
      notifyError(error, "Couldn't close the shift")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Close shift</DialogTitle>
          <DialogDescription>Count the drawer and confirm to close out.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5 rounded-lg border border-border p-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Opening float</span>
              <span>{formatCurrency(openingFloat)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Cash sales</span>
              <span>{formatCurrency(cashSales)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Expenses</span>
              <span>&minus;{formatCurrency(expensesTotal)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-1.5 font-medium text-foreground">
              <span>Expected cash</span>
              <span>{formatCurrency(expectedCash)}</span>
            </div>
          </div>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="cash-counted">Cash counted in drawer</FieldLabel>
              <Input
                id="cash-counted"
                type="number"
                inputMode="decimal"
                autoFocus
                value={counted}
                onChange={(e) => setCounted(e.target.value)} />
            </Field>
          </FieldGroup>
          {discrepancy !== null && (
            <p
              className={`text-sm font-medium ${
                discrepancy === 0
                  ? "text-emerald-600"
                  : discrepancy > 0
                    ? "text-sky-600"
                    : "text-destructive"
              }`}
            >
              {discrepancy === 0
                ? "Matches exactly"
                : discrepancy > 0
                  ? `${formatCurrency(discrepancy)} over`
                  : `${formatCurrency(Math.abs(discrepancy))} short`}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={counted === "" || saving}
            onClick={handleConfirm}
            className="bg-emerald-600 hover:bg-emerald-600/90"
          >
            {saving ? "Closing…" : "Confirm & close shift"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
