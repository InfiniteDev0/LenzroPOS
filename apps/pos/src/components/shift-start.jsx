"use client"

import { useEffect, useMemo, useState } from "react"
import { usePowerSync, useQuery } from "@powersync/react"
import { ArrowLeftIcon } from "lucide-react"
import { toast } from "sonner"

import { formatCurrency } from "@/lib/currency"
import { notifyError } from "@/lib/errors"
import { setShiftSession } from "@/lib/pos-session"
import { avatarColorFor } from "@/lib/employees"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PinPad } from "@/components/pin-pad"

export function ShiftStart({ deviceId, onStarted }) {
  const powersync = usePowerSync()
  const [step, setStep] = useState("pick-employee")
  const [selected, setSelected] = useState(null)
  const [pin, setPin] = useState("")
  const [pinError, setPinError] = useState(false)
  const [openingFloat, setOpeningFloat] = useState("0")
  const [busy, setBusy] = useState(false)

  const { data: employees } = useQuery(
    "SELECT * FROM employees WHERE status = 'active' ORDER BY (role = 'Owner') DESC, full_name"
  )

  const { data: lastClosedShift } = useQuery(
    `SELECT closing_cash_counted FROM shifts
     WHERE pos_device_id = ? AND status = 'closed'
     ORDER BY closed_at DESC LIMIT 1`,
    [deviceId]
  )

  useEffect(() => {
    if (step === "float") {
      setOpeningFloat(String(lastClosedShift?.[0]?.closing_cash_counted ?? 0))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  function pickEmployee(employee) {
    setSelected(employee)
    setPin("")
    setPinError(false)

    if (!employee.pos_pin_enabled) {
      setStep("float")
      return
    }
    if (!employee.pos_pin) {
      toast.error("No PIN set for this employee", {
        description: "Ask the owner to assign one from the back office.",
      })
      return
    }
    setStep("pin")
  }

  function handlePinChange(next) {
    setPin(next)
    if (next.length < 4) return
    if (next === selected.pos_pin) {
      setStep("float")
    } else {
      setPinError(true)
      setTimeout(() => {
        setPin("")
        setPinError(false)
      }, 400)
    }
  }

  async function confirmStart() {
    setBusy(true)
    try {
      const shiftId = crypto.randomUUID()
      await powersync.execute(
        `INSERT INTO shifts (id, employee_id, pos_device_id, opened_at, opening_float, expenses_total, status)
         VALUES (?, ?, ?, ?, ?, 0, 'open')`,
        [shiftId, selected.id, deviceId, new Date().toISOString(), Number(openingFloat) || 0]
      )
      setShiftSession({ shiftId, employeeId: selected.id, employeeName: selected.full_name })
      onStarted({ shiftId, employeeId: selected.id, employeeName: selected.full_name })
    } catch (error) {
      notifyError(error, "Couldn't start the shift")
    } finally {
      setBusy(false)
    }
  }

  const activeEmployees = useMemo(() => employees ?? [], [employees])

  if (step === "pin") {
    return (
      <div className="flex h-svh flex-col items-center justify-center gap-8 p-6">
        <button
          type="button"
          onClick={() => setStep("pick-employee")}
          className="absolute top-6 left-6 flex items-center gap-1.5 text-sm text-muted-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          Back
        </button>
        <div className="text-center">
          <h1 className="text-lg font-semibold">Hi, {selected.full_name.split(" ")[0]}</h1>
          <p className={`text-sm ${pinError ? "text-destructive" : "text-muted-foreground"}`}>
            {pinError ? "Wrong PIN, try again" : "Enter your PIN"}
          </p>
        </div>
        <PinPad value={pin} onChange={handlePinChange} />
      </div>
    );
  }

  if (step === "float") {
    return (
      <div className="flex h-svh flex-col items-center justify-center gap-6 p-6">
        <button
          type="button"
          onClick={() => setStep("pick-employee")}
          className="absolute top-6 left-6 flex items-center gap-1.5 text-sm text-muted-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          Back
        </button>
        <div className="w-full max-w-xs space-y-6 text-center">
          <div>
            <h1 className="text-lg font-semibold">Starting cash</h1>
            <p className="text-sm text-muted-foreground">
              How much is in the drawer right now, {selected.full_name.split(" ")[0]}?
            </p>
          </div>
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-medium text-muted-foreground">Opening float</label>
            <Input
              type="number"
              inputMode="decimal"
              value={openingFloat}
              onChange={(e) => setOpeningFloat(e.target.value)}
              className="h-12 text-center text-lg"
            />
          </div>
          <Button
            className="h-12 w-full bg-emerald-600 hover:bg-emerald-600/90"
            disabled={busy}
            onClick={confirmStart}
          >
            {busy ? "Starting…" : `Start shift with ${formatCurrency(Number(openingFloat) || 0)}`}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-svh flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <h1 className="text-lg font-semibold">Who&apos;s working?</h1>
        <p className="text-sm text-muted-foreground">Tap your name to start a shift</p>
      </div>
      <div className="grid w-full max-w-md grid-cols-2 gap-3 sm:grid-cols-3">
        {activeEmployees.map((employee) => (
          <button
            key={employee.id}
            type="button"
            onClick={() => pickEmployee(employee)}
            className="flex flex-col items-center gap-2 rounded-xl border border-border p-4 hover:bg-muted"
          >
            <div
              className={`flex size-12 items-center justify-center rounded-full text-lg font-semibold text-white ${avatarColorFor(employee.id)}`}
            >
              {employee.full_name.charAt(0)}
            </div>
            <span className="text-sm font-medium">{employee.full_name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
