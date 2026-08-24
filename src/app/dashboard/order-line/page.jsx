"use client"

import { useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Minus,
  Plus,
  Wallet,
  CreditCard,
  ScanLine,
  Printer,
  Send,
  Utensils,
  Star,
  Soup,
  Cake,
  Drumstick,
  ShoppingCart,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/currency"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  statusFilters,
  orderQueue,
  menuCategories,
  menuItems,
  defaultCartQuantities,
} from "@/lib/mock-data"

const categoryIcons = { Utensils, Star, Soup, Cake, Drumstick }

const queueTheme = {
  emerald: {
    card: "border-emerald-100 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40",
    badge: "bg-emerald-600 text-white",
  },
  rose: {
    card: "border-rose-100 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/40",
    badge: "bg-orange-500 text-white",
  },
  violet: {
    card: "border-violet-100 bg-violet-50 dark:border-violet-900 dark:bg-violet-950/40",
    badge: "bg-violet-600 text-white",
  },
}

function ScrollRow({ children }) {
  const ref = useRef(null)
  const scroll = (dir) => ref.current?.scrollBy({ left: dir * 320, behavior: "smooth" })

  return (
    <div className="relative min-w-0">
      <div ref={ref} className="flex gap-4 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none]">
        {children}
      </div>
      <button
        type="button"
        onClick={() => scroll(-1)}
        className="absolute -left-3 top-1/2 hidden size-7 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background shadow-sm md:flex"
      >
        <ChevronLeft className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => scroll(1)}
        className="absolute -right-3 top-1/2 hidden size-7 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background shadow-sm md:flex"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  )
}

function OrderQueueCard({ order }) {
  const theme = queueTheme[order.theme]
  return (
    <div className={cn("w-64 shrink-0 rounded-xl border p-4", theme.card)}>
      <div className="flex items-start justify-between">
        <p className="font-semibold">Order #{order.id}</p>
        <p className="text-sm text-muted-foreground">Table {order.table}</p>
      </div>
      <p className="mt-3 text-sm font-medium">Item: {order.items}X</p>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{order.time}</p>
        <Badge className={cn("rounded-full border-none", theme.badge)}>{order.status}</Badge>
      </div>
    </div>
  )
}

function MenuItemCard({ item, quantity, onChange }) {
  const active = quantity > 0
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-xl border p-4 text-center transition-colors",
        active ? "border-teal-600 bg-teal-50/50 dark:bg-teal-950/20" : "border-border"
      )}
    >
      <div className="flex size-16 items-center justify-center rounded-full bg-muted text-3xl">
        {item.emoji}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{item.tag}</p>
      <p className="text-sm font-medium">{item.name}</p>
      <div className="mt-2 flex w-full items-center justify-between">
        <p className="font-semibold">{formatCurrency(item.price)}</p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onChange(Math.max(0, quantity - 1))}
            disabled={quantity === 0}
            className="flex size-6 items-center justify-center rounded-full border border-border text-muted-foreground disabled:opacity-40"
          >
            <Minus className="size-3.5" />
          </button>
          <span className="w-4 text-center text-sm font-medium">{quantity}</span>
          <button
            type="button"
            onClick={() => onChange(quantity + 1)}
            className="flex size-6 items-center justify-center rounded-full bg-teal-600 text-white"
          >
            <Plus className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function OrderLinePage() {
  const [statusFilter, setStatusFilter] = useState("all")
  const [category, setCategory] = useState("all")
  const [quantities, setQuantities] = useState(defaultCartQuantities)
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [cartOpen, setCartOpen] = useState(false)

  const visibleItems = useMemo(
    () => (category === "all" ? menuItems : menuItems.filter((item) => item.category === category)),
    [category]
  )

  const cartItems = useMemo(
    () =>
      menuItems
        .filter((item) => quantities[item.id] > 0)
        .map((item) => ({ ...item, quantity: quantities[item.id] })),
    [quantities]
  )

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = subtotal * 0.05
  const serviceCharge = subtotal > 0 ? 80 : 0
  const total = subtotal + tax + serviceCharge
  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  function setQuantity(id, value) {
    setQuantities((prev) => ({ ...prev, [id]: value }))
  }

  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Order Line</h1>

        <Sheet open={cartOpen} onOpenChange={setCartOpen}>
          <SheetTrigger
            render={
              <Button className="gap-2 bg-teal-600 text-white hover:bg-teal-600/90">
                <ShoppingCart className="size-4" />
                Table 04
                <Badge variant="secondary" className="rounded-full border-none bg-white/20 text-white">
                  {String(totalCartCount).padStart(2, "0")}
                </Badge>
                <span className="hidden sm:inline">{formatCurrency(total)}</span>
              </Button>
            }
          />
          <SheetContent className="flex flex-col overflow-hidden p-0" showCloseButton={false}>
            <SheetHeader className="border-b border-border">
              <div className="flex items-start justify-between">
                <div>
                  <SheetTitle>Table No #04</SheetTitle>
                  <SheetDescription>Order #F0030</SheetDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full">
                    2 People
                  </Badge>
                  <button className="flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground">
                    <Pencil className="size-3.5" />
                  </button>
                  <button className="flex size-7 items-center justify-center rounded-md border border-border text-destructive hover:bg-destructive/10">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </SheetHeader>

            <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Ordered Items</h3>
                  <span className="text-sm text-muted-foreground">
                    {String(totalCartCount).padStart(2, "0")}
                  </span>
                </div>

                <div className="mt-3 space-y-2.5">
                  {cartItems.length === 0 && (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      Tap the + on a dish to add it to this order.
                    </p>
                  )}
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.quantity}x <span className="text-foreground">{item.name}</span>
                      </span>
                      <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 border-t border-border pt-4 text-sm">
                <h3 className="mb-1 font-semibold">Payment Summary</h3>
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax (5%)</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Service Charge</span>
                  <span>{formatCurrency(serviceCharge)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="font-semibold">Total Payable</span>
                <span className="text-lg font-semibold">{formatCurrency(total)}</span>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold">Payment Method</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "cash", label: "Cash", icon: Wallet },
                    { id: "card", label: "Card", icon: CreditCard },
                    { id: "scan", label: "Scan", icon: ScanLine },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setPaymentMethod(id)}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-lg border py-2 text-xs font-medium",
                        paymentMethod === id
                          ? "border-teal-600 bg-teal-50 text-teal-700 dark:bg-teal-950/40"
                          : "border-border text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <Icon className="size-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <SheetFooter className="flex-row border-t border-border">
              <Button variant="outline" className="flex-1">
                <Printer className="size-4" />
                Print
              </Button>
              <Button
                className="flex-1 bg-teal-600 text-white hover:bg-teal-600/90"
                disabled={cartItems.length === 0}
                onClick={() => {
                  toast.success("Order placed")
                  setCartOpen(false)
                }}
              >
                <Send className="size-4" />
                Place Order
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex flex-wrap gap-2">
        {statusFilters.map((filter) => {
          const active = statusFilter === filter.id
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => setStatusFilter(filter.id)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "border-teal-600 bg-teal-50 text-teal-700 dark:bg-teal-950/40"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {filter.label}
              {filter.id === "all" ? (
                <span className="text-xs text-muted-foreground">{filter.count}</span>
              ) : (
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full text-[11px] font-semibold text-white",
                    filter.dot
                  )}
                >
                  {String(filter.count).padStart(2, "0")}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <ScrollRow>
        {orderQueue.map((order) => (
          <OrderQueueCard key={order.id} order={order} />
        ))}
      </ScrollRow>

      <div>
        <h2 className="text-lg font-semibold">Foodies Menu</h2>
        <div className="mt-3">
          <ScrollRow>
            {menuCategories.map((cat) => {
              const Icon = categoryIcons[cat.icon]
              const active = category === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={cn(
                    "flex w-36 shrink-0 flex-col items-center gap-1 rounded-xl border p-3 text-center transition-colors",
                    active
                      ? "border-teal-600 bg-teal-50 dark:bg-teal-950/40"
                      : "border-border hover:bg-muted"
                  )}
                >
                  <Icon className={cn("size-5", active ? "text-teal-600" : "text-muted-foreground")} />
                  <span className="text-sm font-medium">{cat.label}</span>
                  <span className="text-xs text-muted-foreground">{cat.count} items</span>
                </button>
              )
            })}
            <button
              type="button"
              onClick={() => toast("Add category — coming soon")}
              className="flex w-36 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border p-3 text-center text-muted-foreground transition-colors hover:border-teal-600 hover:text-teal-600"
            >
              <Plus className="size-5" />
              <span className="text-sm font-medium">Add Category</span>
            </button>
          </ScrollRow>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {visibleItems.map((item) => (
          <MenuItemCard
            key={item.id}
            item={item}
            quantity={quantities[item.id] || 0}
            onChange={(value) => setQuantity(item.id, value)}
          />
        ))}
      </div>
    </div>
  )
}
