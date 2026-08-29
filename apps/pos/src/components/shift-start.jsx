"use client"

import { useEffect, useState } from "react"
import { usePowerSync, useQuery } from "@powersync/react"
import { ArrowLeftIcon, SunriseIcon } from "lucide-react"

import { formatCurrency } from "@/lib/currency"
import { notifyError } from "@/lib/errors"
import { setShiftSession } from "@/lib/pos-session"
import { ensureBusinessDayOpen, getOpenBusinessDay } from "@/lib/business-day"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// Opening the drawer for a shift. Who you are was already settled at the
// PIN screen (StaffSignIn) — this step is only about money, and only
// happens at all when the owner has Shifts turned on in Settings.
//
// The business day opens implicitly here: the first shift of the day
// starts one. Making someone tap "start the day" before "start my shift"
// is two screens for a single intention.
export function ShiftStart({ deviceId, staff, onBack }) {
  const powersync = usePowerSync()
  const [typedFloat, setTypedFloat] = useState(null)
  const [busy, setBusy] = useState(false)
  const [openDay, setOpenDay] = useState(null)
  const [dayChecked, setDayChecked] = useState(false)

  const { data: lastClosedShift } = useQuery(
    `SELECT closing_cash_counted FROM shifts
     WHERE pos_device_id = ? AND status = 'closed'
     ORDER BY closed_at DESC LIMIT 1`,
    [deviceId]
  )

  // Defaults to whatever the last shift left in the drawer — the usual
  // case is that nobody emptied it overnight. Derived rather than pushed
  // into state by an effect, so the carried-over amount can arrive late
  // (it's a synced query) without clobbering something already typed.
  const carried = lastClosedShift?.[0]?.closing_cash_counted
  const openingFloat = typedFloat ?? (carried != null ? String(carried) : "")
  const setOpeningFloat = setTypedFloat

  useEffect(() => {
    let active = true
    getOpenBusinessDay(powersync, deviceId)
      .then((day) => {
        if (!active) return
        setOpenDay(day ?? null)
        setDayChecked(true)
      })
      .catch(() => active && setDayChecked(true))
    return () => {
      active = false
    };
  }, [powersync, deviceId])

  async function confirmStart() {
    setBusy(true)
    try {
      const businessDayId = await ensureBusinessDayOpen(powersync, deviceId, staff.employeeId)
      const shiftId = crypto.randomUUID()
      await powersync.execute(
        `INSERT INTO shifts
           (id, employee_id, pos_device_id, opened_at, opening_float, expenses_total, status, business_day_id)
         VALUES (?, ?, ?, ?, ?, 0, 'open', ?)`,
        [
          shiftId,
          staff.employeeId,
          deviceId,
          new Date().toISOString(),
          Number(openingFloat) || 0,
          businessDayId,
        ]
      )
      // page.jsx subscribes to the session store; writing it is what
      // moves the app on to the sales screen.
      setShiftSession({ shiftId, businessDayId })
    } catch (error) {
      notifyError(error, "Couldn't start the shift")
    } finally {
      setBusy(false)
    }
  }

  const isNewDay = dayChecked && !openDay

  return (
    <div className="flex h-svh flex-col items-center justify-center gap-6 p-6">
      <button
        type="button"
        onClick={onBack}
        className="absolute top-6 left-6 flex items-center gap-1.5 text-base text-muted-foreground"
      >
        <ArrowLeftIcon className="size-5" />
        Not you?
      </button>

      <div className="w-full max-w-sm space-y-6 text-center">
        {isNewDay && (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 p-3 text-base text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
            <SunriseIcon className="size-5" />
            Starting a new business day
          </div>
        )}

        <div>
          <h1 className="text-2xl font-semibold">Starting cash</h1>
          <p className="text-base text-muted-foreground">
            How much is in the drawer right now, {staff.employeeName.split(" ")[0]}?
          </p>
        </div>

        <div className="space-y-1.5 text-left">
          <label htmlFor="opening-float" className="text-sm font-medium text-muted-foreground">
            Opening float
          </label>
          <Input
            id="opening-float"
            type="number"
            inputMode="decimal"
            value={openingFloat}
            onChange={(e) => setOpeningFloat(e.target.value)}
            className="h-14 text-center text-2xl"
          />
        </div>

        <Button
          className="h-14 w-full bg-emerald-600 text-base hover:bg-emerald-600/90"
          disabled={busy}
          onClick={confirmStart}
        >
          {busy ? "Starting…" : `Start shift with ${formatCurrency(Number(openingFloat) || 0)}`}
        </Button>
      </div>
    </div>
  );
}
