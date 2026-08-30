"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { CircleDotIcon, RefreshCwIcon } from "lucide-react"

import { createClient } from "@lenzro/supabase/client"
import { notifyError } from "@/lib/errors"
import { formatCurrency } from "@/lib/currency"
import { fetchShifts, formatDuration } from "@/lib/real-shifts-data"
import { AdminPageHeader } from "@/components/admin-page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

function Discrepancy({ value }) {
  if (value == null) return <span className="text-muted-foreground">—</span>;
  if (value === 0) return <span className="text-emerald-600">Exact</span>;
  return (
    <span className={value > 0 ? "text-sky-600" : "text-destructive"}>
      {value > 0 ? `${formatCurrency(value)} over` : `${formatCurrency(Math.abs(value))} short`}
    </span>
  );
}

function OpenShiftBanner({ shift }) {
  return (
    <Card className="gap-0 overflow-hidden border-emerald-600/40 py-0">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-600/10 text-emerald-600">
            <CircleDotIcon className="size-5 animate-pulse" />
          </span>
          <div>
            <p className="font-medium text-foreground">
              {shift.employeeName} is on shift right now
            </p>
            <p className="text-sm text-muted-foreground">
              Open since {format(shift.openedAt, "h:mm a")} on{" "}
              {format(shift.openedAt, "d MMM")} · {formatDuration(shift.durationMs)} so far ·{" "}
              {shift.orderCount} order{shift.orderCount === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <p className="font-mono text-lg font-semibold tabular-nums">
            {formatCurrency(shift.sales)}
          </p>
          <p className="text-xs text-muted-foreground">taken so far</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Page() {
  const [supabase] = useState(() => createClient())
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    load().finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function load() {
    const { data, error } = await fetchShifts(supabase)
    if (error) notifyError(error, "Couldn't load shifts");
    else setShifts(data);
  }

  async function handleRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const openShifts = shifts.filter((s) => s.isOpen)

  return (
    <>
      <AdminPageHeader crumbs={[{ label: "Reports" }, { label: "Shifts" }]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            Every shift the till has run, newest first. A shift is one person on the drawer —
            the day&apos;s totals live under End of day.
          </p>
          <Button variant="outline" className="gap-2" disabled={refreshing} onClick={handleRefresh}>
            <RefreshCwIcon className={refreshing ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>

        {loading ? (
          <Skeleton className="h-20 w-full" />
        ) : (
          openShifts.map((shift) => <OpenShiftBanner key={shift.id} shift={shift} />)
        )}

        {/* Cards on phones, table from md — same treatment as the other
            admin lists, since nine columns is unreadable on a handset. */}
        <div className="flex flex-col gap-3 md:hidden">
          {!loading &&
            shifts.map((shift) => (
              <Card key={shift.id} className="gap-0 py-0">
                <CardContent className="flex flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{shift.employeeName}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(shift.openedAt, "d MMM, h:mm a")} &ndash;{" "}
                        {shift.closedAt ? format(shift.closedAt, "h:mm a") : "now"}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={shift.isOpen ? "shrink-0 text-emerald-600" : "shrink-0 text-muted-foreground"}>
                      {shift.isOpen ? "Open" : formatDuration(shift.durationMs)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 border-t pt-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Orders</p>
                      <p className="font-medium">{shift.orderCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Taken</p>
                      <p className="font-mono font-medium tabular-nums">
                        {formatCurrency(shift.sales)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Over / short</p>
                      <p className="font-medium">
                        <Discrepancy value={shift.discrepancy} />
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          {!loading && shifts.length === 0 && (
            <p className="py-10 text-center text-muted-foreground">
              No shifts yet — one starts when a cashier opens the till.
            </p>
          )}
        </div>

        <Card className="hidden gap-0 overflow-hidden py-0 md:block">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Who</TableHead>
                  <TableHead>Opened</TableHead>
                  <TableHead>Closed</TableHead>
                  <TableHead>Length</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Taken</TableHead>
                  <TableHead className="text-right">Expenses</TableHead>
                  <TableHead className="text-right">Counted</TableHead>
                  <TableHead className="text-right">Over / short</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [0, 1, 2].map((i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={9}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : shifts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                      No shifts yet — one starts when a cashier opens the till.
                    </TableCell>
                  </TableRow>
                ) : (
                  shifts.map((shift) => (
                    <TableRow key={shift.id}>
                      <TableCell className="font-medium text-foreground">
                        <span className="flex items-center gap-2">
                          {shift.employeeName}
                          {shift.isOpen && (
                            <Badge variant="outline" className="text-emerald-600">
                              Open
                            </Badge>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(shift.openedAt, "d MMM, h:mm a")}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {shift.closedAt ? format(shift.closedAt, "d MMM, h:mm a") : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDuration(shift.durationMs)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                        {shift.orderCount}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatCurrency(shift.sales)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                        {formatCurrency(shift.expensesTotal)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                        {shift.countedCash == null ? "—" : formatCurrency(shift.countedCash)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        <Discrepancy value={shift.discrepancy} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
