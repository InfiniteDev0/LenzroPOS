"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { usePowerSync, useQuery, useStatus } from "@powersync/react"
import {
  ArrowRightIcon,
  BookUserIcon,
  CreditCardIcon,
  ClipboardListIcon,
  CupSodaIcon,
  LockIcon,
  LogOutIcon,
  MinusIcon,
  PlusIcon,
  PrinterIcon,
  ReceiptTextIcon,
  SearchIcon,
  ShoppingBagIcon,
  UsersIcon,
  SmartphoneIcon,
  TagIcon,
  Trash2Icon,
  WalletIcon,
  WifiOffIcon,
} from "lucide-react"

import { createClient } from "@lenzro/supabase/client"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/currency"
import { notifyError } from "@/lib/errors"
import { printTicket } from "@/lib/print-ticket"
import { computeDiscountAmount } from "@/lib/discounts"
import { getDeviceId, getShiftSession, isLocked, setLocked } from "@/lib/pos-session"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { VariantPickerDialog } from "@/components/variant-picker-dialog"
import { DeviceSetup } from "@/components/device-setup"
import { ShiftStart } from "@/components/shift-start"
import { LockScreen } from "@/components/lock-screen"
import { LogExpenseDialog } from "@/components/log-expense-dialog"
import { ShiftCloseDialog } from "@/components/shift-close-dialog"
import { CustomerField } from "@/components/customer-field"
import { DiscountPickerDialog } from "@/components/discount-picker-dialog"
import { TicketsView } from "@/components/tickets-view"
import { ExpensesView } from "@/components/expenses-view"
import { CustomersView } from "@/components/customers-view"

const PAYMENT_METHODS = [
  { id: "cash", label: "Cash", icon: WalletIcon },
  { id: "card", label: "Card", icon: CreditCardIcon },
  { id: "mobile", label: "Mobile", icon: SmartphoneIcon },
]

const ORDER_TYPES = [
  { id: "dine_in", label: "Dine In" },
  { id: "takeaway", label: "Take Away" },
  { id: "delivery", label: "Delivery" },
]

function cartKey(itemId, variantValueId) {
  return `${itemId}:${variantValueId ?? "base"}`
}

// Reassembles the flat local tables (categories/items/item_variants/
// item_variant_values are separate synced SQLite tables, not a nested
// Postgrest embed anymore) into the same item.item_variants[].
// item_variant_values[] shape the rest of this page and
// VariantPickerDialog already expect.
function assembleItems(rawItems, rawVariants, rawValues, rawStock) {
  const valuesByVariant = new Map()
  for (const v of rawValues ?? []) {
    const list = valuesByVariant.get(v.variant_id) ?? []
    list.push({ ...v, price_override: v.price_override != null ? Number(v.price_override) : null })
    valuesByVariant.set(v.variant_id, list)
  }

  const variantsByItem = new Map()
  for (const v of rawVariants ?? []) {
    const list = variantsByItem.get(v.item_id) ?? []
    list.push({ ...v, item_variant_values: valuesByVariant.get(v.id) ?? [] })
    variantsByItem.set(v.item_id, list)
  }

  const stockByItem = new Map()
  for (const s of rawStock ?? []) {
    stockByItem.set(s.item_id, s)
  }

  return (rawItems ?? []).map((item) => {
    const stock = item.track_stock ? stockByItem.get(item.id) : null
    const isLowStock = Boolean(
      stock && stock.low_stock_threshold != null && stock.quantity <= stock.low_stock_threshold
    )
    const isOutOfStock = Boolean(stock && stock.quantity <= 0)
    return {
      ...item,
      price: Number(item.price),
      item_variants: variantsByItem.get(item.id) ?? [],
      isLowStock,
      isOutOfStock,
    };
  })
}

export default function Page() {
  const router = useRouter()
  const powersync = usePowerSync()
  const status = useStatus()
  const [supabase] = useState(() => createClient())

  // Device activation / shift / lock state — all local to this browser
  // install, read once on mount (localStorage isn't available during SSR).
  const [ready, setReady] = useState(false)
  const [deviceId, setDeviceIdState] = useState(null)
  const [shiftSession, setShiftSessionState] = useState(null)
  const [locked, setLockedState] = useState(false)
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false)
  const [closeDialogOpen, setCloseDialogOpen] = useState(false)
  const [activeView, setActiveView] = useState("order")

  useEffect(() => {
    setDeviceIdState(getDeviceId())
    setShiftSessionState(getShiftSession())
    setLockedState(isLocked())
    setReady(true)
  }, [])

  const { data: activeEmployeeRows } = useQuery(
    "SELECT pos_pin FROM employees WHERE id = ?",
    [shiftSession?.employeeId ?? ""]
  )
  const canLock = Boolean(activeEmployeeRows?.[0]?.pos_pin)

  function handleLock() {
    setLocked(true)
    setLockedState(true)
  }

  function handleUnlock() {
    setLocked(false)
    setLockedState(false)
  }

  function handleShiftClosed() {
    setShiftSessionState(null)
    setCloseDialogOpen(false)
  }

  const { data: categories } = useQuery("SELECT * FROM categories WHERE active = 1 ORDER BY name")
  const { data: rawItems } = useQuery(
    "SELECT * FROM items WHERE available_for_sale = 1 ORDER BY name"
  )
  const { data: rawVariants } = useQuery("SELECT * FROM item_variants")
  const { data: rawValues } = useQuery("SELECT * FROM item_variant_values")
  const { data: rawStock } = useQuery("SELECT * FROM stock_levels")

  const items = useMemo(
    () => assembleItems(rawItems, rawVariants, rawValues, rawStock),
    [rawItems, rawVariants, rawValues, rawStock]
  )

  // Which categories have at least one low/out-of-stock item, so the
  // category pill can flag it before the cashier even filters into it.
  const categoriesWithLowStock = useMemo(() => {
    const set = new Set()
    for (const item of items) {
      if (item.isLowStock || item.isOutOfStock) set.add(item.category_id)
    }
    return set
  }, [items])

  const itemCountByCategory = useMemo(() => {
    const map = new Map()
    for (const item of items) {
      map.set(item.category_id, (map.get(item.category_id) ?? 0) + 1)
    }
    return map
  }, [items])

  const [categoryFilter, setCategoryFilter] = useState("all")
  const [cart, setCart] = useState([])
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [checkingOut, setCheckingOut] = useState(false)
  const [variantItem, setVariantItem] = useState(null)
  const [search, setSearch] = useState("")
  const [orderType, setOrderType] = useState("dine_in")
  const [customerId, setCustomerId] = useState(null)
  const [customerName, setCustomerName] = useState("")
  const [discountType, setDiscountType] = useState(null)
  // Only meaningful once a real customer (not a walk-in) is selected —
  // "add to tab" replaces whatever cash/card/mobile is chosen below.
  const [payNow, setPayNow] = useState(true)
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false)
  const [orderResetKey, setOrderResetKey] = useState(0)

  const visibleItems = useMemo(() => {
    const byCategory =
      categoryFilter === "all" ? items : items.filter((i) => i.category_id === categoryFilter)
    const query = search.trim().toLowerCase()
    return query ? byCategory.filter((i) => i.name.toLowerCase().includes(query)) : byCategory
  }, [items, categoryFilter, search])

  function addLine(item, extra = {}) {
    const key = cartKey(item.id, extra.variant_value_id)
    setCart((prev) => {
      const existing = prev.find((line) => line.key === key)
      if (existing) {
        return prev.map((line) =>
          line.key === key ? { ...line, quantity: line.quantity + 1 } : line
        )
      }
      return [
        ...prev,
        {
          key,
          item_id: item.id,
          name: item.name,
          image_url: item.image_url ?? null,
          variant_value_id: extra.variant_value_id ?? null,
          variant_label: extra.variant_label ?? null,
          unit_price: extra.unit_price ?? item.price,
          quantity: 1,
        },
      ]
    })
  }

  function setQuantity(key, quantity) {
    setCart((prev) =>
      quantity <= 0
        ? prev.filter((line) => line.key !== key)
        : prev.map((line) => (line.key === key ? { ...line, quantity } : line))
    )
  }

  function removeLine(key) {
    setCart((prev) => prev.filter((line) => line.key !== key))
  }

  function getSimpleQuantity(itemId) {
    return cart.find((line) => line.key === cartKey(itemId, null))?.quantity ?? 0
  }

  function decrementItem(item) {
    const key = cartKey(item.id, null)
    const current = getSimpleQuantity(item.id)
    setQuantity(key, current - 1)
  }

  const subtotal = cart.reduce((sum, line) => sum + line.unit_price * line.quantity, 0)
  const tax = 0
  const discountAmount = computeDiscountAmount(discountType, cart, subtotal)
  const total = subtotal - discountAmount + tax
  const totalCount = cart.reduce((sum, line) => sum + line.quantity, 0)
  const effectivePaymentMethod = customerId && !payNow ? "tab" : paymentMethod

  // Writes go to the local SQLite database first (near-instant, works
  // offline) — PowerSyncProvider's BackendConnector uploads them to
  // Supabase in the background whenever connectivity is available.
  async function handleCheckout() {
    setCheckingOut(true)
    const orderId = crypto.randomUUID()

    try {
      await powersync.execute(
        `INSERT INTO orders
           (id, subtotal, tax, total, payment_method, shift_id, created_at,
            discount_type_id, discount_amount, customer_id, customer_name, order_type)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          subtotal,
          tax,
          total,
          effectivePaymentMethod,
          shiftSession.shiftId,
          new Date().toISOString(),
          discountType?.id ?? null,
          discountAmount,
          customerId,
          customerName || null,
          orderType,
        ]
      )

      for (const line of cart) {
        await powersync.execute(
          `INSERT INTO order_items
             (id, order_id, item_id, variant_value_id, name, variant_label, unit_price, quantity, line_total)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            crypto.randomUUID(),
            orderId,
            line.item_id,
            line.variant_value_id,
            line.name,
            line.variant_label,
            line.unit_price,
            line.quantity,
            line.unit_price * line.quantity,
          ]
        )
      }

      toast.success(
        status.connected
          ? `Order placed — ${formatCurrency(total)}`
          : `Order saved — will sync when back online (${formatCurrency(total)})`
      )
      setCart([])
      setDiscountType(null)
      setCustomerId(null)
      setCustomerName("")
      setOrderType("dine_in")
      setPayNow(true)
      setOrderResetKey((k) => k + 1)
    } catch (error) {
      notifyError(error, "Couldn't save the order")
    } finally {
      setCheckingOut(false)
    }
  }

  // Prints a bill preview of the current cart, before checkout — for
  // handing the customer a printed total to confirm, not a final receipt.
  // Doesn't touch the order/cart state at all.
  function handlePrintPreview() {
    const previewOrder = {
      id: "PREVIEW",
      created_at: new Date().toISOString(),
      subtotal,
      tax,
      total,
      payment_method: effectivePaymentMethod,
      discount_amount: discountAmount,
    }
    const previewItems = cart.map((line) => ({
      quantity: line.quantity,
      name: line.name,
      variant_label: line.variant_label,
      line_total: line.unit_price * line.quantity,
    }))
    printTicket(previewOrder, previewItems, shiftSession.employeeName)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/auth")
    router.refresh()
  }

  if (!ready) return null

  if (!deviceId) {
    return <DeviceSetup onActivated={(id) => setDeviceIdState(id)} />;
  }

  if (!shiftSession) {
    return (
      <ShiftStart
        deviceId={deviceId}
        onStarted={(session) => setShiftSessionState(session)}
      />
    );
  }

  if (locked) {
    return (
      <LockScreen
        employeeId={shiftSession.employeeId}
        employeeName={shiftSession.employeeName}
        onUnlock={handleUnlock}
      />
    );
  }

  return (
    <div className="flex h-svh flex-col overflow-hidden">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold sm:text-lg">Lenzro POS</h1>
            {!status.connected && (
              <Badge variant="outline" className="gap-1 rounded-full text-amber-700 dark:text-amber-400">
                <WifiOffIcon className="size-3" />
                Offline
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{shiftSession.employeeName}</p>
        </div>

        <div className="order-3 flex w-full items-center gap-1 overflow-x-auto rounded-lg bg-muted p-1 sm:order-0 sm:w-auto sm:overflow-visible">
          <button
            type="button"
            onClick={() => setActiveView("order")}
            className={cn(
              "flex h-11 shrink-0 items-center gap-1.5 rounded-md px-4 text-sm font-medium sm:text-base",
              activeView === "order" ? "bg-background shadow-sm" : "text-muted-foreground"
            )}
          >
            <ShoppingBagIcon className="size-4" />
            Order
          </button>
          <button
            type="button"
            onClick={() => setActiveView("tickets")}
            className={cn(
              "flex h-11 shrink-0 items-center gap-1.5 rounded-md px-4 text-sm font-medium sm:text-base",
              activeView === "tickets" ? "bg-background shadow-sm" : "text-muted-foreground"
            )}
          >
            <ClipboardListIcon className="size-4" />
            Tickets
          </button>
          <button
            type="button"
            onClick={() => setActiveView("expenses")}
            className={cn(
              "flex h-11 shrink-0 items-center gap-1.5 rounded-md px-4 text-sm font-medium sm:text-base",
              activeView === "expenses" ? "bg-background shadow-sm" : "text-muted-foreground"
            )}
          >
            <ReceiptTextIcon className="size-4" />
            Expenses
          </button>
          <button
            type="button"
            onClick={() => setActiveView("customers")}
            className={cn(
              "flex h-11 shrink-0 items-center gap-1.5 rounded-md px-4 text-sm font-medium sm:text-base",
              activeView === "customers" ? "bg-background shadow-sm" : "text-muted-foreground"
            )}
          >
            <UsersIcon className="size-4" />
            Open Tabs
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            className="size"
            onClick={() => setExpenseDialogOpen(true)}
            title="Log expense"
          >
            <ReceiptTextIcon className="size-5" />
            <p className="text-sm sm:text-lg">Expense</p>
          </Button>
          {canLock && (
            <Button variant="" className="size-11" onClick={handleLock} title="Lock screen">
              <LockIcon className="size-5" />
            </Button>
          )}
          <Button
            variant="outline"
            className="h-11 px-3 text-sm sm:px-4 sm:text-lg"
            onClick={() => setCloseDialogOpen(true)}
          >
            End shift
          </Button>
          <Button variant="ghost" className="size-11" onClick={handleLogout} title="Log out">
            <LogOutIcon className="size-5" />
          </Button>
        </div>
      </header>

      {activeView === "tickets" && (
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <TicketsView
            shiftId={shiftSession.shiftId}
            deviceId={deviceId}
            employeeName={shiftSession.employeeName}
          />
        </div>
      )}

      {activeView === "expenses" && (
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <ExpensesView shiftId={shiftSession.shiftId} />
        </div>
      )}

      {activeView === "customers" && (
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <CustomersView employeeId={shiftSession.employeeId} />
        </div>
      )}

      {activeView === "order" && (
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <main className="min-w-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
          <div className="relative">
            <SearchIcon className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search menu items"
              className="h-12 w-full rounded-full border border-border bg-card pl-11 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-emerald-600"
            />
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setCategoryFilter("all")}
              className={cn(
                "flex h-30 w-40 shrink-0 flex-col justify-between rounded-2xl border p-4 text-left transition-colors",
                categoryFilter === "all"
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-border bg-card"
              )}
            >
              <span
                className={cn(
                  "w-fit rounded-full border px-2.5 py-0.5 text-[13px] font-medium",
                  categoryFilter === "all" ? "border-white/40 text-white" : "border-border text-muted-foreground"
                )}
              >
                All items
              </span>
              <div>
                <p className="font-semibold text-2xl">Everything</p>
                <p className={cn("text-xs", categoryFilter === "all" ? "text-white/80" : "text-muted-foreground")}>
                  {items.length} items
                </p>
              </div>
            </button>
            {(categories ?? []).map((cat) => {
              const isSelected = categoryFilter === cat.id
              const needsRestock = categoriesWithLowStock.has(cat.id)
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryFilter(cat.id)}
                  className={cn(
                    "flex h-30 w-40 shrink-0 flex-col justify-between rounded-2xl border p-4 text-left transition-colors",
                    isSelected
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-border bg-card",
                  )}
                >
                  <span
                    className={cn(
                      "w-fit rounded-full border px-2.5 py-0.5 text-[13px] font-medium",
                      needsRestock
                        ? "border-transparent bg-destructive/10 text-destructive"
                        : isSelected
                          ? "border-white/40 text-white"
                          : "border-border text-muted-foreground",
                    )}
                  >
                    {needsRestock ? "Need to re-stock" : "Available"}
                  </span>
                  <div>
                    <p className="font-semibold text-2xl">{cat.name}</p>
                    <p
                      className={cn(
                        "text-xs",
                        isSelected ? "text-white/80" : "text-muted-foreground",
                      )}
                    >
                      {itemCountByCategory.get(cat.id) ?? 0} items
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {!status.hasSynced ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="gap-3 rounded-2xl border-border p-3">
                  <CardContent className="flex flex-col gap-3 p-0">
                    <Skeleton className="aspect-square rounded-xl" />
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/3" />
                      </div>
                      <Skeleton className="size-9 shrink-0 rounded-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : visibleItems.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              No items to sell yet — add some from the admin app.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {visibleItems.map((item) => {
                const hasVariants = item.item_variants?.length > 0
                const quantity = hasVariants ? 0 : getSimpleQuantity(item.id)

                return (
                  <Card key={item.id} className="gap-3 rounded-2xl border-emerald-600/40 p-3 dark:border-emerald-500/30">
                    <CardContent className="flex flex-col gap-3 p-0">
                      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                        {item.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.image_url} alt="" className="size-full object-cover" />
                        ) : (
                          <CupSodaIcon className="size-8 text-emerald-600/60" />
                        )}
                        {(item.isOutOfStock || item.isLowStock) && (
                          <span
                            className={cn(
                              "absolute top-1.5 left-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium",
                              item.isOutOfStock
                                ? "bg-destructive text-white"
                                : "bg-amber-500 text-white"
                            )}
                          >
                            {item.isOutOfStock ? "Out of stock" : "Low stock"}
                          </span>
                        )}
                        {quantity > 0 && (
                          <span className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-semibold text-white">
                            {quantity}
                          </span>
                        )}
                      </div>

                      {hasVariants ? (
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">{formatCurrency(item.price)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setVariantItem(item)}
                            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-emerald-600 text-emerald-700 dark:text-emerald-400"
                          >
                            <PlusIcon className="size-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">{formatCurrency(item.price)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => addLine(item)}
                            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                          >
                            <PlusIcon className="size-4" />
                          </button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </main>

        <aside className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto border-t border-border bg-background p-4 lg:max-w-sm lg:flex-none lg:border-t-0 lg:border-l">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-xl">Current Order</h2>
              <p className="text-sm text-muted-foreground">
                {totalCount === 0 ? "No items yet" : `${totalCount} item${totalCount > 1 ? "s" : ""}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveView("tickets")}
              className="flex size-12 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground"
              title="View tickets"
            >
              <ClipboardListIcon className="size-6" />
            </button>
          </div>

          <div className="mb-3 grid grid-cols-3  rounded-full bg-muted p-1">
            {ORDER_TYPES.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setOrderType(id)}
                className={cn(
                  "rounded-full py-2 text-md font-medium transition-colors",
                  orderType === id ? "bg-emerald-600 text-white" : "text-muted-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mb-3">
            <CustomerField
              key={orderResetKey}
              customerId={customerId}
              customerName={customerName}
              employeeId={shiftSession.employeeId}
              onChange={({ customerId: id, customerName: name }) => {
                setCustomerId(id)
                setCustomerName(name)
                if (!id) setPayNow(true)
              }}
            />
          </div>

          <div className="min-h-70 flex-1 space-y-2.5 rounded-2xl border border-border bg-card p-3">
            {cart.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Tap a menu item to add it here.
              </p>
            )}
            {cart.map((line) => (
              <div key={line.key} className="flex items-center gap-3 rounded-xl border border-border p-2.5 text-sm">
                <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                  {line.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={line.image_url} alt="" className="size-full object-cover" />
                  ) : (
                    <CupSodaIcon className="size-4 text-emerald-600/60" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{line.name}</p>
                  {line.variant_label && (
                    <p className="truncate text-xs text-muted-foreground">{line.variant_label}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(line.unit_price)} × {line.quantity}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setQuantity(line.key, line.quantity - 1)}
                    className="flex size-6 items-center justify-center rounded-full border border-border text-muted-foreground"
                  >
                    <MinusIcon className="size-3" />
                  </button>
                  <span className="w-4 text-center font-medium">{line.quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(line.key, line.quantity + 1)}
                    className="flex size-6 items-center justify-center rounded-full bg-emerald-600 text-white"
                  >
                    <PlusIcon className="size-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeLine(line.key)}
                    className="flex size-6 items-center justify-center rounded-full text-destructive hover:bg-destructive/10"
                  >
                    <Trash2Icon className="size-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3 pt-4">
            <Button
              type="button"
              onClick={() => setDiscountDialogOpen(true)}
              className={cn(
                "flex w-full items-center justify-between rounded-xl border px-3 py-2 text-white text-md",
                discountType
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40"
                  : "border-dashed border-border text-muted-foreground hover:bg-muted"
              )}
            >
              <span className="flex items-center gap-2 text-white ">
                <TagIcon className="size-4" />
                {discountType ? discountType.name : "Add a discount"}
              </span>
              {discountType && <span className="font-medium">&minus;{formatCurrency(discountAmount)}</span>}
            </Button>

            <div className="space-y-1.5 rounded-xl bg-muted p-3 text-sm">
              <p className="pb-1 text-xs font-medium text-muted-foreground">Payment Details</p>
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Discount</span>
                  <span>&minus;{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-1.5 text-base font-semibold text-foreground">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            {customerId && (
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
                <button
                  type="button"
                  onClick={() => setPayNow(true)}
                  className={cn(
                    "rounded-lg py-2 text-xs font-medium",
                    payNow ? "bg-background shadow-sm" : "text-muted-foreground"
                  )}
                >
                  Pay now
                </button>
                <button
                  type="button"
                  onClick={() => setPayNow(false)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium",
                    !payNow ? "bg-emerald-600 text-white" : "text-muted-foreground"
                  )}
                >
                  <BookUserIcon className="size-3.5" />
                  Add to {customerName || "their"} tab
                </button>
              </div>
            )}

            <div
              className={cn("grid grid-cols-3 gap-2", customerId && !payNow && "pointer-events-none opacity-40")}
            >
              {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPaymentMethod(id)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border py-2.5 text-xs font-medium",
                    paymentMethod === id
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40"
                      : "border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="h-12 gap-2 rounded-full"
                disabled={cart.length === 0}
                onClick={handlePrintPreview}
              >
                <PrinterIcon className="size-4" />
                Print
              </Button>
              <Button
                className="h-12 flex-1 gap-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-600/90"
                disabled={cart.length === 0 || checkingOut}
                onClick={handleCheckout}
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-white/20">
                  <ArrowRightIcon className="size-3.5" />
                </span>
                {checkingOut ? "Placing order…" : `Place order — ${formatCurrency(total)}`}
              </Button>
            </div>
          </div>
        </aside>
      </div>
      )}

      <VariantPickerDialog
        key={variantItem?.id ?? "none"}
        item={variantItem}
        open={!!variantItem}
        onOpenChange={(open) => !open && setVariantItem(null)}
        onConfirm={(extra) => {
          addLine(variantItem, extra)
          setVariantItem(null)
        }}
      />

      <LogExpenseDialog
        shiftId={shiftSession.shiftId}
        open={expenseDialogOpen}
        onOpenChange={setExpenseDialogOpen}
      />

      <ShiftCloseDialog
        shiftId={shiftSession.shiftId}
        open={closeDialogOpen}
        onOpenChange={setCloseDialogOpen}
        onClosed={handleShiftClosed}
      />

      <DiscountPickerDialog
        open={discountDialogOpen}
        onOpenChange={setDiscountDialogOpen}
        selectedId={discountType?.id ?? null}
        onSelect={setDiscountType}
      />
    </div>
  );
}
