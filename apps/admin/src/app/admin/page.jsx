"use client"

import { useEffect, useMemo, useState } from "react"
import { DownloadIcon } from "lucide-react"

import { createClient } from "@lenzro/supabase/client"
import { notifyError } from "@/lib/errors"
import { fetchRealTransactions } from "@/lib/real-sales-data"
import { AdminPageHeader } from "@/components/admin-page-header"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/date-picker"
import { DiscountsTable } from "@/components/discounts-table"
import { EmployeePicker } from "@/components/employee-picker"
import { SalesByCategoryTable } from "@/components/sales-by-category-table"
import { SalesByEmployeeTable } from "@/components/sales-by-employee-table"
import { SalesByItemView } from "@/components/sales-by-item-view"
import { SalesByPaymentTable } from "@/components/sales-by-payment-table"
import { SalesFilter } from "@/components/sales-filter"
import { SalesOverviewChart } from "@/components/sales-overview-chart"
import { TimeRangePicker } from "@/components/time-range-picker"
import { computeSalesOverview } from "@/lib/sales-query"

export default function Page() {
  const [supabase] = useState(() => createClient())
  const [loading, setLoading] = useState(true)
  const [allTransactions, setAllTransactions] = useState([])
  const [employeeOptions, setEmployeeOptions] = useState([])

  const [dateFilter, setDateFilter] = useState({ mode: "single", value: new Date() })
  const [timeFilter, setTimeFilter] = useState({ mode: "all-day", start: "00:00", end: "23:00" })
  const [employeeIds, setEmployeeIds] = useState([])
  const [salesFilter, setSalesFilter] = useState("summary")

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      const { data, error } = await fetchRealTransactions(supabase)
      if (cancelled) return

      if (error) {
        notifyError(error, "Couldn't load sales data")
        setLoading(false)
        return
      }

      const employees = [...new Map(data.map((t) => [t.employeeId, t.employeeName])).entries()].map(
        ([id, name]) => ({ id, name })
      )

      setAllTransactions(data)
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

  const { chartData, metrics, seriesGranularity, transactions } = useMemo(
    () => computeSalesOverview(allTransactions, { dateFilter, timeFilter, employeeIds }),
    [allTransactions, dateFilter, timeFilter, employeeIds]
  )

  return (
    <>
      <AdminPageHeader
        crumbs={[{ label: "Reports" }, { label: "All sales" }]}
      />
      <div className="space-y-3">
        {/* filter  */}
        <div className="flex items-center gap-2 px-4">
          <DatePicker value={dateFilter} onChange={setDateFilter} />
          <TimeRangePicker value={timeFilter} onChange={setTimeFilter} />
          <EmployeePicker value={employeeIds} onChange={setEmployeeIds} options={employeeOptions} />
          <div className="ml-auto flex items-center gap-2">
            <SalesFilter value={salesFilter} onChange={setSalesFilter} />
            <Button className="gap-2">
              <DownloadIcon />
              Download sales report
            </Button>
          </div>
        </div>
        {/* report view, switches based on the sales filter */}
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {!loading && salesFilter === "summary" && (
            <SalesOverviewChart
              chartData={chartData}
              metrics={metrics}
              seriesGranularity={seriesGranularity} />
          )}
          {!loading && salesFilter === "item" && (
            <SalesByItemView
              transactions={transactions}
              chartData={chartData}
              seriesGranularity={seriesGranularity} />
          )}
          {!loading && salesFilter === "category" && <SalesByCategoryTable transactions={transactions} />}
          {!loading && salesFilter === "employee" && <SalesByEmployeeTable transactions={transactions} />}
          {!loading && salesFilter === "payment" && <SalesByPaymentTable transactions={transactions} />}
          {!loading && salesFilter === "discounts" && <DiscountsTable transactions={transactions} />}
        </div>
      </div>
    </>
  );
}
