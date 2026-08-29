"use client"

import { useState } from "react"
import { usePowerSync, useQuery } from "@powersync/react"
import { ChevronDownIcon, UserIcon, XIcon } from "lucide-react"
import { toast } from "sonner"

import { formatCurrency } from "@/lib/currency"
import { notifyError } from "@/lib/errors"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// A real customer (picked from the list) unlocks "Add to tab" at checkout
// and shows their running balance below, with a way to log a payment
// against it — a cashier or the owner can both do this, independent of
// ringing up a new order. Typing a name with no match, or leaving it as
// "Walk-in customer", keeps the order a free-text walk-in with no tab.
export function CustomerField({ customerId, customerName, employeeId, onChange }) {
  const powersync = usePowerSync()
  const [query, setQuery] = useState(customerName)
  const [focused, setFocused] = useState(false)
  const [loggingPayment, setLoggingPayment] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [saving, setSaving] = useState(false)

  const { data: browseList } = useQuery("SELECT * FROM customers ORDER BY name LIMIT 6")
  const { data: searchMatches } = useQuery(
    query.trim().length > 0
      ? "SELECT * FROM customers WHERE name LIKE ? ORDER BY name LIMIT 6"
      : "SELECT * FROM customers WHERE 0 LIMIT 0",
    query.trim().length > 0 ? [`%${query.trim()}%`] : []
  )
  const matches = query.trim().length > 0 ? searchMatches : browseList

  const { data: takenRows } = useQuery(
    "SELECT COALESCE(SUM(total), 0) as taken FROM orders WHERE customer_id = ? AND payment_method = 'tab'",
    [customerId ?? ""]
  )
  const { data: paidRows } = useQuery(
    "SELECT COALESCE(SUM(amount), 0) as paid FROM customer_payments WHERE customer_id = ?",
    [customerId ?? ""]
  )
  const owed = (takenRows?.[0]?.taken ?? 0) - (paidRows?.[0]?.paid ?? 0)

  function handleInputChange(value) {
    setQuery(value)
    onChange({ customerId: null, customerName: value })
  }

  function pickCustomer(customer) {
    setQuery(customer.name)
    onChange({ customerId: customer.id, customerName: customer.name })
    setFocused(false)
  }

  function pickWalkIn() {
    setQuery("")
    onChange({ customerId: null, customerName: "" })
    setFocused(false)
  }

  function clear() {
    setQuery("")
    onChange({ customerId: null, customerName: "" })
  }

  async function handleLogPayment(e) {
    e.preventDefault()
    const amount = e.clearAmount ?? Number(paymentAmount)
    if (!amount || amount <= 0) return

    setSaving(true)
    try {
      await powersync.execute(
        "INSERT INTO customer_payments (id, customer_id, amount, created_at, recorded_by_employee_id) VALUES (?, ?, ?, ?, ?)",
        [crypto.randomUUID(), customerId, amount, new Date().toISOString(), employeeId]
      )
      toast.success(`Logged ${formatCurrency(amount)} payment`)
      setPaymentAmount("")
      setLoggingPayment(false)
    } catch (error) {
      notifyError(error, "Couldn't log the payment")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <UserIcon className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="Walk-in customer"
          className="h-9 pr-8 pl-8 text-sm"
        />
        {query ? (
          <button
            type="button"
            onClick={clear}
            className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <XIcon className="size-3.5" />
          </button>
        ) : (
          <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        )}
      </div>
      {focused && (
        <div className="absolute top-full z-10 mt-1 w-full rounded-lg border border-border bg-card p-1 shadow-md">
          {query.trim().length === 0 && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={pickWalkIn}
              className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-muted"
            >
              <span className="text-muted-foreground">Walk-in customer</span>
              {!customerId && <span className="text-xs text-emerald-600">Selected</span>}
            </button>
          )}
          {(matches ?? []).map((customer) => (
            <button
              key={customer.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pickCustomer(customer)}
              className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-muted"
            >
              <span>{customer.name}</span>
              {customerId === customer.id && (
                <span className="text-xs text-emerald-600">Selected</span>
              )}
            </button>
          ))}
          {query.trim().length > 0 && matches?.length === 0 && (
            <p className="px-2.5 py-1.5 text-xs text-muted-foreground">
              No match — this will be a walk-in named &quot;{query.trim()}&quot;.
            </p>
          )}
        </div>
      )}

      {customerId && (
        <div className="mt-2 rounded-lg border border-border bg-muted/50 p-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              Tab balance: <span className={owed > 0 ? "font-medium text-rose-600" : "font-medium text-foreground"}>{formatCurrency(owed)}</span>
            </span>
            {owed > 0 && !loggingPayment && (
              <button
                type="button"
                onClick={() => setLoggingPayment(true)}
                className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
              >
                Log payment
              </button>
            )}
          </div>
          {loggingPayment && (
            <form onSubmit={handleLogPayment} className="mt-2 flex gap-1.5">
              <Input
                type="number"
                step="0.01"
                min="0"
                autoFocus
                placeholder={`Up to ${formatCurrency(owed)}`}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="h-7 text-xs"
              />
              <Button type="submit" size="sm" disabled={saving} className="h-7 shrink-0 bg-emerald-600 px-2 text-xs hover:bg-emerald-600/90">
                Log
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={saving}
                className="h-7 shrink-0 px-2 text-xs"
                onClick={() => handleLogPayment({ preventDefault() {}, clearAmount: owed })}
              >
                Clear tab
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
