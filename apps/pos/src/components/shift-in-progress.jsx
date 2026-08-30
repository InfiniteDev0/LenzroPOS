"use client"

import { useQuery } from "@powersync/react"
import { ArrowLeftIcon, ClockIcon } from "lucide-react"

import { formatCurrency } from "@/lib/currency"
import { avatarColorFor } from "@/lib/employees"
import { Button } from "@/components/ui/button"

function formatOpenedAt(iso) {
  return new Date(iso).toLocaleString("en-KE", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Shown when a shift is already open on this till and the person who just
// signed in isn't the one who opened it — the usual case being the owner
// picking up their phone while a cashier is mid-shift on the counter
// machine.
//
// Starting a second shift is not offered, because a till has one drawer:
// two shifts covering the same money reconcile to nothing. Continuing on
// the open one is offered, since that's what actually happens in a shop —
// two people serving from the same drawer — and each sale still records
// who rang it up.
export function ShiftInProgress({ shift, staff, onContinue, onSwitchUser }) {
  const { data: ownerRows } = useQuery("SELECT full_name FROM employees WHERE id = ?", [
    shift.employee_id ?? "",
  ])
  const ownerName = ownerRows?.[0]?.full_name ?? "another member of staff"

  return (
    <div className="flex h-svh flex-col items-center justify-center gap-8 p-6">
      <button
        type="button"
        onClick={onSwitchUser}
        className="absolute top-6 left-6 flex items-center gap-1.5 text-base text-muted-foreground"
      >
        <ArrowLeftIcon className="size-5" />
        Not you?
      </button>

      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <div
            className={`flex size-16 items-center justify-center rounded-full text-2xl font-semibold text-white ${avatarColorFor(shift.employee_id ?? "")}`}
          >
            {ownerName.charAt(0)}
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">There&apos;s a shift already open</h1>
            <p className="text-base text-muted-foreground">
              {ownerName} opened this till at {formatOpenedAt(shift.opened_at)} with{" "}
              {formatCurrency(shift.opening_float)} in the drawer.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-muted p-3 text-left text-sm text-muted-foreground">
          <ClockIcon className="size-5 shrink-0" />
          <span>
            A till has one drawer, so a second shift can&apos;t be started while this one is
            running. Carry on selling under it — your own sales are still recorded as yours.
          </span>
        </div>

        <Button
          className="h-14 w-full bg-emerald-600 text-base hover:bg-emerald-600/90"
          onClick={onContinue}
        >
          Continue as {staff.employeeName.split(" ")[0]}
        </Button>
      </div>
    </div>
  );
}
