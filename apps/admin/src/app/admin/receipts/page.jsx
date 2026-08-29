"use client"

import { useEffect, useMemo, useState } from "react"
import { DownloadIcon, PrinterIcon, SearchIcon } from "lucide-react"

import { createClient } from "@lenzro/supabase/client"
import { notifyError } from "@/lib/errors"
import { fetchRealTransactions } from "@/lib/real-sales-data"
import { AdminPageHeader } from "@/components/admin-page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/date-picker"
import { EmployeePicker } from "@/components/employee-picker"
import { MultiSelectFilter } from "@/components/multi-select-filter"
import { ReceiptsTable } from "@/components/receipts-table"
import { TimeRangePicker } from "@/components/time-range-picker"
import { exportTransactionsCsv } from "@/lib/export-csv"
import { printReceipts } from "@/lib/print-receipts"
import { defaultReceiptSettings, fetchReceiptSettings } from "@/lib/receipt-settings"
import { filterTransactions, resolveDateRange } from "@/lib/sales-query"

export default function Page() {
  const [supabase] = useState(() => createClient())
  const [loading, setLoading] = useState(true)
  const [allTransactions, setAllTransactions] = useState([])
  const [employeeOptions, setEmployeeOptions] = useState([])
  const [categoryOptions, setCategoryOptions] = useState([])
  const [itemNameOptions, setItemNameOptions] = useState([])
  const [paymentMethodOptions, setPaymentMethodOptions] = useState([])

  const [dateFilter, setDateFilter] = useState({ mode: "single", value: new Date() })
  const [timeFilter, setTimeFilter] = useState({ mode: "all-day", start: "00:00", end: "23:00" })
  const [employeeIds, setEmployeeIds] = useState([])
  const [categories, setCategories] = useState([])
  const [itemNames, setItemNames] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  // Loaded up front so printing stays synchronous with the click — see
  // printReceipts for why an await there would trip popup blockers.
  const [receiptSettings, setReceiptSettings] = useState(defaultReceiptSettings)

  useEffect(() => {
    fetchReceiptSettings(supabase)
      .then(setReceiptSettings)
      .catch(() => {})
  }, [supabase])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      const { data, error } = await fetchRealTransactions(supabase)
      if (cancelled) return

      if (error) {
        notifyError(error, "Couldn't load receipts")
        setLoading(false)
        return
      }

      const employees = [...new Map(data.map((t) => [t.employeeId, t.employeeName])).entries()].map(
        ([id, name]) => ({ id, name })
      )
      const uniqueCategories = [...new Set(data.map((t) => t.category))]
      const uniqueItemNames = [...new Set(data.map((t) => t.itemName))]
      const uniquePaymentMethods = [...new Set(data.map((t) => t.paymentMethod))]

      setAllTransactions(data)
      setEmployeeOptions(employees)
      setEmployeeIds(employees.map((e) => e.id))
      setCategoryOptions(uniqueCategories)
      setCategories(uniqueCategories)
      setItemNameOptions(uniqueItemNames)
      setItemNames(uniqueItemNames)
      setPaymentMethodOptions(uniquePaymentMethods)
      setPaymentMethods(uniquePaymentMethods)
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    const range = resolveDateRange(dateFilter)
    const base = filterTransactions(allTransactions, range, timeFilter, employeeIds)
    const query = search.trim().toLowerCase()

    return base
      .filter((t) => categories.length === 0 || categories.includes(t.category))
      .filter((t) => itemNames.length === 0 || itemNames.includes(t.itemName))
      .filter((t) => paymentMethods.length === 0 || paymentMethods.includes(t.paymentMethod))
      .filter((t) => {
        if (!query) return true
        return [t.id, t.itemName, t.category, t.paymentMethod, t.employeeName ?? ""].some((field) =>
          field.toLowerCase().includes(query)
        )
      })
      .sort((a, b) => b.timestamp - a.timestamp)
  }, [allTransactions, dateFilter, timeFilter, employeeIds, categories, itemNames, paymentMethods, search])

  const selectedTransactions = useMemo(
    () => filtered.filter((t) => selectedIds.has(t.id)),
    [filtered, selectedIds]
  )

  function toggleRow(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function toggleRows(ids, shouldSelect) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const id of ids) {
        if (shouldSelect) {
          next.add(id)
        } else {
          next.delete(id)
        }
      }
      return next
    })
  }

  function handlePrint() {
    printReceipts(selectedTransactions.length > 0 ? selectedTransactions : filtered, receiptSettings)
  }

  function handleExport() {
    exportTransactionsCsv(selectedTransactions.length > 0 ? selectedTransactions : filtered)
  }

  return (
    <>
      <AdminPageHeader crumbs={[{ label: "Reports" }, { label: "Receipts" }]} />
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 px-4">
          <DatePicker value={dateFilter} onChange={setDateFilter} />
          <TimeRangePicker value={timeFilter} onChange={setTimeFilter} />
          <EmployeePicker value={employeeIds} onChange={setEmployeeIds} options={employeeOptions} />
          <MultiSelectFilter
            allLabel="All categories"
            options={categoryOptions}
            value={categories}
            onChange={setCategories} />
          <MultiSelectFilter
            allLabel="All items"
            options={itemNameOptions}
            value={itemNames}
            onChange={setItemNames} />
          <MultiSelectFilter
            allLabel="All payment methods"
            options={paymentMethodOptions}
            value={paymentMethods}
            onChange={setPaymentMethods} />
          <div className="relative ml-auto w-56">
            <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search receipts"
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button variant="outline" className="gap-2" onClick={handlePrint} disabled={filtered.length === 0}>
            <PrinterIcon />
            Print{selectedTransactions.length > 0 ? ` (${selectedTransactions.length})` : ""}
          </Button>
          <Button className="gap-2" onClick={handleExport} disabled={filtered.length === 0}>
            <DownloadIcon />
            Export CSV
          </Button>
        </div>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {!loading && (
            <ReceiptsTable
              transactions={filtered}
              selectedIds={selectedIds}
              onToggleRow={toggleRow}
              onToggleRows={toggleRows}
              onPrintOne={(t) => printReceipts([t], receiptSettings)} />
          )}
        </div>
      </div>
    </>
  );
}
