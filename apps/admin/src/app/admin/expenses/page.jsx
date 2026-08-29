"use client"

import { useEffect, useMemo, useState } from "react"
import { SearchIcon } from "lucide-react"

import { createClient } from "@lenzro/supabase/client"
import { notifyError } from "@/lib/errors"
import { fetchShiftExpenses } from "@/lib/real-expenses-data"
import { formatCurrency } from "@/lib/currency"
import { resolveDateRange } from "@/lib/sales-query"
import { AdminPageHeader } from "@/components/admin-page-header"
import { Card, CardContent } from "@/components/ui/card"
import { DatePicker } from "@/components/date-picker"
import { EmployeePicker } from "@/components/employee-picker"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function Page() {
  const [supabase] = useState(() => createClient())
  const [loading, setLoading] = useState(true)
  const [expenses, setExpenses] = useState([])
  const [employeeOptions, setEmployeeOptions] = useState([])

  const [dateFilter, setDateFilter] = useState({ mode: "single", value: new Date() })
  const [employeeIds, setEmployeeIds] = useState([])
  const [search, setSearch] = useState("")

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      const { data, error } = await fetchShiftExpenses(supabase)
      if (cancelled) return

      if (error) {
        notifyError(error, "Couldn't load expenses")
        setLoading(false)
        return
      }

      const employees = [...new Map(data.map((e) => [e.employeeId, e.employeeName])).entries()].map(
        ([id, name]) => ({ id, name })
      )

      setExpenses(data)
      setEmployeeOptions(employees)
      setEmployeeIds(employees.map((e) => e.id))
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    const { start, end } = resolveDateRange(dateFilter)
    const query = search.trim().toLowerCase()

    return expenses
      .filter((e) => e.timestamp >= start && e.timestamp <= end)
      .filter((e) => employeeIds.length === 0 || employeeIds.includes(e.employeeId))
      .filter((e) => !query || e.note.toLowerCase().includes(query) || e.employeeName.toLowerCase().includes(query))
  }, [expenses, dateFilter, employeeIds, search])

  const total = filtered.reduce((sum, e) => sum + e.amount, 0)

  return (
    <>
      <AdminPageHeader crumbs={[{ label: "Reports" }, { label: "Expenses" }]} />
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 px-4">
          <DatePicker value={dateFilter} onChange={setDateFilter} />
          <EmployeePicker value={employeeIds} onChange={setEmployeeIds} options={employeeOptions} />
          <div className="relative ml-auto w-56">
            <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search reason or employee"
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {!loading && (
            <Card className="bg-background">
              <CardContent className="px-2 sm:p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Made by</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                          No expenses logged for this period.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell className="text-muted-foreground">
                            {expense.timestamp.toLocaleString("en-KE", {
                              day: "numeric",
                              month: "short",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </TableCell>
                          <TableCell className="font-medium text-foreground">{expense.employeeName}</TableCell>
                          <TableCell className="text-muted-foreground">{expense.note || "—"}</TableCell>
                          <TableCell className="text-right font-medium text-foreground">
                            {formatCurrency(expense.amount)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                  {filtered.length > 0 && (
                    <tfoot>
                      <TableRow>
                        <TableCell colSpan={3} className="font-medium text-foreground">
                          Total
                        </TableCell>
                        <TableCell className="text-right font-semibold text-foreground">
                          {formatCurrency(total)}
                        </TableCell>
                      </TableRow>
                    </tfoot>
                  )}
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
