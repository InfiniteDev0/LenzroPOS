"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { usePowerSync, useQuery, useStatus } from "@powersync/react"
import {
  CreditCardIcon,
  LogOutIcon,
  MinusIcon,
  PlusIcon,
  SmartphoneIcon,
  Trash2Icon,
  WalletIcon,
  WifiOffIcon,
} from "lucide-react"

import { createClient } from "@lenzro/supabase/client"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/currency"
import { notifyError } from "@/lib/errors"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { VariantPickerDialog } from "@/components/variant-picker-dialog"

const PAYMENT_METHODS = [
  { id: "cash", label: "Cash", icon: WalletIcon },
  { id: "card", label: "Card", icon: CreditCardIcon },
  { id: "mobile", label: "Mobile", icon: SmartphoneIcon },
]

function cartKey(itemId, variantValueId) {
  return `${itemId}:${variantValueId ?? "base"}`
}

// Reassembles the flat local tables (categories/items/item_variants/
// item_variant_values are separate synced SQLite tables, not a nested
// Postgrest embed anymore) into the same item.item_variants[].
// item_variant_values[] shape the rest of this page and
// VariantPickerDialog already expect.
function assembleItems(rawItems, rawVariants, rawValues) {
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

  return (rawItems ?? []).map((item) => ({
    ...item,
    price: Number(item.price),
    item_variants: variantsByItem.get(item.id) ?? [],
  }))
}

export default function Page() {
  const router = useRouter()
  const powersync = usePowerSync()
  const status = useStatus()
  const [supabase] = useState(() => createClient())
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null))
  }, [supabase])

  const { data: categories } = useQuery("SELECT * FROM categories WHERE active = 1 ORDER BY name")
  const { data: rawItems } = useQuery(
    "SELECT * FROM items WHERE available_for_sale = 1 ORDER BY name"
  )
  const { data: rawVariants } = useQuery("SELECT * FROM item_variants")
  const { data: rawValues } = useQuery("SELECT * FROM item_variant_values")

  const items = useMemo(
    () => assembleItems(rawItems, rawVariants, rawValues),
    [rawItems, rawVariants, rawValues]
  )

  const [categoryFilter, setCategoryFilter] = useState("all")
  const [cart, setCart] = useState([])
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [checkingOut, setCheckingOut] = useState(false)
  const [variantItem, setVariantItem] = useState(null)

  const visibleItems = useMemo(
    () => (categoryFilter === "all" ? items : items.filter((i) => i.category_id === categoryFilter)),
    [items, categoryFilter]
  )

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
  const total = subtotal + tax
  const totalCount = cart.reduce((sum, line) => sum + line.quantity, 0)

  // Writes go to the local SQLite database first (near-instant, works
  // offline) — PowerSyncProvider's BackendConnector uploads them to
  // Supabase in the background whenever connectivity is available.
  async function handleCheckout() {
    setCheckingOut(true)
    const orderId = crypto.randomUUID()

    try {
      await powersync.execute(
        "INSERT INTO orders (id, subtotal, tax, total, payment_method) VALUES (?, ?, ?, ?, ?)",
        [orderId, subtotal, tax, total, paymentMethod]
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
    } catch (error) {
      notifyError(error, "Couldn't save the order")
    } finally {
      setCheckingOut(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/auth")
    router.refresh()
  }

  return (
    <div className="flex h-svh flex-col overflow-hidden">
      <header className="flex shrink-0 items-center justify-between border-b border-border px-6 py-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">Lenzro POS</h1>
            {!status.connected && (
              <Badge variant="outline" className="gap-1 rounded-full text-amber-700 dark:text-amber-400">
                <WifiOffIcon className="size-3" />
                Offline
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout} title="Log out">
          <LogOutIcon className="size-4" />
        </Button>
      </header>

      <div className="flex min-h-0 flex-1">
        <main className="min-w-0 flex-1 space-y-4 overflow-y-auto p-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategoryFilter("all")}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                categoryFilter === "all"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              All
            </button>
            {(categories ?? []).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  categoryFilter === cat.id
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {!status.hasSynced ? (
            <p className="py-16 text-center text-sm text-muted-foreground">Syncing menu…</p>
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
                  <Card
                    key={item.id}
                    className={cn(
                      "transition-colors",
                      quantity > 0 && "border-emerald-600 ring-1 ring-emerald-600/30"
                    )}
                  >
                    <CardContent className="flex flex-col gap-3 p-4">
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-lg font-semibold">{formatCurrency(item.price)}</p>
                      </div>

                      {hasVariants ? (
                        <Button
                          variant="outline"
                          className="h-10 w-full border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                          onClick={() => setVariantItem(item)}
                        >
                          Choose {item.item_variants[0].option_name}
                        </Button>
                      ) : (
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => decrementItem(item)}
                            disabled={quantity === 0}
                            className="flex size-10 items-center justify-center rounded-lg border border-border text-muted-foreground disabled:opacity-40"
                          >
                            <MinusIcon className="size-4" />
                          </button>
                          <span className="text-lg font-semibold tabular-nums">{quantity}</span>
                          <button
                            type="button"
                            onClick={() => addLine(item)}
                            className="flex size-10 items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-600/90"
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

        <aside className="flex w-full max-w-sm shrink-0 flex-col border-l border-border bg-background">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div>
              <h2 className="font-semibold">Current Order</h2>
              <p className="text-xs text-muted-foreground">
                {totalCount === 0 ? "No items yet" : `${totalCount} item${totalCount > 1 ? "s" : ""}`}
              </p>
            </div>
            {cart.length > 0 && (
              <Badge variant="outline" className="rounded-full">
                {formatCurrency(total)}
              </Badge>
            )}
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {cart.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Tap a menu item to add it here.
              </p>
            )}
            {cart.map((line) => (
              <div key={line.key} className="flex items-center justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{line.name}</p>
                  {line.variant_label && (
                    <p className="truncate text-xs text-muted-foreground">{line.variant_label}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(line.unit_price)} × {line.quantity} = {formatCurrency(line.unit_price * line.quantity)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setQuantity(line.key, line.quantity - 1)}
                    className="flex size-7 items-center justify-center rounded-full border border-border text-muted-foreground"
                  >
                    <MinusIcon className="size-3.5" />
                  </button>
                  <span className="w-4 text-center font-medium">{line.quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(line.key, line.quantity + 1)}
                    className="flex size-7 items-center justify-center rounded-full bg-emerald-600 text-white"
                  >
                    <PlusIcon className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeLine(line.key)}
                    className="flex size-7 items-center justify-center rounded-full text-destructive hover:bg-destructive/10"
                  >
                    <Trash2Icon className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3 border-t border-border p-4">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPaymentMethod(id)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border py-2 text-xs font-medium",
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

            <Button
              className="h-11 w-full bg-emerald-600 text-white hover:bg-emerald-600/90"
              disabled={cart.length === 0 || checkingOut}
              onClick={handleCheckout}
            >
              {checkingOut ? "Placing order…" : `Place order — ${formatCurrency(total)}`}
            </Button>
          </div>
        </aside>
      </div>

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
    </div>
  );
}
