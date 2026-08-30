"use client"

import { useEffect, useState } from "react"
import { usePowerSync, useQuery, useStatus } from "@powersync/react"
import { ArrowLeftIcon, MoonIcon, SunriseIcon } from "lucide-react"

import { createClient } from "@lenzro/supabase/client"
import { formatCurrency } from "@/lib/currency"
import { notifyError } from "@/lib/errors"
import { setShiftSession } from "@/lib/pos-session"
import { ensureBusinessDayOpen, getOpenBusinessDay } from "@/lib/business-day"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EndDayDialog } from "@/components/end-day-dialog"

// Opening the drawer for a shift. Who you are was already settled at the
// PIN screen (StaffSignIn) — this step is only about money, and only
// happens at all when the owner has Shifts turned on in Settings.
//
// The business day opens implicitly here: the first shift of the day
// starts one. Making someone tap "start the day" before "start my shift"
// is two screens for a single intention.
export function ShiftStart({ deviceId, staff, onBack }) {
  const powersync = usePowerSync()
  const status = useStatus()
  const [typedFloat, setTypedFloat] = useState(null)
  const [busy, setBusy] = useState(false)
  const [openDay, setOpenDay] = useState(null)
  const [dayChecked, setDayChecked] = useState(false)
  const [endDayOpen, setEndDayOpen] = useState(false)

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
      // Online, the server decides whether this till already has a shift
      // open. The local table can be stale, and opening a second shift is
      // rejected by shifts_one_open_per_device — which doesn't fail
      // visibly, it just gets discarded and reconciled away, dropping the
      // cashier back here a second after they thought they'd started.
      const supabase = status.connected ? createClient() : null

      if (supabase) {
        const { data: alreadyOpen, error } = await supabase
          .from("shifts")
          .select("id, business_day_id")
          .eq("pos_device_id", deviceId)
          .eq("status", "open")
          .maybeSingle()
        if (error) throw error;

        if (alreadyOpen) {
          setShiftSession({
            shiftId: alreadyOpen.id,
            businessDayId: alreadyOpen.business_day_id,
          })
          return
        }
      }

      const businessDayId = await ensureBusinessDayOpen(
        powersync,
        deviceId,
        staff.employeeId,
        supabase
      )
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

        {/* Closing a shift lands the cashier back here, so this is the
            only screen where "the day is over" is actually true — and
            therefore the only place End business day can live. */}
        {openDay && (
          <div className="border-t border-border pt-5">
            <p className="mb-3 text-sm text-muted-foreground">
              Done for the day? Close it out and print the day&apos;s report.
            </p>
            <Button
              variant="outline"
              className="h-12 w-full gap-2 text-base"
              onClick={() => setEndDayOpen(true)}
            >
              <MoonIcon className="size-5" />
              End business day
            </Button>
          </div>
        )}
      </div>

      {openDay && (
        <EndDayDialog
          businessDay={openDay}
          employeeId={staff.employeeId}
          employeeName={staff.employeeName}
          open={endDayOpen}
          onOpenChange={setEndDayOpen}
          onClosed={() => {
            setEndDayOpen(false)
            setOpenDay(null)
          }}
        />
      )}
    </div>
  );
}
