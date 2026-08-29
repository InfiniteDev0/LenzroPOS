"use client"

import { Fragment, useEffect, useState } from "react"
import { format } from "date-fns"
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react"

import { createClient } from "@lenzro/supabase/client"
import { notifyError } from "@/lib/errors"
import { formatCurrency } from "@/lib/currency"
import { fetchBusinessDays, fetchShiftsForDay } from "@/lib/real-business-days"
import { AdminPageHeader } from "@/components/admin-page-header"
import { Badge } from "@/components/ui/badge"
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
  if (value === 0) {
    return <span className="text-emerald-600">Exact</span>;
  }
  return (
    <span className={value > 0 ? "text-sky-600" : "text-destructive"}>
      {value > 0 ? `${formatCurrency(value)} over` : `${formatCurrency(Math.abs(value))} short`}
    </span>
  );
}

function ShiftBreakdown({ dayId }) {
  const [supabase] = useState(() => createClient())
  const [shifts, setShifts] = useState(null)

  useEffect(() => {
    let active = true
    fetchShiftsForDay(supabase, dayId)
      .then(({ data, error }) => {
        if (!active) return
        if (error) notifyError(error, "Couldn't load the day's shifts");
        else setShifts(data);
      })
      .catch(() => {})
    return () => {
      active = false
    };
  }, [supabase, dayId])

  if (!shifts) {
    return <Skeleton className="h-16 w-full" />;
  }

  if (shifts.length === 0) {
    return <p className="text-sm text-muted-foreground">No shifts were opened on this day.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Who</TableHead>
          <TableHead>Hours</TableHead>
          <TableHead className="text-right">Float</TableHead>
          <TableHead className="text-right">Expected</TableHead>
          <TableHead className="text-right">Counted</TableHead>
          <TableHead className="text-right">Over / short</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {shifts.map((shift) => (
          <TableRow key={shift.id}>
            <TableCell className="font-medium text-foreground">{shift.employeeName}</TableCell>
            <TableCell className="text-muted-foreground">
              {format(shift.openedAt, "h:mm a")} &ndash;{" "}
              {shift.closedAt ? format(shift.closedAt, "h:mm a") : "still open"}
            </TableCell>
            <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
              {formatCurrency(shift.openingFloat)}
            </TableCell>
            <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
              {formatCurrency(shift.expectedCash)}
            </TableCell>
            <TableCell className="text-right font-mono tabular-nums">
              {formatCurrency(shift.countedCash)}
            </TableCell>
            <TableCell className="text-right font-mono tabular-nums">
              <Discrepancy value={shift.discrepancy} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function Page() {
  const [supabase] = useState(() => createClient())
  const [days, setDays] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    let active = true
    fetchBusinessDays(supabase)
      .then(({ data, error }) => {
        if (!active) return
        if (error) notifyError(error, "Couldn't load your business days");
        else setDays(data);
        setLoading(false)
      })
      .catch(() => active && setLoading(false))
    return () => {
      active = false
    };
  }, [supabase])

  return (
    <>
      <AdminPageHeader crumbs={[{ label: "Reports" }, { label: "End of day" }]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <p className="text-sm text-muted-foreground">
          Every trading day the till has closed out. These totals were recorded at the moment the
          day was closed, so they stay exactly as they were reported — they don&apos;t shift as
          tabs get paid off later.
        </p>

        <Card className="gap-0 overflow-hidden py-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>Day</TableHead>
                  <TableHead>Closed by</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Cash</TableHead>
                  <TableHead className="text-right">Other</TableHead>
                  <TableHead className="text-right">Expenses</TableHead>
                  <TableHead className="text-right">Taken</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [0, 1, 2].map((i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={8}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : days.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                      No business days yet — one opens the first time a shift starts on the till.
                    </TableCell>
                  </TableRow>
                ) : (
                  days.map((day) => {
                    const isOpen = expandedId === day.id
                    return (
                      <Fragment key={day.id}>
                        <TableRow
                          className="cursor-pointer"
                          onClick={() => setExpandedId(isOpen ? null : day.id)}>
                          <TableCell className="text-muted-foreground">
                            {isOpen ? (
                              <ChevronDownIcon className="size-4" />
                            ) : (
                              <ChevronRightIcon className="size-4" />
                            )}
                          </TableCell>
                          <TableCell className="font-medium text-foreground">
                            {format(day.openedAt, "EEE d MMM yyyy")}
                            {day.status === "open" && (
                              <Badge variant="outline" className="ml-2 text-amber-600">
                                Still open
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {day.closedBy ?? "—"}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                            {day.orderCount}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                            {formatCurrency(day.cashSales)}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                            {formatCurrency(day.nonCashSales)}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                            {formatCurrency(day.expensesTotal)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium tabular-nums">
                            {formatCurrency(day.grossSales)}
                          </TableCell>
                        </TableRow>
                        {isOpen && (
                          <TableRow>
                            <TableCell colSpan={8} className="bg-muted/30 p-4">
                              <div className="space-y-4">
                                {day.tabSales > 0 && (
                                  <p className="text-sm text-muted-foreground">
                                    {formatCurrency(day.tabSales)} went onto customer tabs this
                                    day. That isn&apos;t counted in the total taken — it counts on
                                    the day it&apos;s paid off.
                                  </p>
                                )}
                                {day.note && (
                                  <p className="text-sm">
                                    <span className="text-muted-foreground">Note: </span>
                                    {day.note}
                                  </p>
                                )}
                                <ShiftBreakdown dayId={day.id} />
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
