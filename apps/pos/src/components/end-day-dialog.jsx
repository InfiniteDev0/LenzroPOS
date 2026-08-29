"use client"

import { useEffect, useState } from "react"
import { usePowerSync } from "@powersync/react"
import { toast } from "sonner"

import { formatCurrency } from "@/lib/currency"
import { notifyError } from "@/lib/errors"
import { closeBusinessDay, computeDayTotals } from "@/lib/business-day"
import { printDayReport } from "@/lib/print-day-report"
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
import { Skeleton } from "@/components/ui/skeleton"

function Row({ label, value, muted = true, strong = false }) {
  return (
    <div
      className={`flex justify-between ${strong ? "border-t border-border pt-2 font-semibold text-foreground" : muted ? "text-muted-foreground" : ""}`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

// The Z-report: what the day took, before the day is sealed. Once closed,
// these numbers are snapshotted onto the business_days row and the day
// can never be reopened (RLS only permits updating an open day).
export function EndDayDialog({ businessDay, employeeId, employeeName, open, onOpenChange, onClosed }) {
  const powersync = usePowerSync()
  // Tagged with the day they were computed for, so reopening the dialog
  // on a different day shows a spinner rather than the previous day's
  // numbers — without synchronously clearing state inside the effect.
  const [computed, setComputed] = useState({ dayId: null, totals: null })
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open || !businessDay?.id) return;
    let active = true
    const dayId = businessDay.id
    computeDayTotals(powersync, dayId)
      .then((result) => active && setComputed({ dayId, totals: result }))
      .catch((error) => notifyError(error, "Couldn't total up the day"))
    return () => {
      active = false
    };
  }, [open, businessDay?.id, powersync])

  const totals = computed.dayId === businessDay?.id ? computed.totals : null

  async function handleConfirm() {
    setSaving(true)
    try {
      const finalTotals = await closeBusinessDay(powersync, businessDay.id, employeeId, note)
      toast.success("Business day closed", {
        description: `${finalTotals.orderCount} order${finalTotals.orderCount === 1 ? "" : "s"} · ${formatCurrency(finalTotals.grossSales)} taken`,
      })
      printDayReport({ businessDay, totals: finalTotals, employeeName, note })
      onClosed()
    } catch (error) {
      notifyError(error, "Couldn't close the business day")
    } finally {
      setSaving(false)
    }
  }

  const blocked = totals?.openShiftCount > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>End business day</DialogTitle>
          <DialogDescription>
            {businessDay
              ? `Open since ${new Date(businessDay.opened_at).toLocaleString("en-KE", {
                  day: "numeric",
                  month: "short",
                  hour: "numeric",
                  minute: "2-digit",
                })}. This closes the day for good — it can't be reopened.`
              : "No business day is open."}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[55svh] space-y-4 overflow-y-auto py-2">
          {!totals ? (
            <div className="space-y-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="space-y-2 rounded-lg border border-border p-3 text-sm">
                <p className="pb-1 text-xs font-medium text-muted-foreground">Sales</p>
                <Row label="Orders" value={totals.orderCount} />
                {totals.byPaymentMethod
                  .filter((entry) => entry.method !== "tab")
                  .map((entry) => (
                    <Row
                      key={entry.method}
                      label={entry.method}
                      value={formatCurrency(entry.amount)} />
                  ))}
                <Row label="Total taken" value={formatCurrency(totals.grossSales)} strong />
              </div>

              {totals.tabSales > 0 && (
                <div className="space-y-2 rounded-lg border border-border p-3 text-sm">
                  <p className="pb-1 text-xs font-medium text-muted-foreground">On tab</p>
                  <Row label="Put on customer tabs" value={formatCurrency(totals.tabSales)} />
                  <p className="text-xs text-muted-foreground">
                    Not counted in today&apos;s takings — it counts on the day it&apos;s paid off.
                  </p>
                </div>
              )}

              <div className="space-y-2 rounded-lg border border-border p-3 text-sm">
                <p className="pb-1 text-xs font-medium text-muted-foreground">Drawer</p>
                <Row label="Opening floats" value={formatCurrency(totals.openingFloat)} />
                <Row label="Cash sales" value={formatCurrency(totals.cashSales)} />
                <Row label="Expenses" value={`−${formatCurrency(totals.expensesTotal)}`} />
                <Row label="Expected cash" value={formatCurrency(totals.expectedCash)} strong />
                <Row label="Counted at shift close" value={formatCurrency(totals.countedCash)} />
                <div
                  className={`flex justify-between font-medium ${
                    totals.discrepancy === 0
                      ? "text-emerald-600"
                      : totals.discrepancy > 0
                        ? "text-sky-600"
                        : "text-destructive"
                  }`}
                >
                  <span>Over / short</span>
                  <span>
                    {totals.discrepancy === 0
                      ? "Exact"
                      : totals.discrepancy > 0
                        ? `${formatCurrency(totals.discrepancy)} over`
                        : `${formatCurrency(Math.abs(totals.discrepancy))} short`}
                  </span>
                </div>
              </div>

              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="day-note">Note (optional)</FieldLabel>
                  <Input
                    id="day-note"
                    value={note}
                    placeholder="Anything worth remembering about today"
                    onChange={(e) => setNote(e.target.value)} />
                </Field>
              </FieldGroup>

              {blocked && (
                <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  A shift is still open. Close it first — the day can&apos;t be totalled while
                  someone is still selling.
                </p>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!totals || blocked || saving}
            onClick={handleConfirm}
            className="bg-emerald-600 hover:bg-emerald-600/90"
          >
            {saving ? "Closing…" : "Close the day & print report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
