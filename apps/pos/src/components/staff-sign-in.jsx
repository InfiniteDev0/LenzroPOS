"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@powersync/react"
import { ArrowLeftIcon, CheckCircle2Icon } from "lucide-react"
import { toast } from "sonner"

import { createClient } from "@lenzro/supabase/client"
import { setStaffSession, clearDeviceId, clearShiftSession, clearStaffSession } from "@/lib/pos-session"
import { avatarColorFor } from "@/lib/employees"
import { Button } from "@/components/ui/button"
import { PinPad } from "@/components/pin-pad"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// What each role can do at the till, so picking a name says something
// more useful than repeating the role word back.
const ROLE_BLURBS = {
  Owner: "Full access, including the back office",
  Administrator: "Full access at the till",
  Manager: "Can run shifts and clear tabs",
  Cashier: "Can take orders and payments",
}

// The daily front door. The device signed in with a real email/password
// exactly once (device activation) and that Supabase session is never
// signed out, so from here on the credential is a PIN — including the
// owner's own. Nobody at the till ever types an email address again.
export function StaffSignIn({ hasOpenShift }) {
  const router = useRouter()
  const [step, setStep] = useState("pick")
  const [selected, setSelected] = useState(null)
  const [pin, setPin] = useState("")
  const [pinError, setPinError] = useState(false)
  const [signOutOpen, setSignOutOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const { data: employees, isLoading } = useQuery(
    "SELECT * FROM employees WHERE status = 'active' ORDER BY (role = 'Owner') DESC, full_name"
  )

  function pick(employee) {
    setSelected(employee)
    setPin("")
    setPinError(false)

    // A PIN-less employee can't prove who they are, so they can't take
    // the till — the owner has to give them one from the back office.
    if (!employee.pos_pin_enabled || !employee.pos_pin) {
      toast.error(`No PIN set for ${employee.full_name}`, {
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
      // Writing to the session store is what advances the app — page.jsx
      // subscribes to it rather than taking a callback.
      setStaffSession({
        employeeId: selected.id,
        employeeName: selected.full_name,
        role: selected.role,
      })
    } else {
      setPinError(true)
      setTimeout(() => {
        setPin("")
        setPinError(false)
      }, 400)
    }
  }

  // The only route back to an email/password screen. Deliberately buried
  // and blocked mid-shift: signing out here means the next person has to
  // reactivate this device with the owner's real Supabase login.
  async function handleFullSignOut() {
    setSigningOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      clearStaffSession()
      clearShiftSession()
      clearDeviceId()
      router.push("/auth")
      router.refresh()
    } finally {
      setSigningOut(false)
    }
  }

  if (step === "pin") {
    return (
      <div className="flex h-svh flex-col items-center justify-center gap-8 p-6">
        <button
          type="button"
          onClick={() => setStep("pick")}
          className="absolute top-6 left-6 flex items-center gap-1.5 text-base text-muted-foreground"
        >
          <ArrowLeftIcon className="size-5" />
          Back
        </button>
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Hi, {selected.full_name.split(" ")[0]}</h1>
          <p className={`text-base ${pinError ? "text-destructive" : "text-muted-foreground"}`}>
            {pinError ? "Wrong PIN, try again" : "Enter your PIN"}
          </p>
        </div>
        <PinPad value={pin} onChange={handlePinChange} />
      </div>
    );
  }

  return (
    <div className="flex h-svh flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Who&apos;s working?</h1>
        <p className="text-base text-muted-foreground">Tap your name, then enter your PIN</p>
      </div>

      <div className="flex w-full max-w-md flex-col gap-3">
        {isLoading
          ? [0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-4 rounded-2xl border border-border p-4">
                <Skeleton className="size-14 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))
          : (employees ?? []).map((employee) => {
              const isSelected = selected?.id === employee.id
              return (
                <button
                  key={employee.id}
                  type="button"
                  onClick={() => pick(employee)}
                  className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition-colors ${
                    isSelected
                      ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
                      : "border-border hover:bg-muted active:bg-muted"
                  }`}
                >
                  <div
                    className={`flex size-14 shrink-0 items-center justify-center rounded-full text-xl font-semibold text-white ${avatarColorFor(employee.id)}`}
                  >
                    {employee.full_name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold">{employee.full_name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {ROLE_BLURBS[employee.role] ?? employee.role}
                    </p>
                  </div>
                  <CheckCircle2Icon
                    className={`size-6 shrink-0 ${
                      isSelected ? "text-emerald-600" : "text-transparent"
                    }`}
                  />
                </button>
              );
            })}
      </div>

      {!isLoading && employees?.length === 0 && (
        <p className="max-w-sm text-center text-base text-muted-foreground">
          No active staff yet. Add employees (and give them PINs) from the back office.
        </p>
      )}

      <button
        type="button"
        onClick={() => setSignOutOpen(true)}
        className="absolute bottom-6 text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        Sign this device out completely
      </button>

      <Dialog open={signOutOpen} onOpenChange={setSignOutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign this device out?</DialogTitle>
            <DialogDescription>
              {hasOpenShift
                ? "There's still an open shift on this device. Sign back in and close it first — signing out now would leave the drawer uncounted."
                : "This device will need the owner's email and password to be set up again. You don't need this to hand the till to someone else — just tap their name."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSignOutOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={hasOpenShift || signingOut}
              onClick={handleFullSignOut}
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
