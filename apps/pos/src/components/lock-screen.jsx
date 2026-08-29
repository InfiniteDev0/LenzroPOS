"use client"

import { useState } from "react"
import { useQuery } from "@powersync/react"
import { LockIcon } from "lucide-react"

import { PinPad } from "@/components/pin-pad"

export function LockScreen({ employeeId, employeeName, onUnlock }) {
  const [pin, setPin] = useState("")
  const [pinError, setPinError] = useState(false)

  const { data: rows } = useQuery("SELECT pos_pin FROM employees WHERE id = ?", [employeeId])
  const correctPin = rows?.[0]?.pos_pin

  function handlePinChange(next) {
    setPin(next)
    if (next.length < 4) return
    if (next === correctPin) {
      onUnlock()
    } else {
      setPinError(true)
      setTimeout(() => {
        setPin("")
        setPinError(false)
      }, 400)
    }
  }

  return (
    <div className="flex h-svh flex-col items-center justify-center gap-8 p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
          <LockIcon className="size-6 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">Locked</h1>
          <p className={`text-sm ${pinError ? "text-destructive" : "text-muted-foreground"}`}>
            {pinError ? "Wrong PIN, try again" : `Enter ${employeeName.split(" ")[0]}'s PIN to continue`}
          </p>
        </div>
      </div>
      <PinPad value={pin} onChange={handlePinChange} />
    </div>
  );
}
