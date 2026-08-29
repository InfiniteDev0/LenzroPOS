"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeftIcon, DownloadIcon, PencilIcon, SearchIcon } from "lucide-react"
import { toast } from "sonner"

import { createClient } from "@lenzro/supabase/client"
import { notifyError } from "@/lib/errors"
import { formatCurrency } from "@/lib/currency"
import {
  fetchCustomerById,
  fetchCustomerTabDetail,
  logCustomerPaymentWithAllocation,
} from "@/lib/real-customers-data"
import { filterTransactions, resolveDateRange } from "@/lib/sales-query"
import { exportTransactionsCsv } from "@/lib/export-csv"
import { printReceipts } from "@/lib/print-receipts"
import { AdminPageHeader } from "@/components/admin-page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CustomerDialog } from "@/components/customer-dialog"
import { DatePicker } from "@/components/date-picker"
import { EmployeePicker } from "@/components/employee-picker"
import { Input } from "@/components/ui/input"
import { MultiSelectFilter } from "@/components/multi-select-filter"
import { ReceiptsTable } from "@/components/receipts-table"
import { TimeRangePicker } from "@/components/time-range-picker"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Flattens this customer's tab orders (already fetched, allocations and
// all) into the same one-row-per-line-item "transaction" shape the
// shared ReceiptsTable/printReceipts pipeline expects — built locally
// instead of via fetchRealTransactions, since that feed only shows
// orders once fully paid (see real-sales-data.js); this page needs to
// show outstanding ones too, so they can actually be cleared.
function ordersToTransactionRows(orders) {
  return orders.flatMap((order) =>
    order.items.map((item) => ({
      id: item.id,
      orderId: order.id,
      timestamp: order.timestamp,
      employeeId: order.employeeId,
      employeeName: order.employeeName,
      itemName: item.name,
      category: item.category,
      quantity: item.quantity,
      paymentMethod: order.isFullyPaid ? "Tab (cleared)" : "Tab (owed)",
      gross: item.line_total,
      discount: 0,
      refund: 0,
      net: item.line_total,
      isFullyPaid: order.isFullyPaid,
      remaining: order.remaining,
    }))
  );
}

export default function Page() {
  const { id } = useParams()
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [customer, setCustomer] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [logging, setLogging] = useState(false)

  const [dateFilter, setDateFilter] = useState({
    mode: "range",
    value: { from: new Date(2000, 0, 1), to: new Date() },
  })
  const [timeFilter, setTimeFilter] = useState({ mode: "all-day", start: "00:00", end: "23:00" })
  const [employeeOptions, setEmployeeOptions] = useState([])
  const [categoryOptions, setCategoryOptions] = useState([])
  const [itemNameOptions, setItemNameOptions] = useState([])
  const [employeeIds, setEmployeeIds] = useState([])
  const [categories, setCategories] = useState([])
  const [itemNames, setItemNames] = useState([])
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState(() => new Set())

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function loadAll() {
    setLoading(true)
    const [{ data: customerData, error: customerError }, { data: detailData, error: detailError }] =
      await Promise.all([fetchCustomerById(supabase, id), fetchCustomerTabDetail(supabase, id)])

    if (customerError || detailError) {
      notifyError(customerError || detailError, "Couldn't load this customer")
      setLoading(false)
      return
    }

    const rows = ordersToTransactionRows(detailData.orders)
    const employees = [...new Map(rows.map((t) => [t.employeeId, t.employeeName])).entries()].map(
      ([empId, name]) => ({ id: empId, name })
    )

    setCustomer(customerData)
    setDetail(detailData)
    setEmployeeOptions(employees)
    setEmployeeIds(employees.map((e) => e.id))
    setCategoryOptions([...new Set(rows.map((t) => t.category))])
    setItemNameOptions([...new Set(rows.map((t) => t.itemName))])
    setLoading(false)
  }

  const allRows = useMemo(() => (detail ? ordersToTransactionRows(detail.orders) : []), [detail])

  const filtered = useMemo(() => {
    const range = resolveDateRange(dateFilter)
    const base = filterTransactions(allRows, range, timeFilter, employeeIds)
    const query = search.trim().toLowerCase()

    return base
      .filter((t) => categories.length === 0 || categories.includes(t.category))
      .filter((t) => itemNames.length === 0 || itemNames.includes(t.itemName))
      .filter((t) => {
        if (!query) return true
        return [t.itemName, t.category, t.employeeName ?? ""].some((field) =>
          field.toLowerCase().includes(query)
        )
      })
      .sort((a, b) => b.timestamp - a.timestamp)
  }, [allRows, dateFilter, timeFilter, employeeIds, categories, itemNames, search])

  const selectedTransactions = useMemo(
    () => filtered.filter((t) => selectedIds.has(t.id)),
    [filtered, selectedIds]
  )

  function toggleRow(rowId) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(rowId)) {
        next.delete(rowId)
      } else {
        next.add(rowId)
      }
      return next
    })
  }

  function toggleRows(ids, shouldSelect) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const rowId of ids) {
        if (shouldSelect) {
          next.add(rowId)
        } else {
          next.delete(rowId)
        }
      }
      return next
    })
  }

  function handlePrint() {
    printReceipts(selectedTransactions.length > 0 ? selectedTransactions : filtered)
  }

  function handleExport() {
    exportTransactionsCsv(selectedTransactions.length > 0 ? selectedTransactions : filtered)
  }

  async function applyPayment(amount, targetOrderId = null) {
    setLogging(true)
    const { actualAmount, error } = await logCustomerPaymentWithAllocation(supabase, id, amount, targetOrderId)
    setLogging(false)

    if (error) {
      notifyError(error, "Couldn't log the payment")
      return
    }

    if (actualAmount < amount) {
      toast.success(`Only ${formatCurrency(actualAmount)} was owed — logged that instead`)
    } else {
      toast.success(`Logged ${formatCurrency(actualAmount)} payment`)
    }
    setPaymentAmount("")
    loadAll()
  }

  function handleClearReceipt(row) {
    applyPayment(row.remaining, row.orderId)
  }

  if (loading || !customer || !detail) {
    return (
      <>
        <AdminPageHeader crumbs={[{ label: "Open Tabs" }]} />
        <div className="p-4" />
      </>
    );
  }

  const taken = detail.orders.reduce((sum, o) => sum + o.total, 0)
  const paid = detail.payments.reduce((sum, p) => sum + p.amount, 0)
  const owed = taken - paid

  return (
    <>
      <AdminPageHeader crumbs={[{ label: "Open Tabs" }, { label: customer.name }]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.push("/admin/customers")}>
            <ArrowLeftIcon className="size-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">{customer.name}</h1>
            <p className="text-sm text-muted-foreground">
              {[customer.phone, customer.email].filter(Boolean).join(" · ") || "No contact info"}
            </p>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => setEditOpen(true)}>
            <PencilIcon className="size-4" />
            Edit details
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Taken</p>
              <p className="text-xl font-semibold">{formatCurrency(taken)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Paid</p>
              <p className="text-xl font-semibold text-emerald-600">{formatCurrency(paid)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Owed</p>
              <p className={`text-xl font-semibold ${owed > 0 ? "text-rose-600" : ""}`}>
                {formatCurrency(owed)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* orders on tab — same as /admin/receipts, scoped to this customer,
            plus a per-row "Clear" action since these can still be owed */}
        <div>
          <h2 className="pb-2 text-sm font-medium text-muted-foreground">Orders on tab</h2>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
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
              <div className="relative ml-auto w-56">
                <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search this customer's receipts"
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Button variant="outline" className="gap-2" onClick={handlePrint} disabled={filtered.length === 0}>
                Print{selectedTransactions.length > 0 ? ` (${selectedTransactions.length})` : ""}
              </Button>
              <Button className="gap-2" onClick={handleExport} disabled={filtered.length === 0}>
                <DownloadIcon />
                Export CSV
              </Button>
            </div>
            <ReceiptsTable
              transactions={filtered}
              selectedIds={selectedIds}
              onToggleRow={toggleRow}
              onToggleRows={toggleRows}
              onPrintOne={(t) => printReceipts([t])}
              onClearOne={(t) => !t.isFullyPaid && handleClearReceipt(t)} />
          </div>
        </div>

        {owed > 0 && (
          <Card>
            <CardContent className="flex flex-wrap items-center gap-2 p-4">
              <p className="mr-auto text-sm font-medium">Log a payment</p>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder={`Up to ${formatCurrency(owed)}`}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-48" />
              <Button
                disabled={logging || !Number(paymentAmount)}
                onClick={() => applyPayment(Number(paymentAmount))}
                className="bg-emerald-600 hover:bg-emerald-600/90"
              >
                Log payment
              </Button>
              <Button variant="outline" disabled={logging} onClick={() => applyPayment(owed)}>
                Clear tab
              </Button>
            </CardContent>
          </Card>
        )}

        <div>
          <h2 className="pb-2 text-sm font-medium text-muted-foreground">Payments made</h2>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Recorded by</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                        No payments logged yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    detail.payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="text-muted-foreground">
                          {payment.timestamp.toLocaleString("en-KE", {
                            day: "numeric",
                            month: "short",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{payment.recordedByName}</TableCell>
                        <TableCell className="text-right font-medium text-emerald-600">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      <CustomerDialog
        customer={customer}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={async (form) => {
          const { error } = await supabase
            .from("customers")
            .update({
              name: form.name,
              email: form.email || null,
              phone: form.phone || null,
              address: form.address || null,
              city: form.city || null,
              country: form.country || null,
              id_number: form.idNumber || null,
            })
            .eq("id", id)

          if (error) {
            notifyError(error, "Couldn't save the customer")
            return
          }
          toast.success("Customer updated")
          setEditOpen(false)
          loadAll()
        }} />
    </>
  );
}
