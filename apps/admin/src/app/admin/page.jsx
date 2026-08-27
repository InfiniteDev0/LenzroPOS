"use client"

import { useMemo, useState } from "react"
import { DownloadIcon } from "lucide-react"

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
import { EMPLOYEES } from "@/lib/employees"
import { mockTransactions } from "@/lib/mock-transactions"
import { computeSalesOverview } from "@/lib/sales-query"

export default function Page() {
  const [dateFilter, setDateFilter] = useState({ mode: "single", value: new Date() })
  const [timeFilter, setTimeFilter] = useState({ mode: "all-day", start: "00:00", end: "23:00" })
  const [employeeIds, setEmployeeIds] = useState(EMPLOYEES.map((employee) => employee.id))
  const [salesFilter, setSalesFilter] = useState("summary")

  const { chartData, metrics, seriesGranularity, transactions } = useMemo(
    () => computeSalesOverview(mockTransactions, { dateFilter, timeFilter, employeeIds }),
    [dateFilter, timeFilter, employeeIds]
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
          <EmployeePicker value={employeeIds} onChange={setEmployeeIds} />
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
          {salesFilter === "summary" && (
            <SalesOverviewChart
              chartData={chartData}
              metrics={metrics}
              seriesGranularity={seriesGranularity} />
          )}
          {salesFilter === "item" && (
            <SalesByItemView
              transactions={transactions}
              chartData={chartData}
              seriesGranularity={seriesGranularity} />
          )}
          {salesFilter === "category" && <SalesByCategoryTable transactions={transactions} />}
          {salesFilter === "employee" && <SalesByEmployeeTable transactions={transactions} />}
          {salesFilter === "payment" && <SalesByPaymentTable transactions={transactions} />}
          {salesFilter === "discounts" && <DiscountsTable transactions={transactions} />}
        </div>
      </div>
    </>
  );
}
