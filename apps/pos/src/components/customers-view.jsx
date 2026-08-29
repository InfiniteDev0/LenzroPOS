"use client"

import { useMemo, useState } from "react"
import { usePowerSync, useQuery } from "@powersync/react"
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  EyeIcon,
  PhoneIcon,
  PrinterIcon,
  SearchIcon,
  Trash2Icon,
  UserIcon,
} from "lucide-react"
import { toast } from "sonner"

import { formatCurrency } from "@/lib/currency"
import { notifyError } from "@/lib/errors"
import { printTicket } from "@/lib/print-ticket"
import { logCustomerPaymentWithAllocation } from "@/lib/log-customer-payment"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const AVATAR_COLORS = ["bg-violet-500", "bg-amber-500", "bg-cyan-500", "bg-emerald-500", "bg-rose-500", "bg-indigo-500"]

function avatarColorFor(id) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function initialsOf(name) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase()
}

function formatDateTime(iso) {
  return new Date(iso).toLocaleString("en-KE", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })
}

// ---------------------------------------------------------------------
// Detail: same shape as the admin Open Tabs customer page — stat cards,
// a filterable receipts-style table of tab orders (owed ones can be
// cleared one at a time), a lump-sum log-payment/clear-tab card, and a
// payments log. Filter controls are native inputs here instead of the
// admin app's popover pickers — better suited to a touchscreen till,
// same filtering outcome.
function CustomerDetail({ customerId, employeeId, onBack }) {
  const powersync = usePowerSync()
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [employeeFilter, setEmployeeFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [paymentAmount, setPaymentAmount] = useState("")
  const [saving, setSaving] = useState(false)

  const { data: customerRows } = useQuery("SELECT * FROM customers WHERE id = ?", [customerId])
  const customer = customerRows?.[0]

  const { data: orders } = useQuery(
    `SELECT orders.*, employees.full_name as employee_name FROM orders
     LEFT JOIN shifts ON shifts.id = orders.shift_id
     LEFT JOIN employees ON employees.id = shifts.employee_id
     WHERE orders.customer_id = ? AND orders.payment_method = 'tab'
     ORDER BY orders.created_at DESC`,
    [customerId]
  )
  const { data: items } = useQuery(
    `SELECT order_items.*, categories.name as category_name FROM order_items
     LEFT JOIN items ON items.id = order_items.item_id
     LEFT JOIN categories ON categories.id = items.category_id
     WHERE order_id IN (SELECT id FROM orders WHERE customer_id = ? AND payment_method = 'tab')`,
    [customerId]
  )
  const { data: allocations } = useQuery(
    `SELECT customer_payment_allocations.* FROM customer_payment_allocations
     INNER JOIN orders ON orders.id = customer_payment_allocations.order_id
     WHERE orders.customer_id = ?`,
    [customerId]
  )
  const { data: payments } = useQuery(
    `SELECT customer_payments.*, employees.full_name as recorded_by_name FROM customer_payments
     LEFT JOIN employees ON employees.id = customer_payments.recorded_by_employee_id
     WHERE customer_id = ? ORDER BY created_at DESC`,
    [customerId]
  )

  const itemsByOrder = useMemo(() => {
    const map = new Map()
    for (const item of items ?? []) {
      const list = map.get(item.order_id) ?? []
      list.push(item)
      map.set(item.order_id, list)
    }
    return map
  }, [items])

  const allocatedByOrder = useMemo(() => {
    const map = new Map()
    for (const a of allocations ?? []) {
      map.set(a.order_id, (map.get(a.order_id) ?? 0) + a.amount)
    }
    return map
  }, [allocations])

  const ordersWithStatus = useMemo(
    () =>
      (orders ?? []).map((order) => {
        const amountPaid = allocatedByOrder.get(order.id) ?? 0
        return {
          ...order,
          amountPaid,
          remaining: Math.max(0, Math.round((order.total - amountPaid) * 100) / 100),
          isFullyPaid: amountPaid >= order.total - 0.004,
        };
      }),
    [orders, allocatedByOrder]
  )

  const rows = useMemo(() => {
    return ordersWithStatus.flatMap((order) =>
      (itemsByOrder.get(order.id) ?? []).map((item) => ({
        key: item.id,
        orderId: order.id,
        order,
        timestamp: order.created_at,
        employeeName: order.employee_name ?? "Unknown",
        itemName: item.name,
        category: item.category_name ?? "Uncategorized",
        quantity: item.quantity,
        lineTotal: item.line_total,
        isFullyPaid: order.isFullyPaid,
        remaining: order.remaining,
      }))
    );
  }, [ordersWithStatus, itemsByOrder])

  const employeeOptions = useMemo(
    () => [...new Set(rows.map((r) => r.employeeName))],
    [rows]
  )
  const categoryOptions = useMemo(() => [...new Set(rows.map((r) => r.category))], [rows])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return rows
      .filter((r) => !dateFrom || r.timestamp >= dateFrom)
      .filter((r) => !dateTo || r.timestamp <= `${dateTo}T23:59:59`)
      .filter((r) => employeeFilter === "all" || r.employeeName === employeeFilter)
      .filter((r) => categoryFilter === "all" || r.category === categoryFilter)
      .filter((r) => !query || r.itemName.toLowerCase().includes(query) || r.employeeName.toLowerCase().includes(query))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }, [rows, dateFrom, dateTo, employeeFilter, categoryFilter, search])

  const taken = ordersWithStatus.reduce((sum, o) => sum + o.total, 0)
  const paid = (payments ?? []).reduce((sum, p) => sum + p.amount, 0)
  const owed = taken - paid

  async function applyPayment(amount, targetOrderId = null) {
    setSaving(true)
    const { actualAmount, error } = await logCustomerPaymentWithAllocation(powersync, customerId, amount, {
      targetOrderId,
      recordedByEmployeeId: employeeId,
    })
    setSaving(false)

    if (error) {
      notifyError(error, "Couldn't log the payment")
      return
    }

    toast.success(
      actualAmount < amount
        ? `Only ${formatCurrency(actualAmount)} was owed — logged that instead`
        : `Logged ${formatCurrency(actualAmount)} payment`
    )
    setPaymentAmount("")
  }

  function printRow(row) {
    printTicket(
      { id: row.orderId, created_at: row.timestamp, subtotal: row.order.subtotal, tax: row.order.tax, total: row.order.total, payment_method: "tab" },
      itemsByOrder.get(row.orderId) ?? [],
      row.employeeName
    )
  }

  if (!customer) return null

  return (
    <div className="w-full space-y-5">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} className="flex size-11 items-center justify-center rounded-full border border-border text-muted-foreground">
          <ArrowLeftIcon className="size-5" />
        </button>
        <div>
          <h2 className="text-xl font-semibold lg:text-2xl">{customer.name}</h2>
          <p className="text-sm text-muted-foreground lg:text-base">{customer.phone}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Taken</p>
          <p className="text-xl font-semibold lg:text-2xl">{formatCurrency(taken)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Paid</p>
          <p className="text-xl font-semibold text-emerald-600 lg:text-2xl">{formatCurrency(paid)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Owed</p>
          <p className={`text-xl font-semibold lg:text-2xl ${owed > 0 ? "text-rose-600" : ""}`}>{formatCurrency(owed)}</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground lg:text-base">Orders on tab</p>
        <div className="flex flex-wrap gap-2">
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-11 w-44 text-sm" />
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-11 w-44 text-sm" />
          <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
            <SelectTrigger className="h-11 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All employees</SelectItem>
              {employeeOptions.map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-11 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categoryOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="relative ml-auto min-w-48 flex-1">
            <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} className="h-11 pl-9 text-sm" />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No orders match these filters.</TableCell>
                </TableRow>
              ) : (
                filtered.map((row) => (
                  <TableRow key={row.key}>
                    <TableCell className="py-3 text-base text-muted-foreground">{formatDateTime(row.timestamp)}</TableCell>
                    <TableCell className="py-3 text-base">{row.employeeName}</TableCell>
                    <TableCell className="py-3 text-base">
                      {row.quantity}&times; {row.itemName}
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge variant="outline" className={row.isFullyPaid ? "text-emerald-600" : "text-rose-600"}>
                        {row.isFullyPaid ? "Cleared" : "Owed"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-right text-base font-medium">{formatCurrency(row.lineTotal)}</TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => printRow(row)} className="flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted">
                          <PrinterIcon className="size-4" />
                        </button>
                        {!row.isFullyPaid && (
                          <button
                            type="button"
                            onClick={() => applyPayment(row.remaining, row.orderId)}
                            title="Clear this receipt"
                            className="flex size-10 items-center justify-center rounded-full text-emerald-600 hover:bg-muted"
                          >
                            <CheckCircle2Icon className="size-4" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {owed > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
          <p className="mr-auto text-base font-medium">Log a payment</p>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder={`Up to ${formatCurrency(owed)}`}
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            className="h-11 w-44 text-base"
          />
          <Button disabled={saving || !Number(paymentAmount)} onClick={() => applyPayment(Number(paymentAmount))} className="h-11 bg-emerald-600 px-5 text-base hover:bg-emerald-600/90">
            Log payment
          </Button>
          <Button variant="outline" disabled={saving} onClick={() => applyPayment(owed)} className="h-11 px-5 text-base">
            Clear tab
          </Button>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground lg:text-base">Payments made</p>
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Recorded by</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(payments ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">No payments logged yet.</TableCell>
                </TableRow>
              ) : (
                payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="py-3 text-base text-muted-foreground">{formatDateTime(p.created_at)}</TableCell>
                    <TableCell className="py-3 text-base">{p.recorded_by_name ?? "Owner"}</TableCell>
                    <TableCell className="py-3 text-right text-base font-medium text-emerald-600">{formatCurrency(p.amount)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
export function CustomersView({ employeeId }) {
  const powersync = usePowerSync()
  const [search, setSearch] = useState("")
  const [selectedCustomerId, setSelectedCustomerId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data: customers, isLoading: customersLoading } = useQuery("SELECT * FROM customers ORDER BY name")
  const { data: allTaken } = useQuery(
    "SELECT customer_id, SUM(total) as taken FROM orders WHERE payment_method = 'tab' AND customer_id IS NOT NULL GROUP BY customer_id"
  )
  const { data: allPaid } = useQuery(
    "SELECT customer_id, SUM(amount) as paid FROM customer_payments GROUP BY customer_id"
  )

  const rows = useMemo(() => {
    const takenMap = new Map((allTaken ?? []).map((r) => [r.customer_id, r.taken]))
    const paidMap = new Map((allPaid ?? []).map((r) => [r.customer_id, r.paid]))
    const list = customers ?? []
    return list.map((c, index) => ({
      ...c,
      taken: takenMap.get(c.id) ?? 0,
      paid: paidMap.get(c.id) ?? 0,
      code: `CLT-${String(list.length - index).padStart(4, "0")}`,
    }));
  }, [customers, allTaken, allPaid])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return rows
    return rows.filter((c) => c.name.toLowerCase().includes(query))
  }, [rows, search])

  async function handleDelete() {
    try {
      await powersync.execute("DELETE FROM customers WHERE id = ?", [deleteTarget.id])
      toast.success(`${deleteTarget.name} removed`)
    } catch (error) {
      notifyError(error, "Couldn't delete this customer")
    } finally {
      setDeleteTarget(null)
    }
  }

  if (selectedCustomerId) {
    return (
      <CustomerDetail
        customerId={selectedCustomerId}
        employeeId={employeeId}
        onBack={() => setSelectedCustomerId(null)}
      />
    );
  }

  return (
    <div className="w-full space-y-5">
      <div>
        <h2 className="text-xl font-semibold lg:text-2xl">Open Tabs</h2>
        <p className="text-sm text-muted-foreground lg:text-base">Customers, orders, and payments</p>
      </div>

      <div className="relative max-w-xl">
        <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search customers" value={search} onChange={(e) => setSearch(e.target.value)} className="h-11 pl-9 text-base" />
      </div>

      {!customersLoading && filtered.length === 0 && (
        <p className="py-16 text-center text-base text-muted-foreground">No customers found.</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {customersLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-12 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3.5 w-1/3" />
                  </div>
                </div>
                <Skeleton className="h-14 w-full rounded-lg" />
              </CardContent>
            </Card>
          ))}
        {filtered.map((customer) => {
          const owed = customer.taken - customer.paid
          return (
            <Card key={customer.id}>
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex items-center gap-3">
                  <div className={`flex size-12 items-center justify-center rounded-full text-base font-semibold text-white ${avatarColorFor(customer.id)}`}>
                    {initialsOf(customer.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-medium">{customer.name}</p>
                    <p className="text-sm text-muted-foreground">{customer.code}</p>
                  </div>
                </div>
                {customer.phone && (
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <PhoneIcon className="size-4" />
                    {customer.phone}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-rose-50 px-3 py-2 dark:bg-rose-950/30">
                    <p className="text-xs font-medium tracking-wide text-rose-600 uppercase">Owed</p>
                    <p className="text-base font-semibold text-rose-700 dark:text-rose-400">{formatCurrency(owed)}</p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 px-3 py-2 dark:bg-emerald-950/30">
                    <p className="text-xs font-medium tracking-wide text-emerald-600 uppercase">Paid</p>
                    <p className="text-base font-semibold text-emerald-700 dark:text-emerald-400">{formatCurrency(customer.paid)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <button
                    type="button"
                    onClick={() => setSelectedCustomerId(customer.id)}
                    className="flex h-11 items-center gap-1.5 text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                  >
                    <EyeIcon className="size-4" />
                    Tap to view
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(customer)}
                    className="flex size-11 items-center justify-center rounded-full text-muted-foreground hover:text-destructive"
                  >
                    <Trash2Icon className="size-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {deleteTarget?.name}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This can&apos;t be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button className="bg-destructive text-white hover:bg-destructive/90" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
