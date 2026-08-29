"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@powersync/react"
import { CreditCardIcon, PrinterIcon, SmartphoneIcon, WalletIcon } from "lucide-react"

import { formatCurrency } from "@/lib/currency"
import { printTicket } from "@/lib/print-ticket"
import { useAccountSettings } from "@/lib/use-settings"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const PAYMENT_ICONS = { cash: WalletIcon, card: CreditCardIcon, mobile: SmartphoneIcon };

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("en-KE", { hour: "numeric", minute: "2-digit" });
}

function TicketCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-5">
        <Skeleton className="size-11 shrink-0 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3.5 w-1/4" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </CardContent>
    </Card>
  );
}

function formatShiftLabel(shift, isCurrent) {
  const date = new Date(shift.opened_at).toLocaleDateString("en-KE", { day: "numeric", month: "short" })
  const time = formatTime(shift.opened_at)
  return isCurrent ? `Current shift · ${time}` : `${date} · ${time}`;
}

// A cashier who thinks they made a counting mistake needs to be able to
// check past shifts, not just the one they're on — same reasoning behind
// why shift records lock at close (see IMPROVISING_LOG.md): this view is
// read-only, it never lets anyone edit what already happened.
export function TicketsView({ shiftId, deviceId, employeeName }) {
  const [openOrderId, setOpenOrderId] = useState(null)
  const [selectedShiftId, setSelectedShiftId] = useState(shiftId)
  const { receipt } = useAccountSettings()

  // With Shifts turned off in Settings > Features there are no shifts to
  // group by, so tickets fall back to today's orders — the cashier still
  // needs to find the sale they just rang up.
  const shiftless = !shiftId

  const { data: recentShifts } = useQuery(
    `SELECT * FROM shifts WHERE pos_device_id = ?
     ORDER BY opened_at DESC LIMIT 15`,
    [deviceId]
  )

  const viewingShift = (recentShifts ?? []).find((s) => s.id === selectedShiftId)
  const isCurrent = selectedShiftId === shiftId

  const { data: orders, isLoading: ordersLoading } = useQuery(
    shiftless
      ? `SELECT * FROM orders WHERE date(created_at) = date('now', 'localtime')
         ORDER BY created_at DESC`
      : "SELECT * FROM orders WHERE shift_id = ? ORDER BY created_at DESC",
    shiftless ? [] : [selectedShiftId]
  )
  const { data: allItems } = useQuery(
    shiftless
      ? `SELECT order_items.* FROM order_items
         INNER JOIN orders ON orders.id = order_items.order_id
         WHERE date(orders.created_at) = date('now', 'localtime')`
      : `SELECT order_items.* FROM order_items
         INNER JOIN orders ON orders.id = order_items.order_id
         WHERE orders.shift_id = ?`,
    shiftless ? [] : [selectedShiftId]
  )

  const itemsByOrder = useMemo(() => {
    const map = new Map()
    for (const item of allItems ?? []) {
      const list = map.get(item.order_id) ?? []
      list.push(item)
      map.set(item.order_id, list)
    }
    return map
  }, [allItems])

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold lg:text-2xl">Tickets</h2>
          <p className="text-sm text-muted-foreground lg:text-base">
            {shiftless
              ? "Orders rung up today"
              : isCurrent
                ? "Orders rung up this shift"
                : "Reviewing a past shift"}
          </p>
        </div>
        {!shiftless && (
        <Select value={selectedShiftId} onValueChange={setSelectedShiftId}>
          <SelectTrigger className="h-11 w-56 text-sm">
            <SelectValue>
              {(value) => {
                const shift = (recentShifts ?? []).find((s) => s.id === value)
                return shift ? formatShiftLabel(shift, value === shiftId) : "Select shift"
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {(recentShifts ?? []).map((shift) => (
              <SelectItem key={shift.id} value={shift.id}>
                {formatShiftLabel(shift, shift.id === shiftId)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        )}
      </div>

      {viewingShift && !isCurrent && viewingShift.status === "closed" && (
        <Card>
          <CardContent className="grid grid-cols-2 gap-x-6 gap-y-3 p-5 text-base sm:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Opening float</p>
              <p className="font-medium">{formatCurrency(viewingShift.opening_float)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expected cash</p>
              <p className="font-medium">{formatCurrency(viewingShift.expected_cash)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Counted</p>
              <p className="font-medium">{formatCurrency(viewingShift.closing_cash_counted)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Discrepancy</p>
              <p
                className={`font-medium ${
                  viewingShift.discrepancy === 0
                    ? "text-emerald-600"
                    : viewingShift.discrepancy > 0
                      ? "text-sky-600"
                      : "text-destructive"
                }`}
              >
                {viewingShift.discrepancy > 0 ? "+" : ""}
                {formatCurrency(viewingShift.discrepancy)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {ordersLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <TicketCardSkeleton key={i} />)}
        </div>
      )}

      {!ordersLoading && orders?.length === 0 && (
        <p className="py-16 text-center text-base text-muted-foreground">
          {shiftless ? "No orders yet today." : "No orders on this shift."}
        </p>
      )}

      {(orders ?? []).map((order) => {
        const items = itemsByOrder.get(order.id) ?? []
        const isOpen = openOrderId === order.id
        const Icon = PAYMENT_ICONS[order.payment_method] ?? WalletIcon

        return (
          <Card key={order.id}>
            <CardContent
              className="flex cursor-pointer items-center justify-between gap-3 p-5"
              onClick={() => setOpenOrderId(isOpen ? null : order.id)}
            >
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-full bg-muted">
                  <Icon className="size-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-base font-medium">Order #{order.id.slice(0, 8)}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatTime(order.created_at)} · {items.length} item{items.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="rounded-full text-sm">
                  {formatCurrency(order.total)}
                </Badge>
              </div>
            </CardContent>

            {isOpen && (
              <div className="space-y-3 border-t border-border p-5 pt-4">
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-base">
                      <span>
                        {item.quantity}&times; {item.name}
                        {item.variant_label && (
                          <span className="text-muted-foreground"> ({item.variant_label})</span>
                        )}
                      </span>
                      <span className="text-muted-foreground">{formatCurrency(item.line_total)}</span>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  className="h-11 gap-2 px-4"
                  onClick={() => printTicket(order, items, employeeName, receipt)}
                >
                  <PrinterIcon className="size-4" />
                  Print receipt
                </Button>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
